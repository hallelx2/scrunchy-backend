import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SolanaService } from '../solana/solana.service';
import { GamesService } from '../games/games.service';
import { PublicKey } from '@solana/web3.js';

@Injectable()
export class SdkService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private solana: SolanaService,
    private gamesService: GamesService,
  ) {}

  /**
   * Check access for a wallet to an asset (fast, cached)
   */
  async checkAccess(gameId: string, walletAddress: string, assetId: string) {
    const cacheKey = `access:${gameId}:${walletAddress}:${assetId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      const result = {
        hasAccess: false,
        accessType: 'none',
        expiresAt: null,
      };
      await this.redis.set(cacheKey, result, 30);
      return result;
    }

    // Check if owner
    if (asset.ownerId === user.id) {
      const result = {
        hasAccess: true,
        accessType: 'owner',
        expiresAt: null,
      };
      await this.redis.set(cacheKey, result, 300);
      return result;
    }

    // Check active rental
    const activeRental = await this.prisma.rental.findFirst({
      where: {
        assetId: asset.id,
        renterId: user.id,
        status: 'ACTIVE',
        endTime: { gt: new Date() },
        gameId,
      },
    });

    if (activeRental) {
      const result = {
        hasAccess: true,
        accessType: 'renter',
        expiresAt: activeRental.endTime,
      };
      await this.redis.set(cacheKey, result, 30);
      return result;
    }

    const result = {
      hasAccess: false,
      accessType: 'none',
      expiresAt: null,
    };
    await this.redis.set(cacheKey, result, 30);
    return result;
  }

  /**
   * Get player assets with game-specific transformations
   */
  async getPlayerAssets(gameId: string, walletAddress: string) {
    const cacheKey = `player:${gameId}:${walletAddress}:assets`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return { assets: [], total: 0 };
    }

    // Get game config for transformations
    const gameConfig = await this.gamesService.getGameConfig(gameId);

    // Get owned and rented assets
    const [ownedAssets, rentedAssets] = await Promise.all([
      this.prisma.asset.findMany({
        where: { ownerId: user.id, isActive: true },
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
      this.prisma.rental.findMany({
        where: {
          renterId: user.id,
          status: 'ACTIVE',
          endTime: { gt: new Date() },
          gameId,
        },
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
      }),
    ]);

    // Transform assets with game config
    const transformedAssets = [
      ...ownedAssets.map(asset => this.transformAsset(asset, gameConfig, 'owner')),
      ...rentedAssets.map(rental => this.transformAsset(rental.asset, gameConfig, 'renter', rental.endTime)),
    ];

    const result = {
      assets: transformedAssets,
      total: transformedAssets.length,
    };

    await this.redis.set(cacheKey, result, 60); // Cache for 1 minute
    return result;
  }

  /**
   * Get single asset with game-specific transformations
   */
  async getAsset(gameId: string, assetId: string) {
    const cacheKey = `game:${gameId}:asset:${assetId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
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

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const gameConfig = await this.gamesService.getGameConfig(gameId);
    const transformed = this.transformAsset(asset, gameConfig, 'none');

    await this.redis.set(cacheKey, transformed, 600); // Cache for 10 minutes
    return transformed;
  }

  /**
   * Batch get assets
   */
  async batchGetAssets(gameId: string, assetIds: string[]) {
    const gameConfig = await this.gamesService.getGameConfig(gameId);

    const assets = await this.prisma.asset.findMany({
      where: {
        id: { in: assetIds },
        isActive: true,
      },
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

    return {
      assets: assets.map(asset => this.transformAsset(asset, gameConfig, 'none')),
    };
  }

  /**
   * Transform asset with game configuration
   */
  private transformAsset(
    asset: any,
    gameConfig: any,
    accessType: 'owner' | 'renter' | 'none',
    expiresAt?: Date,
  ) {
    // Apply attribute transformations
    const gameStats = this.transformAttributes(asset.baseAttributes, gameConfig.attributes);

    // Apply visual overrides
    const visuals = this.getVisuals(asset, gameConfig.visuals);

    // Get available actions
    const availableActions = this.getAvailableActions(asset, gameConfig.behaviors);

    return {
      id: asset.id,
      assetId: asset.assetId,
      mint: asset.mintAddress,
      name: asset.name,
      owner: asset.owner,
      // Universal attributes
      universalAttributes: asset.baseAttributes,
      // Game-specific transformations
      gameStats,
      visuals,
      availableActions,
      // Access info
      accessType,
      expiresAt: expiresAt?.toISOString(),
    };
  }

  /**
   * Transform universal attributes to game stats
   */
  private transformAttributes(universalAttrs: any, attributeConfig: any): Record<string, any> {
    if (!attributeConfig || !attributeConfig.mappings) {
      return {};
    }

    const gameStats: Record<string, any> = {};

    Object.entries(attributeConfig.mappings || {}).forEach(([key, mapping]: [string, any]) => {
      const sourceValue = universalAttrs[key];
      if (sourceValue === undefined) return;

      const transformed = this.applyTransform(sourceValue, mapping.transform);
      const constrained = this.applyConstraints(transformed, mapping);

      if (mapping.targetStat) {
        gameStats[mapping.targetStat] = constrained;
      }
    });

    return gameStats;
  }

  /**
   * Apply transformation function
   */
  private applyTransform(value: number, transform: any): number {
    if (!transform) return value;

    switch (transform.type) {
      case 'linear':
        return (value * (transform.multiplier || 1)) + (transform.offset || 0);
      case 'exponential':
        return Math.pow(transform.base || 2, value / (transform.scale || 1));
      case 'logarithmic':
        return (transform.multiplier || 1) * Math.log(value + (transform.offset || 1));
      case 'step':
        if (transform.steps) {
          for (const step of transform.steps) {
            if (value >= step.min && value <= step.max) {
              return step.output;
            }
          }
        }
        return value;
      case 'custom':
        // Evaluate custom function (in production, use a safe evaluator)
        try {
          // eslint-disable-next-line no-eval
          return eval(transform.customFunction.replace('sourceValue', String(value)));
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  /**
   * Apply constraints (min, max, round)
   */
  private applyConstraints(value: number, mapping: any): number {
    let result = value;
    if (mapping.min !== undefined) result = Math.max(result, mapping.min);
    if (mapping.max !== undefined) result = Math.min(result, mapping.max);
    if (mapping.roundTo !== undefined) {
      const factor = Math.pow(10, mapping.roundTo);
      result = Math.round(result * factor) / factor;
    }
    return result;
  }

  /**
   * Get visuals from game config
   */
  private getVisuals(asset: any, visualConfig: any): any {
    if (!visualConfig || !visualConfig.assetIcons) {
      return {
        iconUrl: asset.imageUrl,
      };
    }

    const typeIcons = visualConfig.assetIcons[asset.assetType];
    if (!typeIcons) {
      return { iconUrl: asset.imageUrl };
    }

    const rarityIcons = typeIcons[asset.rarity];
    if (!rarityIcons) {
      return { iconUrl: asset.imageUrl };
    }

    return {
      iconUrl: rarityIcons.iconUrl || asset.imageUrl,
      modelUrl: rarityIcons.modelUrl,
      animations: rarityIcons.animations || {},
      particles: rarityIcons.particles || {},
      sounds: rarityIcons.sounds || {},
    };
  }

  /**
   * Get available actions from behavior config
   */
  private getAvailableActions(asset: any, behaviorConfig: any): any[] {
    if (!behaviorConfig || !behaviorConfig.actions) {
      return [];
    }

    const actions: any[] = [];

    Object.entries(behaviorConfig.actions || {}).forEach(([actionId, action]: [string, any]) => {
      if (this.isActionAvailable(asset, action)) {
        actions.push({
          actionId,
          name: action.name,
          description: action.description,
          cooldown: action.constraints?.cooldown,
          isAvailable: true,
        });
      }
    });

    return actions;
  }

  /**
   * Check if action is available for asset
   */
  private isActionAvailable(asset: any, action: any): boolean {
    if (!action.availability) return true;

    const { assetTypes, rarities, customCondition } = action.availability;

    if (assetTypes && !assetTypes.includes(asset.assetType)) {
      return false;
    }

    if (rarities && !rarities.includes(asset.rarity)) {
      return false;
    }

    if (customCondition) {
      try {
        // eslint-disable-next-line no-eval
        return eval(customCondition.replace(/asset\./g, `asset.`));
      } catch {
        return false;
      }
    }

    return true;
  }
}
