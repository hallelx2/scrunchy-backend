# Environment Configuration Guide

## Quick Setup

### 1. Create .env File
```bash
cd scrunchy-backend
cp .env.example .env
```

### 2. Required Configuration

#### ✅ **MUST CONFIGURE** (Critical)

**Database (PostgreSQL)**
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/scrunchy_db
```

**How to setup PostgreSQL:**
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE scrunchy_db;
CREATE USER scrunchy_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE scrunchy_db TO scrunchy_user;
\q
```

**Redis**
```bash
REDIS_URL=redis://localhost:6379
```

**How to setup Redis:**
```bash
# Install Redis (Ubuntu/Debian)
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis
redis-cli ping
# Should return: PONG
```

**JWT Secret**
```bash
# Generate a secure secret
openssl rand -base64 32

# Add to .env
JWT_SECRET=<generated-secret>
```

**Solana Program IDs**
```bash
# These are already set from your deployed contracts
ASSET_REGISTRY_PROGRAM_ID=7vxpftgcdbh6NW77uAGVxp4aM2RcbQtmeGixNp2ifCDn
MARKETPLACE_PROGRAM_ID=G46EH6LskmJpBTvZNewSL4Xe5fkdbcdkMpRM8wQ9T3RH
ACCESS_CONTROL_PROGRAM_ID=n41USxoi9Lf1RyZUVAfCHD5TSeuDBuqDxEpUHzkDqf2
```

#### ⚠️ **RECOMMENDED** (For Production)

**Solana RPC Provider**
- **Free (Devnet)**: `https://api.devnet.solana.com` ✅ Already set
- **Free (Mainnet)**: `https://api.mainnet-beta.solana.com` (rate-limited)
- **Recommended Paid Providers**:
  - **Helius**: https://www.helius.dev (best for production)
  - **QuickNode**: https://www.quicknode.com
  - **Triton**: https://triton.one

**Platform Treasury**
```bash
# Your Solana wallet address that receives platform fees
PLATFORM_TREASURY=YOUR_SOLANA_WALLET_ADDRESS
```

#### 🔧 **OPTIONAL** (Can be added later)

**AWS S3** (for file uploads)
- Create AWS account
- Create S3 bucket
- Create IAM user with S3 permissions
- Add credentials to .env

**IPFS/Pinata** (for decentralized storage)
- Sign up at https://pinata.cloud
- Create API key
- Add to .env

**Sentry** (for error tracking)
- Sign up at https://sentry.io
- Create project
- Get DSN
- Add to .env

## Configuration Examples

### Development Setup
```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://scrunchy_user:dev_password@localhost:5432/scrunchy_dev
REDIS_URL=redis://localhost:6379
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
JWT_SECRET=dev-secret-key-change-in-production
PLATFORM_TREASURY=YOUR_DEVNET_WALLET
```

### Production Setup
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:strong_password@db.example.com:5432/scrunchy_prod
REDIS_URL=redis://redis.example.com:6379
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY
JWT_SECRET=<strong-random-secret-32-chars-min>
PLATFORM_TREASURY=YOUR_MAINNET_TREASURY_WALLET
PLATFORM_FEE_BPS=250
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOUR_AWS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET
S3_BUCKET=scrunchy-assets
PINATA_API_KEY=YOUR_PINATA_KEY
PINATA_SECRET=YOUR_PINATA_SECRET
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

## Verification Checklist

After configuring `.env`, verify:

- [ ] Database connection works
  ```bash
  npm run prisma:generate
  npm run prisma:migrate
  ```

- [ ] Redis connection works
  ```bash
  redis-cli ping
  ```

- [ ] Solana RPC accessible
  ```bash
  # Test in Node.js REPL or check health endpoint
  ```

- [ ] Server starts without errors
  ```bash
  npm run start:dev
  ```

- [ ] Health check returns OK
  ```bash
  curl http://localhost:3000/health
  ```

## Security Notes

1. **Never commit .env to git** - It's already in .gitignore
2. **Use strong JWT secret** - Minimum 32 characters
3. **Use environment-specific secrets** - Different for dev/staging/prod
4. **Rotate secrets regularly** - Especially in production
5. **Use secrets manager** - AWS Secrets Manager, HashiCorp Vault, etc.

## Troubleshooting

### Database Connection Failed
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify credentials in DATABASE_URL
- Check database exists: `psql -U postgres -l`

### Redis Connection Failed
- Check Redis is running: `redis-cli ping`
- Verify REDIS_URL format
- Check firewall/network access

### Solana RPC Errors
- Verify RPC URL is accessible
- Check network matches program IDs
- Try different RPC endpoint
- Verify program IDs are correct for your network

### JWT Errors
- Ensure JWT_SECRET is set
- Use strong secret (32+ characters)
- Don't use default "your-secret-key"

## Next Steps

1. ✅ Configure .env file
2. ✅ Run database migrations
3. ✅ Start server
4. ✅ Test endpoints
5. ✅ Deploy to production

