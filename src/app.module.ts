import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { SolanaModule } from './solana/solana.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AssetsModule } from './assets/assets.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { GamesModule } from './games/games.module';
import { SdkModule } from './sdk/sdk.module';
import { IndexerModule } from './indexer/indexer.module';
import { AccessControlModule } from './access-control/access-control.module';
import { JobsModule } from './jobs/jobs.module';
import { MarketplacePackagesModule } from './marketplace-packages/marketplace-packages.module';
import { StorageModule } from './storage/storage.module';
import { HealthController } from './common/health/health.controller';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    SolanaModule,
    AuthModule,
    UsersModule,
    AssetsModule,
    MarketplaceModule,
    GamesModule,
    SdkModule,
    IndexerModule,
    AccessControlModule,
    JobsModule,
    MarketplacePackagesModule,
    StorageModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
