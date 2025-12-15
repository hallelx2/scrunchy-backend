import { Module } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SolanaModule } from '../solana/solana.module';

@Module({
  imports: [PrismaModule, SolanaModule],
  providers: [IndexerService],
  exports: [IndexerService],
})
export class IndexerModule {}

