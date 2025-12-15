import { Module } from '@nestjs/common';
import { SdkService } from './sdk.service';
import { SdkController } from './sdk.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { SolanaModule } from '../solana/solana.module';
import { GamesModule } from '../games/games.module';

@Module({
  imports: [PrismaModule, RedisModule, SolanaModule, GamesModule],
  controllers: [SdkController],
  providers: [SdkService],
  exports: [SdkService],
})
export class SdkModule {}

