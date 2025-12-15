import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CacheWarmerJob {
  private readonly logger = new Logger(CacheWarmerJob.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Warm cache with top assets every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async warmAssetCache() {
    this.logger.log('Warming asset cache...');

    const topAssets = await this.prisma.asset.findMany({
      where: { isActive: true },
      orderBy: { totalRentals: 'desc' },
      take: 100,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
          },
        },
      },
    });

    for (const asset of topAssets) {
      await this.redis.set(`asset:${asset.id}`, asset, 300);
    }

    this.logger.log(`Warmed cache for ${topAssets.length} assets`);
  }

  /**
   * Warm cache with active listings every 30 minutes
   */
  @Cron('0 */30 * * * *') // Every 30 minutes
  async warmListingCache() {
    this.logger.log('Warming listing cache...');

    const activeListings = await this.prisma.listing.findMany({
      where: {
        isAvailable: true,
        isActive: true,
      },
      take: 50,
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
    });

    for (const listing of activeListings) {
      await this.redis.set(`listing:${listing.id}`, listing, 60);
    }

    this.logger.log(`Warmed cache for ${activeListings.length} listings`);
  }
}

