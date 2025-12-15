# ☁️ Cloud Services Setup Guide

## Overview

This guide helps you set up:
1. **Neon** - Serverless PostgreSQL database
2. **Upstash Redis** - Cloud Redis (or Redis Cloud)
3. **Pinata** - IPFS storage for metadata

## 🗄️ 1. Neon Database Setup

### Step 1: Create Neon Account
1. Go to https://console.neon.tech
2. Sign up (free tier available)
3. Create a new project

### Step 2: Get Connection String
1. In Neon dashboard, go to your project
2. Click "Connection Details"
3. Copy the **Connection String** (looks like):
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/scrunchy?sslmode=require
   ```

### Step 3: Get Direct Connection URL (for migrations)
1. In Connection Details, find **"Direct connection"**
2. Copy that URL (needed for Prisma migrations)

### Step 4: Update .env
```bash
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/scrunchy?sslmode=require
DIRECT_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/scrunchy?sslmode=require
```

### Step 5: Run Migrations
```bash
npm run prisma:generate
npm run prisma:migrate
```

**Note:** Neon uses connection pooling, so use `DATABASE_URL` for app connections and `DIRECT_URL` for migrations.

## 🔴 2. Upstash Redis Setup (Recommended)

### Step 1: Create Upstash Account
1. Go to https://console.upstash.com
2. Sign up (free tier: 10,000 commands/day)

### Step 2: Create Redis Database
1. Click "Create Database"
2. Choose region closest to you
3. Select "Regional" (free tier)
4. Click "Create"

### Step 3: Get Connection String
1. Click on your database
2. Go to "Details" tab
3. Copy the **REST URL** or **Redis URL**
   - Format: `redis://default:PASSWORD@ENDPOINT.upstash.io:6379`

### Step 4: Update .env
```bash
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379
```

### Step 5: Test Connection
```bash
npm run start:dev
# Should connect without errors
```

**Alternative: Redis Cloud**
- Go to https://redis.com/try-free/
- Create account
- Create database
- Copy connection string
- Format: `redis://:PASSWORD@HOST:PORT`

## 📦 3. Pinata IPFS Setup

### Step 1: Create Pinata Account
1. Go to https://app.pinata.cloud
2. Sign up (free tier available)

### Step 2: Create API Keys
1. Go to "Developers" → "API Keys"
2. Click "New Key"
3. Name it (e.g., "Scrunchy Backend")
4. Select permissions:
   - ✅ `pinFileToIPFS`
   - ✅ `pinJSONToIPFS`
   - ✅ `unpin` (optional)
5. Click "Create"
6. **Copy both keys** (you'll only see secret once!)

### Step 3: Update .env
```bash
PINATA_API_KEY=YOUR_API_KEY_HERE
PINATA_SECRET=YOUR_SECRET_KEY_HERE
```

### Step 4: Test Upload
The Pinata service will automatically upload asset metadata to IPFS when creating assets.

## ✅ Verification Checklist

After setup, verify everything:

```bash
# 1. Check .env has all values
cat .env | grep -E "(DATABASE_URL|REDIS_URL|PINATA)"

# 2. Test database connection
npm run prisma:generate
npm run prisma:migrate

# 3. Test Redis (start server)
npm run start:dev
# Check logs for Redis connection

# 4. Test Pinata (create an asset)
# Should upload metadata to IPFS automatically
```

## 🔧 Prisma Configuration for Neon

Update `prisma/schema.prisma` to use `DIRECT_URL` for migrations:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## 📊 Service Comparison

### Neon vs Local PostgreSQL
| Feature | Neon | Local |
|---------|------|-------|
| Setup | ✅ Instant | ❌ Manual install |
| Scaling | ✅ Automatic | ❌ Manual |
| Backups | ✅ Automatic | ❌ Manual |
| Free Tier | ✅ Yes | ✅ Yes |
| Best For | Production | Development |

### Upstash vs Local Redis
| Feature | Upstash | Local |
|---------|---------|-------|
| Setup | ✅ Instant | ❌ Manual install |
| Scaling | ✅ Serverless | ❌ Manual |
| Free Tier | ✅ 10k commands/day | ✅ Yes |
| Global | ✅ Edge locations | ❌ Single location |
| Best For | Production | Development |

### Pinata vs Local Storage
| Feature | Pinata | Local |
|---------|--------|-------|
| Decentralized | ✅ IPFS | ❌ Centralized |
| Permanence | ✅ Permanent | ❌ Can be lost |
| Free Tier | ✅ Yes | ✅ Yes |
| Best For | Production | Development |

## 🎯 Recommended Setup

**Development:**
- Neon (free tier)
- Upstash Redis (free tier)
- Pinata (free tier)

**Production:**
- Neon (paid plan for more resources)
- Upstash Redis (paid plan for more commands)
- Pinata (paid plan for more storage)

## 🆘 Troubleshooting

### Neon Connection Issues
- Ensure `sslmode=require` is in connection string
- Use `DIRECT_URL` for migrations
- Check firewall/network access

### Redis Connection Issues
- Verify connection string format
- Check Upstash dashboard for status
- Ensure password is correct

### Pinata Upload Issues
- Verify API keys are correct
- Check API key permissions
- Ensure you're within rate limits

## 📚 Resources

- **Neon Docs**: https://neon.tech/docs
- **Upstash Docs**: https://docs.upstash.com/redis
- **Pinata Docs**: https://docs.pinata.cloud
- **Prisma Neon Guide**: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-neon


