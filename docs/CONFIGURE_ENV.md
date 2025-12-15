# 🔧 Environment Configuration Guide

## Quick Setup (3 Steps)

### Step 1: Create .env File
```bash
cd scrunchy-backend
cp .env.example .env
```

### Step 2: Run Interactive Setup (Easiest)
```bash
./scripts/setup-env.sh
```

This will guide you through:
- Database configuration
- Redis configuration  
- JWT secret generation
- Platform treasury setup
- Solana RPC configuration

### Step 3: Verify Configuration
```bash
./scripts/verify-env.sh
```

## 📝 Manual Configuration

If you prefer to configure manually, edit `.env` file:

### Minimum Required Configuration

```bash
# 1. DATABASE - Update with your PostgreSQL credentials
DATABASE_URL=postgresql://username:password@localhost:5432/scrunchy_db

# 2. REDIS - Usually fine as default
REDIS_URL=redis://localhost:6379

# 3. JWT_SECRET - Generate with: openssl rand -base64 32
JWT_SECRET=your-generated-secret-here-min-32-characters

# 4. PLATFORM_TREASURY - Your Solana wallet address
PLATFORM_TREASURY=YOUR_SOLANA_WALLET_ADDRESS
```

### Already Configured ✅

These are already set from your deployed contracts:
```bash
ASSET_REGISTRY_PROGRAM_ID=7vxpftgcdbh6NW77uAGVxp4aM2RcbQtmeGixNp2ifCDn
MARKETPLACE_PROGRAM_ID=G46EH6LskmJpBTvZNewSL4Xe5fkdbcdkMpRM8wQ9T3RH
ACCESS_CONTROL_PROGRAM_ID=n41USxoi9Lf1RyZUVAfCHD5TSeuDBuqDxEpUHzkDqf2
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
```

## 🗄️ Database Setup

### Option A: Use Setup Script
```bash
./scripts/setup-database.sh
```

### Option B: Manual Setup
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Run these commands:
CREATE DATABASE scrunchy_db;
CREATE USER scrunchy_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE scrunchy_db TO scrunchy_user;
\c scrunchy_db
GRANT ALL ON SCHEMA public TO scrunchy_user;
\q
```

Then update `.env`:
```bash
DATABASE_URL=postgresql://scrunchy_user:your_password@localhost:5432/scrunchy_db
```

## 🔴 Redis Setup

### Install Redis (if not installed)
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Verify Redis
```bash
redis-cli ping
# Should return: PONG
```

Redis URL in `.env` should be:
```bash
REDIS_URL=redis://localhost:6379
```

## 🔐 Generate JWT Secret

```bash
# Generate secure secret
openssl rand -base64 32

# Copy the output and paste into .env
JWT_SECRET=<paste-generated-secret-here>
```

## 💰 Platform Treasury

Get your Solana wallet address:
```bash
solana address
# Or check your wallet's public key
```

Update `.env`:
```bash
PLATFORM_TREASURY=YOUR_WALLET_ADDRESS_HERE
```

## ✅ Verification Checklist

After configuration, verify everything:

```bash
# 1. Check .env file exists
ls -la .env

# 2. Verify configuration
./scripts/verify-env.sh

# 3. Test database
npm run prisma:generate
npm run prisma:migrate

# 4. Test Redis
redis-cli ping

# 5. Start server
npm run start:dev

# 6. Check health
curl http://localhost:3000/health
```

## 📋 Complete .env Template

Here's what your `.env` should look like:

```bash
# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Database (UPDATE THIS)
DATABASE_URL=postgresql://scrunchy_user:your_password@localhost:5432/scrunchy_db

# Redis (usually fine as default)
REDIS_URL=redis://localhost:6379

# Solana (already configured ✅)
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
ASSET_REGISTRY_PROGRAM_ID=7vxpftgcdbh6NW77uAGVxp4aM2RcbQtmeGixNp2ifCDn
MARKETPLACE_PROGRAM_ID=G46EH6LskmJpBTvZNewSL4Xe5fkdbcdkMpRM8wQ9T3RH
ACCESS_CONTROL_PROGRAM_ID=n41USxoi9Lf1RyZUVAfCHD5TSeuDBuqDxEpUHzkDqf2

# JWT (GENERATE NEW SECRET)
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_EXPIRY=7d

# Platform (UPDATE THIS)
PLATFORM_TREASURY=YOUR_SOLANA_WALLET_ADDRESS
PLATFORM_FEE_BPS=250

# Optional (can leave empty for now)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=
PINATA_API_KEY=
PINATA_SECRET=
SENTRY_DSN=
DEBUG=false
```

## 🎯 What You Need to Update

1. **DATABASE_URL** - Your PostgreSQL connection string
2. **JWT_SECRET** - Generate a secure secret
3. **PLATFORM_TREASURY** - Your Solana wallet address

Everything else is already configured! ✅

## 🚀 Next Steps

1. ✅ Configure .env (use interactive script or manual)
2. ✅ Setup database: `./scripts/setup-database.sh`
3. ✅ Run migrations: `npm run prisma:migrate`
4. ✅ Start server: `npm run start:dev`
5. ✅ Test: Visit http://localhost:3000/api/docs

## 🆘 Need Help?

- See `ENV_SETUP_GUIDE.md` for detailed instructions
- See `ENV_CONFIGURATION.md` for complete reference
- Run `./scripts/verify-env.sh` to check your configuration

