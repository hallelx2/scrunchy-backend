# ⚡ Quick Environment Setup

## 🎯 What You Need to Configure (3 Things)

### 1. Database (PostgreSQL)
```bash
# Option A: Use setup script
./scripts/setup-database.sh

# Option B: Manual
sudo -u postgres psql
CREATE DATABASE scrunchy_db;
CREATE USER scrunchy_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE scrunchy_db TO scrunchy_user;
\q
```

Then update `.env`:
```bash
DATABASE_URL=postgresql://scrunchy_user:your_password@localhost:5432/scrunchy_db
```

### 2. JWT Secret
```bash
# Generate secret
openssl rand -base64 32

# Copy output and update .env
JWT_SECRET=<paste-generated-secret>
```

### 3. Platform Treasury Wallet
```bash
# Get your wallet address
solana address

# Update .env
PLATFORM_TREASURY=YOUR_WALLET_ADDRESS
```

## ✅ Already Configured (No Action Needed)

These are already set correctly:
- ✅ Program IDs (from your contracts)
- ✅ Solana Network (devnet)
- ✅ Solana RPC URL (devnet)
- ✅ Redis URL (localhost)
- ✅ Port and other defaults

## 🚀 Quick Start Commands

```bash
# 1. Copy example to .env (if not exists)
cp .env.example .env

# 2. Run interactive setup (recommended)
./scripts/setup-env.sh

# OR manually edit .env with the 3 values above

# 3. Verify configuration
./scripts/verify-env.sh

# 4. Setup database
./scripts/setup-database.sh

# 5. Run migrations
npm run prisma:generate
npm run prisma:migrate

# 6. Start server
npm run start:dev
```

## 📋 Your Current .env Status

Check what needs updating:
```bash
./scripts/verify-env.sh
```

## 🎉 That's It!

Once you've updated those 3 values, you're ready to go!

See `CONFIGURE_ENV.md` for detailed instructions.

