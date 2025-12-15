import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class MarketplacePackagesService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Get all marketplace packages
   */
  async findAll(query: any) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'approved',
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.minRating) {
      where.rating = { gte: parseFloat(query.minRating) };
    }

    const [packages, total] = await Promise.all([
      this.prisma.marketplacePackage.findMany({
        where,
        skip,
        take: limit,
        orderBy: query.sort === 'popular' ? { downloads: 'desc' } : { createdAt: 'desc' },
      }),
      this.prisma.marketplacePackage.count({ where }),
    ]);

    return {
      packages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get package details
   */
  async findOne(packageId: string) {
    const pkg = await this.prisma.marketplacePackage.findUnique({
      where: { packageId },
      include: {
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    return pkg;
  }

  /**
   * Install package to game
   */
  async installPackage(gameId: string, packageId: string, installationToken: string) {
    const pkg = await this.prisma.marketplacePackage.findUnique({
      where: { packageId },
    });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    // Check if already installed
    const existing = await this.prisma.packageInstallation.findUnique({
      where: {
        gameId_packageId: {
          gameId,
          packageId: pkg.id,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Package already installed');
    }

    // Create installation record
    const installation = await this.prisma.packageInstallation.create({
      data: {
        gameId,
        packageId: pkg.id,
        version: pkg.version,
      },
    });

    // Update package stats
    await this.prisma.marketplacePackage.update({
      where: { id: pkg.id },
      data: {
        activeInstalls: { increment: 1 },
      },
    });

    return {
      status: 'installed',
      installation,
    };
  }

  /**
   * Get installed packages for a game
   */
  async getInstalledPackages(gameId: string) {
    const installations = await this.prisma.packageInstallation.findMany({
      where: { gameId },
      include: {
        package: true,
      },
    });

    return {
      packages: installations.map(inst => ({
        packageId: inst.package.packageId,
        version: inst.version,
        installedAt: inst.installedAt,
        lastUsedAt: inst.lastUsedAt,
        updateAvailable: inst.version !== inst.package.version ? inst.package.version : null,
      })),
    };
  }

  /**
   * Create package (for developers)
   */
  async createPackage(userId: string, data: any) {
    // TODO: Validate user owns a game
    const packageId = `pkg_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const pkg = await this.prisma.marketplacePackage.create({
      data: {
        packageId,
        creatorId: userId, // TODO: Get game ID from user
        name: data.name,
        description: data.description,
        tagline: data.tagline,
        category: data.category,
        tags: data.tags || [],
        type: data.type,
        contentsUrl: data.contentsUrl,
        pricing: data.pricing || { model: 'free' },
        licenseType: data.licenseType || 'mit',
        thumbnailUrl: data.thumbnailUrl,
        screenshotUrls: data.screenshotUrls || [],
        compatibility: data.compatibility || {},
        version: data.version || '1.0.0',
        status: 'pending_review',
      },
    });

    return {
      packageId: pkg.packageId,
      status: pkg.status,
    };
  }
}

