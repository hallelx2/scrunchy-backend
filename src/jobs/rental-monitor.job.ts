import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SolanaService } from '../solana/solana.service';
import { PublicKey } from '@solana/web3.js';

@Injectable()
export class RentalMonitorJob {
  private readonly logger = new Logger(RentalMonitorJob.name);

  constructor(
    private prisma: PrismaService,
    private solana: SolanaService,
  ) {}

  /**
   * Check for expired rentals every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredRentals() {
    this.logger.log('Checking for expired rentals...');

    const expiredRentals = await this.prisma.rental.findMany({
      where: {
        status: 'ACTIVE',
        endTime: {
          lte: new Date(),
        },
      },
      include: {
        asset: true,
        listing: true,
      },
    });

    this.logger.log(`Found ${expiredRentals.length} expired rentals`);

    for (const rental of expiredRentals) {
      try {
        // Try to complete rental on-chain
        await this.completeRentalOnChain(rental);

        // Update database
        await this.prisma.rental.update({
          where: { id: rental.id },
          data: {
            status: 'EXPIRED',
            completedAt: new Date(),
          },
        });

        // Update listing
        await this.prisma.listing.update({
          where: { id: rental.listingId },
          data: { isAvailable: true },
        });

        // Update asset
        await this.prisma.asset.update({
          where: { id: rental.assetId },
          data: { currentlyRented: false },
        });

        this.logger.log(`Completed expired rental: ${rental.id}`);
      } catch (error) {
        this.logger.error(`Failed to complete rental ${rental.id}:`, error);
        // Mark as expired in database even if on-chain fails
        await this.prisma.rental.update({
          where: { id: rental.id },
          data: { status: 'EXPIRED' },
        });
      }
    }
  }

  /**
   * Check for rentals expiring soon (30 min warning)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiringRentals() {
    const thirtyMinutesFromNow = new Date(Date.now() + 30 * 60 * 1000);

    const expiringRentals = await this.prisma.rental.findMany({
      where: {
        status: 'ACTIVE',
        endTime: {
          lte: thirtyMinutesFromNow,
          gt: new Date(),
        },
      },
      include: {
        renter: true,
        asset: true,
      },
    });

    // TODO: Send notifications for expiring rentals
    if (expiringRentals.length > 0) {
      this.logger.log(`Found ${expiringRentals.length} rentals expiring soon`);
    }
  }

  private async completeRentalOnChain(rental: any) {
    try {
      const rentalPubkey = new PublicKey(rental.rentalId);
      const listingPubkey = new PublicKey(rental.listing.listingId);

      // Derive PDAs
      const [escrowPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('escrow'), rentalPubkey.toBuffer()],
        this.solana.marketplaceProgram.programId,
      );

      const [configPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('marketplace_config')],
        this.solana.marketplaceProgram.programId,
      );

      // Note: This requires a service account with signing capability
      // For now, just log - actual completion should be done via API endpoint
      this.logger.log(`Would complete rental ${rental.id} on-chain`);
    } catch (error) {
      this.logger.error(`Error preparing on-chain completion:`, error);
      throw error;
    }
  }
}

