import { Module } from '@nestjs/common';
import { MarketplacePackagesService } from './marketplace-packages.service';
import { MarketplacePackagesController } from './marketplace-packages.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { GamesModule } from '../games/games.module';

@Module({
  imports: [PrismaModule, RedisModule, GamesModule],
  controllers: [MarketplacePackagesController],
  providers: [MarketplacePackagesService],
  exports: [MarketplacePackagesService],
})
export class MarketplacePackagesModule {}

