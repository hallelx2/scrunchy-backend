import { Module } from '@nestjs/common';
import { RentalMonitorJob } from './rental-monitor.job';
import { CacheWarmerJob } from './cache-warmer.job';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { SolanaModule } from '../solana/solana.module';

@Module({
  imports: [PrismaModule, RedisModule, SolanaModule],
  providers: [RentalMonitorJob, CacheWarmerJob],
})
export class JobsModule {}

