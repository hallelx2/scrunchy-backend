import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SolanaService } from '../solana/solana.service';

@Injectable()
export class IndexerService implements OnModuleInit {
  private readonly logger = new Logger(IndexerService.name);

  constructor(
    private prisma: PrismaService,
    private solana: SolanaService,
  ) {}

  async onModuleInit() {
    this.logger.log('Starting event indexer...');
    // TODO: Implement event listening
    // This would subscribe to program logs and index events
    await this.startListening();
  }

  async startListening() {
    // Subscribe to Asset Registry events
    this.solana.assetRegistryProgram.addEventListener('AssetCreated', async (event) => {
      await this.handleAssetCreated(event);
    });

    this.solana.assetRegistryProgram.addEventListener('AssetTransferred', async (event) => {
      await this.handleAssetTransferred(event);
    });

    this.solana.assetRegistryProgram.addEventListener('GameRegistered', async (event) => {
      await this.handleGameRegistered(event);
    });

    // Subscribe to Marketplace events
    this.solana.marketplaceProgram.addEventListener('ListingCreated', async (event) => {
      await this.handleListingCreated(event);
    });

    this.solana.marketplaceProgram.addEventListener('AssetRented', async (event) => {
      await this.handleAssetRented(event);
    });

    this.solana.marketplaceProgram.addEventListener('RentalCompleted', async (event) => {
      await this.handleRentalCompleted(event);
    });

    this.logger.log('Event listeners started');
  }

  async handleAssetCreated(event: any) {
    this.logger.log(`Asset created: ${event.mint.toString()}`);
    // Fetch full asset data and index in database
    // Implementation depends on your needs
  }

  async handleAssetTransferred(event: any) {
    this.logger.log(`Asset transferred: ${event.asset.toString()}`);
    // Update asset owner in database
  }

  async handleGameRegistered(event: any) {
    this.logger.log(`Game registered: ${event.game.toString()}`);
    // Index game registration
  }

  async handleListingCreated(event: any) {
    this.logger.log(`Listing created: ${event.listing.toString()}`);
    // Index listing
  }

  async handleAssetRented(event: any) {
    this.logger.log(`Asset rented: ${event.rental.toString()}`);
    // Index rental
  }

  async handleRentalCompleted(event: any) {
    this.logger.log(`Rental completed: ${event.rental.toString()}`);
    // Update rental status in database
  }
}

