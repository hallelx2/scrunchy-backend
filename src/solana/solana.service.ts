import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
// Import IDL files - using require for runtime compatibility
// Path: From dist/src/solana/ → ../idl/ → dist/src/idl/
// eslint-disable-next-line @typescript-eslint/no-var-requires
const assetRegistryIdl = require('../idl/asset_registry.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const marketplaceIdl = require('../idl/marketplace.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const accessControlIdl = require('../idl/access_control.json');

@Injectable()
export class SolanaService implements OnModuleInit {
  private connection: Connection;
  private provider: AnchorProvider;
  public assetRegistryProgram: Program;
  public marketplaceProgram: Program;
  public accessControlProgram: Program;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const rpcUrl = this.configService.get<string>('solana.rpcUrl') || 'https://api.devnet.solana.com';
    const network = this.configService.get<string>('solana.network');

    this.connection = new Connection(rpcUrl, 'confirmed');

    // Initialize provider (using a dummy keypair for read-only operations)
    // In production, you'd use a proper keypair for transactions
    const dummyKeypair = Keypair.generate();
    const wallet = new Wallet(dummyKeypair);
    this.provider = new AnchorProvider(
      this.connection,
      wallet,
      { commitment: 'confirmed' }
    );

    // Initialize programs
    const assetRegistryProgramId = new PublicKey(
      this.configService.get<string>('solana.assetRegistryProgramId') || ''
    );
    const marketplaceProgramId = new PublicKey(
      this.configService.get<string>('solana.marketplaceProgramId') || ''
    );
    const accessControlProgramId = new PublicKey(
      this.configService.get<string>('solana.accessControlProgramId') || ''
    );

    // Initialize programs
    // Note: In Anchor 0.30, Program constructor is: new Program(idl, provider)
    // The programId is extracted from the IDL metadata or passed separately
    this.assetRegistryProgram = new Program(
      assetRegistryIdl as anchor.Idl,
      this.provider
    ) as any;
    // Set programId if not in IDL metadata
    if (!(this.assetRegistryProgram as any).programId) {
      Object.defineProperty(this.assetRegistryProgram, 'programId', {
        value: assetRegistryProgramId,
        writable: false,
        configurable: false,
      });
    }

    this.marketplaceProgram = new Program(
      marketplaceIdl as anchor.Idl,
      this.provider
    ) as any;
    if (!(this.marketplaceProgram as any).programId) {
      Object.defineProperty(this.marketplaceProgram, 'programId', {
        value: marketplaceProgramId,
        writable: false,
        configurable: false,
      });
    }

    this.accessControlProgram = new Program(
      accessControlIdl as anchor.Idl,
      this.provider
    ) as any;
    if (!(this.accessControlProgram as any).programId) {
      Object.defineProperty(this.accessControlProgram, 'programId', {
        value: accessControlProgramId,
        writable: false,
        configurable: false,
      });
    }
  }

  getConnection(): Connection {
    return this.connection;
  }

  getProvider(): AnchorProvider {
    return this.provider;
  }
}

