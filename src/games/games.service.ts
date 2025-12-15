import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import * as crypto from 'crypto';
import { CreateGameDto, CreateApiKeyDto, UpdateGameConfigDto } from './dto/games.dto';
import { PublicKey } from '@solana/web3.js';

@Injectable()
export class GamesService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll() {
    return this.prisma.game.findMany({
      where: { isActive: true },
      include: {
        developer: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.game.findUnique({
      where: { id },
      include: {
        developer: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
          },
        },
      },
    });
  }

  async findByGameId(gameId: string) {
    return this.prisma.game.findUnique({
      where: { gameId },
    });
  }

  /**
   * Register game on-chain and create database record
   */
  async registerGame(userId: string, dto: CreateGameDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate API key
    const apiKey = `sk_live_${crypto.randomBytes(32).toString('hex')}`;

    // Create game in database first
    const game = await this.prisma.game.create({
      data: {
        gameId: `game_${crypto.randomBytes(16).toString('hex')}`, // Temporary, will be updated with on-chain pubkey
        developerId: user.id,
        name: dto.name,
        description: dto.description,
        websiteUrl: dto.websiteUrl,
        logoUrl: dto.logoUrl,
        apiKey,
        supportedTypes: dto.supportedTypes,
        config: {
          version: '1.0.0',
          visuals: {},
          attributes: {},
          behaviors: {},
          filters: {},
        },
      },
    });

    // TODO: Register on-chain and update gameId with actual pubkey
    // For now, return the game with temporary ID

    return {
      game,
      apiKey, // Show only once!
    };
  }

