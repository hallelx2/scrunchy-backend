# Environment Configuration - Complete Guide

## 🎯 Quick Start

### Option 1: Interactive Setup (Recommended)
```bash
cd scrunchy-backend
./scripts/setup-env.sh
```

### Option 2: Manual Setup
```bash
cd scrunchy-backend
cp .env.example .env
# Edit .env with your values
```

### Option 3: Use Pre-configured .env
```bash
cd scrunchy-backend
# .env file is already created with defaults
# Just update the values you need
```

## 📋 Configuration Checklist

### ✅ Required (Must Configure)

- [ ] **DATABASE_URL** - PostgreSQL connection string
- [ ] **REDIS_URL** - Redis connection URL  
- [ ] **JWT_SECRET** - Strong secret (32+ chars)
- [ ] **SOLANA_RPC_URL** - Solana RPC endpoint
- [ ] **Program IDs** - Already set from your contracts ✅

### ⚠️ Recommended

- [ ] **PLATFORM_TREASURY** - Your Solana wallet address
- [ ] **AWS S3** - For file uploads (optional)
- [ ] **IPFS/Pinata** - For metadata storage (optional)

## 🔧 Detailed Configuration

### 1. Database Setup

**Quick Setup:**
```bash
./scripts/setup-database.sh
```

**Manual Setup:**
```bash
sudo -u postgres psql
CREATE DATABASE scrunchy_db;
CREATE USER scrunchy_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE scrunchy_db TO scrunchy_user;
\q
```

**Update .env:**
```bash
DATABASE_URL=postgresql://scrunchy_user:your_password@localhost:5432/scrunchy_db
```

### 2. Redis Setup

**Install Redis:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Verify:**
```bash
redis-cli ping
# Should return: PONG
```

**Update .env:**
```bash
REDIS_URL=redis://localhost:6379
```

### 3. JWT Secret Generation

**Generate secure secret:**
```bash
openssl rand -base64 32
```

**Update .env:**
```bash
JWT_SECRET=<generated-secret>
```

### 4. Solana Configuration

**Your Program IDs (already configured):**
- Asset Registry: `7vxpftgcdbh6NW77uAGVxp4aM2RcbQtmeGixNp2ifCDn`
- Marketplace: `G46EH6LskmJpBTvZNewSL4Xe5fkdbcdkMpRM8wQ9T3RH`
- Access Control: `n41USxoi9Lf1RyZUVAfCHD5TSeuDBuqDxEpUHzkDqf2`

**RPC Endpoints:**

*Free (Devnet):*
```bash
SOLANA_RPC_URL=https://api.devnet.solana.com
```

*Free (Mainnet - rate limited):*
```bash
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

*Recommended Paid Providers:*
- **Helius**: `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`
- **QuickNode**: `https://YOUR_ENDPOINT.solana-mainnet.quiknode.pro/YOUR_KEY/`
- **Triton**: `https://YOUR_ENDPOINT.rpcpool.com/YOUR_KEY`

### 5. Platform Treasury

**Get your wallet address:**
```bash
solana address
# Or use your wallet's public key
```

**Update .env:**
```bash
PLATFORM_TREASURY=YOUR_SOLANA_WALLET_ADDRESS
```

## ✅ Verification

### Verify Configuration
```bash
./scripts/verify-env.sh
```

### Test Database Connection
```bash
npm run prisma:generate
npm run prisma:migrate
```

### Test Redis Connection
```bash
redis-cli ping
```

### Test Server Start
```bash
npm run start:dev
# Should start without errors
```

### Test Health Endpoint
```bash
curl http://localhost:3000/health
# Should return JSON with status: ok
```

## 🔒 Security Best Practices

1. **Never commit .env** ✅ (already in .gitignore)
2. **Use strong secrets** - Minimum 32 characters
3. **Different secrets per environment** - dev/staging/prod
4. **Rotate secrets regularly** - Especially JWT_SECRET
5. **Use environment variables in production** - Don't hardcode

## 🌍 Environment-Specific Configs

### Development
```bash
NODE_ENV=development
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
DEBUG=true
```

### Production
```bash
NODE_ENV=production
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
DEBUG=false
# Use strong secrets
# Use managed databases (RDS, etc.)
# Use Redis Cloud or managed Redis
```

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U scrunchy_user -d scrunchy_db -h localhost

# Check .env format
# Should be: postgresql://user:password@host:port/database
```

### Redis Connection Issues
```bash
# Check Redis is running
redis-cli ping

# Check Redis URL format
# Should be: redis://host:port or redis://:password@host:port
```

### Solana RPC Issues
```bash
# Test RPC endpoint
curl -X POST https://api.devnet.solana.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

# Verify program IDs match network
# Devnet IDs != Mainnet IDs
```

## 📝 Current Configuration Status

Your `.env` file is pre-configured with:
- ✅ Program IDs from your deployed contracts
- ✅ Default devnet RPC URL
- ✅ Default database connection string (update credentials)
- ✅ Default Redis URL
- ⚠️ JWT_SECRET needs to be changed
- ⚠️ PLATFORM_TREASURY needs to be set

## 🎯 Next Steps After Configuration

1. ✅ Verify .env: `./scripts/verify-env.sh`
2. ✅ Setup database: `./scripts/setup-database.sh` or manually
3. ✅ Run migrations: `npm run prisma:migrate`
4. ✅ Start server: `npm run start:dev`
5. ✅ Test endpoints: Visit http://localhost:3000/api/docs

## 📚 Additional Resources

- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Redis Docs**: https://redis.io/docs/
- **Solana RPC**: https://docs.solana.com/api/http
- **Helius**: https://docs.helius.dev/
- **QuickNode**: https://www.quicknode.com/docs/solana

