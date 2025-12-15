import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SolanaService } from '../solana/solana.service';
import { PinataService } from '../storage/pinata.service';
import { GetAssetsQueryDto, CreateAssetDto } from './dto/assets.dto';
import { PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

@Injectable()
export class AssetsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private solana: SolanaService,
    private pinata: PinataService,
  ) {}

  async findAll(query: GetAssetsQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
    };

    if (query.type) {
      where.assetType = query.type;
    }

    if (query.rarity) {
      where.rarity = query.rarity;
    }

    if (query.rentable !== undefined) {
      where.isRentable = query.rentable;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (query.sortBy === 'price') {
      orderBy.pricePerHour = query.order || 'asc';
    } else if (query.sortBy === 'rarity') {
      orderBy.rarity = query.order || 'desc';
    } else if (query.sortBy === 'popular') {
      orderBy.totalRentals = query.order || 'desc';
    } else {
      orderBy.createdAt = query.order || 'desc';
    }

    const [assets, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
            },
          },
        },
      }),
      this.prisma.asset.count({ where }),
    ]);

    return {
      assets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const cacheKey = `asset:${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
          },
        },
        listings: {
          where: { isAvailable: true, isActive: true },
          take: 1,
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    await this.redis.set(cacheKey, asset, 300); // Cache for 5 minutes
    return asset;
  }

  async findByMint(mintAddress: string) {
    return this.prisma.asset.findUnique({
      where: { mintAddress },
    });
  }

  /**
   * Create asset on-chain and index in database
   * Note: This is a template - actual implementation requires:
   * 1. NFT minting (using Metaplex or similar)
   * 2. Metadata upload to IPFS/Arweave
   * 3. Transaction signing by user's wallet
   */
  async createAsset(
    userId: string,
    dto: CreateAssetDto,
    mintKeypair?: Keypair,
  ): Promise<{ asset: any; transaction: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Upload image to IPFS via Pinata
    let imageIpfsUri = dto.imageUrl;
    if (this.pinata.isConfigured() && !dto.imageUrl.startsWith('ipfs://')) {
      // If image is a file buffer or URL, upload to Pinata
      // For now, we'll use the provided URL
      // In production, you'd upload the actual file
      imageIpfsUri = dto.imageUrl;
    }

    // Create and upload metadata JSON to IPFS
    const metadata = {
      name: dto.name,
      description: dto.description,
      image: imageIpfsUri,
      attributes: dto.baseAttributes || {},
      properties: {
        assetType: dto.assetType,
        rarity: dto.rarity,
        gameMappings: dto.gameMappings || {},
      },
    };

    let metadataUri = dto.imageUrl; // Fallback
    if (this.pinata.isConfigured()) {
      try {
        metadataUri = await this.pinata.uploadJSON(metadata, `${dto.name}-metadata`);
      } catch (error) {
        console.error('Failed to upload metadata to IPFS:', error);
        // Continue with fallback
      }
    }

    // Create mint keypair if not provided
    const mint = mintKeypair || Keypair.generate();
    const mintPubkey = mint.publicKey;

    // Convert DTO to Anchor types
    const assetType = this.mapAssetType(dto.assetType);
    const rarity = this.mapRarity(dto.rarity);
    const baseAttributes = this.mapAttributes(dto.baseAttributes || {});
    const gameMappings = this.mapGameMappings(dto.gameMappings || {});
    const rentalConfig = dto.rentalConfig
      ? {
          pricePerHour: new BN(dto.rentalConfig.pricePerHour || '0'),
          pricePerDay: new BN(dto.rentalConfig.pricePerDay || '0'),
          maxRentalDuration: new BN(dto.rentalConfig.maxRentalDuration || 0),
          minRentalDuration: new BN(dto.rentalConfig.minRentalDuration || 0),
          autoRenewal: false,
        }
      : null;

    try {
      // Derive PDAs
      const [gameAssetPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('game_asset'), mintPubkey.toBuffer()],
        this.solana.assetRegistryProgram.programId,
      );

      const [assetStatsPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('asset_stats'), gameAssetPDA.toBuffer()],
        this.solana.assetRegistryProgram.programId,
      );

      const authorityPubkey = new PublicKey(user.walletAddress);

      // Build transaction
      // Note: This requires the user's wallet to sign
      // In production, this would be done client-side or with a signing service
      const tx = await this.solana.assetRegistryProgram.methods
        .createAsset(
          dto.name,
          assetType,
          rarity,
          metadataUri,
          baseAttributes,
          gameMappings,
          rentalConfig,
        )
        .accounts({
          authority: authorityPubkey,
          gameAsset: gameAssetPDA,
          assetStats: assetStatsPDA,
          mint: mintPubkey,
          tokenAccount: authorityPubkey, // TODO: Derive token account
          tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          systemProgram: PublicKey.default,
          treasury: authorityPubkey, // TODO: Use platform treasury
          config: PublicKey.default, // TODO: Derive config PDA
        })
        .transaction();

      // For now, return the transaction to be signed client-side
      // In production, you might want to use a transaction signing service
      const transaction = Buffer.from(tx.serialize({ requireAllSignatures: false })).toString('base64');

      // Index in database (optimistically, before confirmation)
      const asset = await this.prisma.asset.create({
        data: {
          assetId: gameAssetPDA.toString(),
          mintAddress: mintPubkey.toString(),
          ownerId: user.id,
          name: dto.name,
          description: dto.description,
          imageUrl: dto.imageUrl,
          metadataUri,
          assetType: dto.assetType,
          rarity: dto.rarity,
          baseAttributes: dto.baseAttributes || {},
          gameMappings: dto.gameMappings || {},
          isRentable: !!dto.rentalConfig,
          pricePerHour: dto.rentalConfig?.pricePerHour
            ? BigInt(dto.rentalConfig.pricePerHour)
            : null,
          pricePerDay: dto.rentalConfig?.pricePerDay
            ? BigInt(dto.rentalConfig.pricePerDay)
            : null,
          maxRentalDuration: dto.rentalConfig?.maxRentalDuration || null,
          minRentalDuration: dto.rentalConfig?.minRentalDuration || null,
        },
      });

      // Invalidate cache
      await this.redis.del(`asset:${asset.id}`);

      return {
        asset,
        transaction,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to create asset: ${error.message}`);
    }
  }

  /**
   * Sync asset from blockchain
   */
  async syncFromChain(mintAddress: string) {
    try {
      const mintPubkey = new PublicKey(mintAddress);
      const [gameAssetPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('game_asset'), mintPubkey.toBuffer()],
        this.solana.assetRegistryProgram.programId,
      );

      const gameAsset = await (this.solana.assetRegistryProgram.account as any).gameAsset?.fetch(
        gameAssetPDA,
      );

      // Find or create asset in database
      const owner = await this.prisma.user.findUnique({
        where: { walletAddress: gameAsset.owner.toString() },
      });

      if (!owner) {
        throw new NotFoundException('Asset owner not found in database');
      }

      const asset = await this.prisma.asset.upsert({
        where: { mintAddress },
        update: {
          assetId: gameAssetPDA.toString(),
          ownerId: owner.id,
          name: gameAsset.name,
          description: null, // Not stored on-chain
          metadataUri: gameAsset.metadataUri,
          assetType: this.mapAssetTypeFromChain(gameAsset.assetType) as any,
          rarity: this.mapRarityFromChain(gameAsset.rarity) as any,
          isRentable: gameAsset.isRentable,
          isTransferable: gameAsset.isTransferable,
          isActive: gameAsset.isActive,
          lastSyncedAt: new Date(),
        },
        create: {
          assetId: gameAssetPDA.toString(),
          mintAddress,
          ownerId: owner.id,
          name: gameAsset.name,
          metadataUri: gameAsset.metadataUri,
          imageUrl: gameAsset.metadataUri, // TODO: Extract from metadata
          assetType: this.mapAssetTypeFromChain(gameAsset.assetType) as any,
          rarity: this.mapRarityFromChain(gameAsset.rarity) as any,
          baseAttributes: this.mapAttributesFromChain(gameAsset.baseAttributes),
          gameMappings: this.mapGameMappingsFromChain(gameAsset.gameMappings),
          isRentable: gameAsset.isRentable,
          isTransferable: gameAsset.isTransferable,
          isActive: gameAsset.isActive,
        },
      });

      // Invalidate cache
      await this.redis.del(`asset:${asset.id}`);

      return asset;
    } catch (error) {
      throw new BadRequestException(`Failed to sync asset: ${error.message}`);
    }
  }

  // Helper methods for type mapping
  private mapAssetType(type: string): any {
    const mapping: Record<string, any> = {
      WEAPON: { weapon: {} },
      ARMOR: { armor: {} },
      SKILL: { skill: {} },
      POWERUP: { powerUp: {} },
      CONSUMABLE: { consumable: {} },
      CHARACTER: { character: {} },
      VEHICLE: { vehicle: {} },
      OTHER: { other: {} },
    };
    return mapping[type] || mapping.OTHER;
  }

  private mapRarity(rarity: string): any {
    const mapping: Record<string, any> = {
      COMMON: { common: {} },
      UNCOMMON: { uncommon: {} },
      RARE: { rare: {} },
      EPIC: { epic: {} },
      LEGENDARY: { legendary: {} },
      MYTHIC: { mythic: {} },
    };
    return mapping[rarity] || mapping.COMMON;
  }

  private mapAttributes(attrs: Record<string, any>): any[] {
    return Object.entries(attrs).map(([key, value]) => ({
      key,
      value: String(value),
    }));
  }

  private mapGameMappings(mappings: Record<string, any>): any[] {
    return Object.entries(mappings).map(([gameId, attrs]) => ({
      gameId: new PublicKey(gameId),
      attributes: this.mapAttributes(attrs),
    }));
  }

  private mapAssetTypeFromChain(type: any): string {
    if (type.weapon) return 'WEAPON';
    if (type.armor) return 'ARMOR';
    if (type.skill) return 'SKILL';
    if (type.powerUp) return 'POWERUP';
    if (type.consumable) return 'CONSUMABLE';
    if (type.character) return 'CHARACTER';
    if (type.vehicle) return 'VEHICLE';
    return 'OTHER';
  }

  private mapRarityFromChain(rarity: any): string {
    if (rarity.common) return 'COMMON';
    if (rarity.uncommon) return 'UNCOMMON';
    if (rarity.rare) return 'RARE';
    if (rarity.epic) return 'EPIC';
    if (rarity.legendary) return 'LEGENDARY';
    if (rarity.mythic) return 'MYTHIC';
    return 'COMMON';
  }

  private mapAttributesFromChain(attrs: any[]): Record<string, any> {
    const result: Record<string, any> = {};
    attrs.forEach((attr) => {
      result[attr.key] = attr.value;
    });
    return result;
  }

  private mapGameMappingsFromChain(mappings: any[]): Record<string, any> {
    const result: Record<string, any> = {};
    mappings.forEach((mapping) => {
      result[mapping.gameId.toString()] = this.mapAttributesFromChain(mapping.attributes);
    });
    return result;
  }
}