  /**
   * Create API key for a game
   */
  async createApiKey(gameId: string, userId: string, dto: CreateApiKeyDto) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game || game.developerId !== userId) {
      throw new UnauthorizedException('You do not own this game');
    }

    const apiKey = `sk_${dto.environment === 'test' ? 'test' : 'live'}_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyPrefix = apiKey.substring(0, 10);

    await this.prisma.gameApiKey.create({
      data: {
        gameId,
        keyHash,
        keyPrefix,
        environment: dto.environment || 'production',
        permissions: dto.permissions || [],
        rateLimitPerMinute: dto.rateLimitPerMinute || 300,
        burstLimit: (dto.rateLimitPerMinute || 300) * 2,
      },
    });

    return { apiKey, keyPrefix };
  }

  /**
   * List API keys for a game
   */
  async listApiKeys(gameId: string, userId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game || game.developerId !== userId) {
      throw new UnauthorizedException('You do not own this game');
    }

    const keys = await this.prisma.gameApiKey.findMany({
      where: {
        gameId,
        revokedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      keys: keys.map(key => ({
        id: key.id,
        prefix: key.keyPrefix,
        environment: key.environment,
        permissions: key.permissions,
        rateLimitPerMinute: key.rateLimitPerMinute,
        lastUsedAt: key.lastUsedAt,
        createdAt: key.createdAt,
      })),
    };
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(gameId: string, userId: string, keyId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game || game.developerId !== userId) {
      throw new UnauthorizedException('You do not own this game');
    }

    const apiKey = await this.prisma.gameApiKey.findUnique({
      where: { id: keyId },
    });

    if (!apiKey || apiKey.gameId !== gameId) {
      throw new NotFoundException('API key not found');
    }

    await this.prisma.gameApiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });

    // Invalidate cache
    await this.redis.del(`apikey:${apiKey.keyHash}`);

    return { success: true };
  }

  async verifyApiKey(apiKey: string): Promise<string | null> {
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Check cache first
    const cacheKey = `apikey:${keyHash}`;
    const cached = await this.redis.get<string>(cacheKey);
    if (cached && typeof cached === 'string') {
      return cached;
    }

    const apiKeyRecord = await this.prisma.gameApiKey.findUnique({
      where: { keyHash },
      include: { game: true },
    });

    if (!apiKeyRecord || apiKeyRecord.revokedAt || !apiKeyRecord.game.isActive) {
      return null;
    }

    // Update last used
    await this.prisma.gameApiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    // Cache for 1 hour
    await this.redis.set(cacheKey, apiKeyRecord.gameId, 3600);

    return apiKeyRecord.gameId;
  }

  /**
   * Get game configuration
   */
  async getGameConfig(gameId: string) {
    const cacheKey = `game:${gameId}:config`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const configData = game.config as any || {};
    const config = {
      version: game.configVersion,
      visuals: configData['visuals'] || {},
      attributes: configData['attributes'] || {},
      behaviors: configData['behaviors'] || {},
      filters: configData['filters'] || {},
      updatedAt: game.updatedAt,
    };

    await this.redis.set(cacheKey, config, 300); // Cache for 5 minutes
    return config;
  }

  /**
   * Update game configuration
   */
  async updateGameConfig(gameId: string, userId: string, dto: UpdateGameConfigDto) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game || game.developerId !== userId) {
      throw new UnauthorizedException('You do not own this game');
    }

    // Get current config
    const currentConfig = game.config as any;
    const changes: string[] = [];

    // Update config
    const newConfig = { ...currentConfig };
    if (dto.visuals) {
      newConfig.visuals = { ...newConfig.visuals, ...dto.visuals };
      changes.push('visuals');
    }
    if (dto.attributes) {
      newConfig.attributes = { ...newConfig.attributes, ...dto.attributes };
      changes.push('attributes');
    }
    if (dto.behaviors) {
      newConfig.behaviors = { ...newConfig.behaviors, ...dto.behaviors };
      changes.push('behaviors');
    }
    if (dto.filters) {
      newConfig.filters = { ...newConfig.filters, ...dto.filters };
      changes.push('filters');
    }

    // Increment version
    const versionParts = game.configVersion.split('.');
    const patchVersion = parseInt(versionParts[2] || '0') + 1;
    const newVersion = `${versionParts[0]}.${versionParts[1]}.${patchVersion}`;

    // Save config history
    await this.prisma.gameConfigHistory.create({
      data: {
        gameId,
        version: game.configVersion,
        config: currentConfig,
        changes: [],
        updatedBy: userId,
      },
    });

    // Update game config
    const updatedGame = await this.prisma.game.update({
      where: { id: gameId },
      data: {
        config: newConfig,
        configVersion: newVersion,
      },
    });

    // Invalidate cache
    await this.redis.del(`game:${gameId}:config`);
    await this.redis.delPattern(`game:${gameId}:asset:*`); // Invalidate all asset transformations

    return {
      version: newVersion,
      updated: changes,
      updatedAt: updatedGame.updatedAt,
    };
  }

  /**
   * Get configuration history
   */
  async getConfigHistory(gameId: string, userId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game || game.developerId !== userId) {
      throw new UnauthorizedException('You do not own this game');
    }

    const history = await this.prisma.gameConfigHistory.findMany({
      where: { gameId },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      versions: history.map(h => ({
        version: h.version,
        updatedAt: h.updatedAt,
        updatedBy: h.updatedBy,
        changes: h.changes,
      })),
    };
  }

  /**
   * Rollback to previous config version
   */
  async rollbackConfig(gameId: string, userId: string, version: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game || game.developerId !== userId) {
      throw new UnauthorizedException('You do not own this game');
    }

    const history = await this.prisma.gameConfigHistory.findUnique({
      where: {
        gameId_version: {
          gameId,
          version,
        },
      },
    });

    if (!history) {
      throw new NotFoundException('Config version not found');
    }

    // Increment version
    const versionParts = game.configVersion.split('.');
    const patchVersion = parseInt(versionParts[2] || '0') + 1;
    const newVersion = `${versionParts[0]}.${versionParts[1]}.${patchVersion}`;

    // Save current config to history
    await this.prisma.gameConfigHistory.create({
      data: {
        gameId,
        version: game.configVersion,
        config: game.config as any,
        changes: ['rollback'],
        updatedBy: userId,
      },
    });

    // Restore config
    const updatedGame = await this.prisma.game.update({
      where: { id: gameId },
      data: {
        config: history.config as any,
        configVersion: newVersion,
      },
    });

    // Invalidate cache
    await this.redis.del(`game:${gameId}:config`);
    await this.redis.delPattern(`game:${gameId}:asset:*`);

    return {
      version: newVersion,
        config: history.config as any,
      updatedAt: updatedGame.updatedAt,
    };
  }
}
