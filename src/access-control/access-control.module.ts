import { Module } from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import { AccessControlController } from './access-control.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { SolanaModule } from '../solana/solana.module';
import { GamesModule } from '../games/games.module';

@Module({
  imports: [PrismaModule, RedisModule, SolanaModule, GamesModule],
  controllers: [AccessControlController],
  providers: [AccessControlService],
  exports: [AccessControlService],
})
export class AccessControlModule {}

