import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { SolanaService } from '../../solana/solana.service';

@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private solana: SolanaService,
  ) {}

  @Get()
  async health() {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
        solana: await this.checkSolana(),
      },
    };

    const allHealthy = Object.values(checks.services).every(s => s.status === 'ok');
    return {
      ...checks,
      status: allHealthy ? 'ok' : 'degraded',
    };
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  private async checkRedis() {
    try {
      await this.redis.getClient().ping();
      return { status: 'ok' };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  private async checkSolana() {
    try {
      const blockHeight = await this.solana.getConnection().getBlockHeight();
      return { status: 'ok', blockHeight };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
}

