import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SolanaService } from '../solana/solana.service';
import { CreateListingDto, RentAssetDto, UpdateListingDto } from './dto/marketplace.dto';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

@Injectable()
export class MarketplaceService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private solana: SolanaService,
  ) {}

  async getListings(query: any) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      isAvailable: true,
      isActive: true,
    };

    if (query.priceMin) {
      where.pricePerHour = { gte: BigInt(query.priceMin) };
    }

    if (query.priceMax) {
      where.pricePerHour = { ...where.pricePerHour, lte: BigInt(query.priceMax) };
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        include: {
          asset: {
            include: {
              owner: {
                select: {
                  id: true,
                  username: true,
                  walletAddress: true,
                },
              },
            },
          },
        },
        orderBy: { listedAt: 'desc' },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create listing on-chain and index in database
   */
  async createListing(userId: string, dto: CreateListingDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const asset = await this.prisma.asset.findUnique({
      where: { id: dto.assetId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    if (asset.ownerId !== user.id) {
      throw new ForbiddenException('You do not own this asset');
    }

    if (!asset.isRentable) {
      throw new BadRequestException('Asset is not rentable');
    }

    try {
      const gameAssetPubkey = new PublicKey(asset.assetId);
      const mintPubkey = new PublicKey(asset.mintAddress);

      // Derive listing PDA
      const [listingPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('listing'), gameAssetPubkey.toBuffer()],
        this.solana.marketplaceProgram.programId,
      );

      // Derive config PDA
      const [configPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('marketplace_config')],
        this.solana.marketplaceProgram.programId,
      );

      const authorityPubkey = new PublicKey(user.walletAddress);

      // Build transaction
      const tx = await this.solana.marketplaceProgram.methods
        .createListing(
          new BN(dto.pricePerHour),
          new BN(dto.pricePerDay),
          new BN(dto.maxRentalDuration),
          new BN(dto.minRentalDuration),
          dto.autoRenewal || false,
        )
        .accounts({
          authority: authorityPubkey,
          gameAsset: gameAssetPubkey,
          listing: listingPDA,
          mint: mintPubkey,
          tokenAccount: authorityPubkey, // TODO: Derive token account
          config: configPDA,
          treasury: authorityPubkey, // TODO: Use platform treasury
          systemProgram: PublicKey.default,
        })
        .transaction();

      const transaction = Buffer.from(tx.serialize({ requireAllSignatures: false })).toString('base64');

      // Index in database
      const listing = await this.prisma.listing.create({
        data: {
          listingId: listingPDA.toString(),
          assetId: asset.id,
          ownerId: user.id,
          pricePerHour: BigInt(dto.pricePerHour),
          pricePerDay: BigInt(dto.pricePerDay),
          maxRentalDuration: dto.maxRentalDuration,
          minRentalDuration: dto.minRentalDuration,
          autoRenewal: dto.autoRenewal || false,
        },
      });

      // Update asset
      await this.prisma.asset.update({
        where: { id: asset.id },
        data: { isListed: true },
      });

      // Invalidate cache
      await this.redis.del(`listing:${listing.id}`);
      await this.redis.del(`asset:${asset.id}`);

      return {
        listing,
        transaction,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to create listing: ${error.message}`);
    }
  }

  /**
   * Rent asset on-chain
   */
  async rentAsset(userId: string, dto: RentAssetDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      include: {
        asset: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (!listing.isAvailable || !listing.isActive) {
      throw new BadRequestException('Listing is not available');
    }

    if (listing.ownerId === user.id) {
      throw new BadRequestException('Cannot rent your own asset');
    }

    if (dto.duration < listing.minRentalDuration || dto.duration > listing.maxRentalDuration) {
      throw new BadRequestException('Invalid rental duration');
    }

    try {
      const listingPubkey = new PublicKey(listing.listingId);
      const gameAssetPubkey = new PublicKey(listing.asset.assetId);
      const renterPubkey = new PublicKey(user.walletAddress);
      const owner = await this.prisma.user.findUnique({
        where: { id: listing.asset.ownerId },
      });
      if (!owner) throw new NotFoundException('Owner not found');
      const ownerPubkey = new PublicKey(owner.walletAddress);

      // Derive rental PDA
      const [rentalPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('rental'),
          gameAssetPubkey.toBuffer(),
          renterPubkey.toBuffer(),
        ],
        this.solana.marketplaceProgram.programId,
      );

      // Derive escrow PDA
      const [escrowPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('escrow'), rentalPDA.toBuffer()],
        this.solana.marketplaceProgram.programId,
      );

      // Calculate rental price
      const hours = Math.ceil(dto.duration / 3600);
      const days = Math.floor(dto.duration / 86400);
      const rentalPrice = days > 0
        ? BigInt(listing.pricePerDay.toString()) * BigInt(days) +
          BigInt(listing.pricePerHour.toString()) * BigInt(hours % 24)
        : BigInt(listing.pricePerHour.toString()) * BigInt(hours);

      // Derive config PDA
      const [configPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('marketplace_config')],
        this.solana.marketplaceProgram.programId,
      );

      const gameAccount = dto.gameId ? new PublicKey(dto.gameId) : null;

      // Build transaction
      const tx = await this.solana.marketplaceProgram.methods
        .rentAsset(
          new BN(dto.duration),
          gameAccount ? { some: gameAccount } : null,
        )
        .accounts({
          renter: renterPubkey,
          owner: ownerPubkey,
          gameAsset: gameAssetPubkey,
          listing: listingPubkey,
          rental: rentalPDA,
          escrowAccount: escrowPDA,
          escrow: escrowPDA,
          config: configPDA,
          gameAccount: gameAccount || PublicKey.default,
          systemProgram: PublicKey.default,
        })
        .transaction();

      const transaction = Buffer.from(tx.serialize({ requireAllSignatures: false })).toString('base64');

      // Calculate times
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + dto.duration * 1000);

      // Index in database
      const rental = await this.prisma.rental.create({
        data: {
          rentalId: rentalPDA.toString(),
          assetId: listing.assetId,
          listingId: listing.id,
          renterId: user.id,
          gameId: dto.gameId || null,
          rentalPrice,
          duration: dto.duration,
          startTime,
          endTime,
          status: 'ACTIVE',
        },
      });

      // Update listing
      await this.prisma.listing.update({
        where: { id: listing.id },
        data: {
          totalRentals: { increment: 1 },
          isAvailable: false,
        },
      });

      // Update asset
      await this.prisma.asset.update({
        where: { id: listing.assetId },
        data: { currentlyRented: true },
      });

      // Invalidate cache
      await this.redis.delPattern(`access:${listing.asset.mintAddress}:*`);

      return {
        rental,
        transaction,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to rent asset: ${error.message}`);
    }
  }

  /**
   * Complete rental and distribute payments
   */
  async completeRental(userId: string, rentalId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const rental = await this.prisma.rental.findUnique({
      where: { id: rentalId },
      include: { asset: true, listing: true },
    });

    if (!rental) {
      throw new NotFoundException('Rental not found');
    }

    if (rental.status !== 'ACTIVE') {
      throw new BadRequestException('Rental is not active');
    }

    // Check permissions (owner, renter, or expired)
    const isOwner = rental.asset.ownerId === user.id;
    const isRenter = rental.renterId === user.id;
    const isExpired = rental.endTime < new Date();

    if (!isOwner && !isRenter && !isExpired) {
      throw new ForbiddenException('You do not have permission to complete this rental');
    }

    // Get owner for transaction
    const owner = await this.prisma.user.findUnique({
      where: { id: rental.asset.ownerId },
    });
    if (!owner) throw new NotFoundException('Owner not found');

    try {
      const rentalPubkey = new PublicKey(rental.rentalId);
      const listingPubkey = new PublicKey(rental.listing.listingId);
      const ownerPubkey = new PublicKey(owner.walletAddress);

      // Derive escrow PDA
      const [escrowPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('escrow'), rentalPubkey.toBuffer()],
        this.solana.marketplaceProgram.programId,
      );

      // Derive config PDA
      const [configPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('marketplace_config')],
        this.solana.marketplaceProgram.programId,
      );

      const gameAccount = rental.gameId ? new PublicKey(rental.gameId) : null;

      // Build transaction
      const tx = await this.solana.marketplaceProgram.methods
        .completeRental()
        .accounts({
          rental: rentalPubkey,
          escrowAccount: escrowPDA,
          owner: ownerPubkey,
          treasury: PublicKey.default, // TODO: Use platform treasury
          gameAccount: gameAccount || PublicKey.default,
          listing: listingPubkey,
          assetStats: PublicKey.default, // TODO: Derive asset stats PDA
          config: configPDA,
        })
        .transaction();

      const transaction = Buffer.from(tx.serialize({ requireAllSignatures: false })).toString('base64');

      // Update rental status
      const updatedRental = await this.prisma.rental.update({
        where: { id: rental.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Update listing
      await this.prisma.listing.update({
        where: { id: rental.listingId },
        data: {
          isAvailable: true,
          totalRevenue: { increment: rental.rentalPrice },
        },
      });

      // Update asset
      await this.prisma.asset.update({
        where: { id: rental.assetId },
        data: { currentlyRented: false },
      });

      // Invalidate cache
      await this.redis.delPattern(`access:${rental.asset.mintAddress}:*`);

      return {
        rental: updatedRental,
        transaction,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to complete rental: ${error.message}`);
    }
  }

  async getRentals(userId: string, query: any) {
    const where: any = { renterId: userId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.active === 'true') {
      where.status = 'ACTIVE';
      where.endTime = { gt: new Date() };
    }

    const rentals = await this.prisma.rental.findMany({
      where,
      include: {
        asset: true,
        listing: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return rentals.map(rental => ({
      ...rental,
      timeRemaining: rental.endTime > new Date()
        ? Math.floor((rental.endTime.getTime() - Date.now()) / 1000)
        : 0,
    }));
  }

  async updateListing(userId: string, listingId: string, dto: UpdateListingDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { owner: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.ownerId !== userId) {
      throw new ForbiddenException('You do not own this listing');
    }

    const listingPubkey = new PublicKey(listing.listingId);

    // Derive config PDA
    const [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('marketplace_config')],
      this.solana.marketplaceProgram.programId,
    );

    // Build transaction
    const tx = await this.solana.marketplaceProgram.methods
      .updateListing(
        dto.pricePerHour ? { some: new BN(dto.pricePerHour) } : null,
        dto.pricePerDay ? { some: new BN(dto.pricePerDay) } : null,
        dto.maxRentalDuration ? { some: new BN(dto.maxRentalDuration) } : null,
        dto.isAvailable !== undefined ? { some: dto.isAvailable } : null,
      )
      .accounts({
        authority: new PublicKey(listing.owner.walletAddress),
        listing: listingPubkey,
        config: configPDA,
      })
      .transaction();

    const transaction = Buffer.from(tx.serialize({ requireAllSignatures: false })).toString('base64');

    // Update in database
    const updatedListing = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        ...(dto.pricePerHour && { pricePerHour: BigInt(dto.pricePerHour) }),
        ...(dto.pricePerDay && { pricePerDay: BigInt(dto.pricePerDay) }),
        ...(dto.maxRentalDuration && { maxRentalDuration: dto.maxRentalDuration }),
        ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
      },
    });

    await this.redis.del(`listing:${listingId}`);

    return {
      listing: updatedListing,
      transaction,
    };
  }
}
