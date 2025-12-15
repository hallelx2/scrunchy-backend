import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedAssets: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        rentals: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            asset: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate stats
    const stats = {
      totalAssets: await this.prisma.asset.count({
        where: { ownerId: userId },
      }),
      totalRentals: await this.prisma.rental.count({
        where: { renterId: userId },
      }),
      totalRevenue: await this.prisma.rental.aggregate({
        where: { renterId: userId },
        _sum: { rentalPrice: true },
      }),
    };

    return {
      ...user,
      stats,
    };
  }

  async updateProfile(userId: string, data: { username?: string; email?: string; bio?: string; avatarUrl?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async getUserByWallet(walletAddress: string) {
    return this.prisma.user.findUnique({
      where: { walletAddress },
    });
  }
}

