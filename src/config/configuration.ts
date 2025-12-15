export default () => ({
  port: parseInt(process.env.PORT || '3000', 10) || 3000,
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  solana: {
    network: process.env.SOLANA_NETWORK || 'devnet',
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    assetRegistryProgramId: process.env.ASSET_REGISTRY_PROGRAM_ID,
    marketplaceProgramId: process.env.MARKETPLACE_PROGRAM_ID,
    accessControlProgramId: process.env.ACCESS_CONTROL_PROGRAM_ID,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiry: process.env.JWT_EXPIRY || '7d',
  },
  platform: {
    treasury: process.env.PLATFORM_TREASURY,
    feeBps: parseInt(process.env.PLATFORM_FEE_BPS || '250', 10) || 250,
  },
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3Bucket: process.env.S3_BUCKET,
  },
  ipfs: {
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecret: process.env.PINATA_SECRET,
  },
});

