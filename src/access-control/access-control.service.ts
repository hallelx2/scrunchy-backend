import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SolanaService } from '../solana/solana.service';
import { PublicKey } from '@solana/web3.js';

@Injectable()
export class AccessControlService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private solana: SolanaService,
  ) {}

  /**
   * Verify access for a wallet to an asset
   * Checks both database and on-chain state
   */
  async verifyAccess(
    mintAddress: string,
    walletAddress: string,
  ): Promise<{
    hasAccess: boolean;
    accessType: 'owner' | 'renter' | 'none';
    expiresAt?: Date;
    rentalId?: string;
  }> {
    const cacheKey = `access:${mintAddress}:${walletAddress}`;
    const cached = await this.redis.get<{ hasAccess: boolean; accessType: 'owner' | 'renter' | 'none'; expiresAt?: Date; rentalId?: string }>(cacheKey);
    if (cached) {
      return cached as { hasAccess: boolean; accessType: 'owner' | 'renter' | 'none'; expiresAt?: Date; rentalId?: string };
    }

    try {
      // Check on-chain first (source of truth)
      const accessRecord = await this.getAccessRecordOnChain(mintAddress);
      
      if (!accessRecord) {
        const result = { hasAccess: false, accessType: 'none' as const };
        await this.redis.set(cacheKey, result, 30);
        return result;
      }

      const walletPubkey = new PublicKey(walletAddress);

      // Check if owner
      if (accessRecord.owner.equals(walletPubkey)) {
        const result = {
          hasAccess: true,
          accessType: 'owner' as const,
        };
        await this.redis.set(cacheKey, result, 300); // Cache longer for owners
        return result;
      }

      // Check active rental
      if (accessRecord.activeRental) {
        const now = Math.floor(Date.now() / 1000);
        if (
          accessRecord.activeRental.renter.equals(walletPubkey) &&
          accessRecord.activeRental.expiry > now
        ) {
          const result = {
            hasAccess: true,
            accessType: 'renter' as const,
            expiresAt: new Date(accessRecord.activeRental.expiry * 1000),
            rentalId: accessRecord.activeRental.rental.toString(),
          };
          await this.redis.set(cacheKey, result, 30);
          return result;
        }
      }

      const result = { hasAccess: false, accessType: 'none' as const };
      await this.redis.set(cacheKey, result, 30);
      return result;
    } catch (error) {
      // Fallback to database check if on-chain fails
      return this.verifyAccessFromDatabase(mintAddress, walletAddress);
    }
  }

  /**
   * Get access record from on-chain
   */
  private async getAccessRecordOnChain(mintAddress: string) {
    try {
      const [accessRecordPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('access_record'),
          new PublicKey(mintAddress).toBuffer(),
        ],
        this.solana.accessControlProgram.programId,
      );

      const accessRecord = await (this.solana.accessControlProgram.account as any).accessRecord?.fetch(
        accessRecordPDA,
      );

      return accessRecord;
    } catch (error) {
      return null;
    }
  }

  /**
   * Fallback: Verify access from database
   */
  private async verifyAccessFromDatabase(
    mintAddress: string,
    walletAddress: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return { hasAccess: false, accessType: 'none' as const };
    }

    const asset = await this.prisma.asset.findUnique({
      where: { mintAddress },
    });

    if (!asset) {
      return { hasAccess: false, accessType: 'none' as const };
    }

    // Check ownership
    if (asset.ownerId === user.id) {
      return { hasAccess: true, accessType: 'owner' as const };
    }

    // Check active rental
    const activeRental = await this.prisma.rental.findFirst({
      where: {
        assetId: asset.id,
        renterId: user.id,
        status: 'ACTIVE',
        endTime: { gt: new Date() },
      },
    });

    if (activeRental) {
      return {
        hasAccess: true,
        accessType: 'renter' as const,
        expiresAt: activeRental.endTime,
        rentalId: activeRental.id,
      };
    }

    return { hasAccess: false, accessType: 'none' as const };
  }

  /**
   * Invalidate access cache for an asset
   */
  async invalidateAccessCache(mintAddress: string, walletAddress?: string) {
    if (walletAddress) {
      await this.redis.del(`access:${mintAddress}:${walletAddress}`);
    } else {
      await this.redis.delPattern(`access:${mintAddress}:*`);
    }
  }

  /**
   * Batch verify access for multiple assets
   */
  async batchVerifyAccess(
    mintAddresses: string[],
    walletAddress: string,
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    await Promise.all(
      mintAddresses.map(async (mint) => {
        results[mint] = await this.verifyAccess(mint, walletAddress);
      }),
    );

    return results;
  }
}

