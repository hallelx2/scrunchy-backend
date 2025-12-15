# ⚡ Quick Cloud Setup (5 Minutes)

## 🎯 What You Need

1. **Neon Database** - 2 minutes
2. **Upstash Redis** - 2 minutes  
3. **Pinata IPFS** - 1 minute

## 📝 Step-by-Step

### 1️⃣ Neon Database (2 min)

```bash
# 1. Go to https://console.neon.tech
# 2. Sign up / Login
# 3. Create new project
# 4. Copy connection string from dashboard
# 5. Update .env:
```

```bash
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/scrunchy?sslmode=require
DIRECT_URL=postgresql://user:pass@ep-xxx.neon.tech/scrunchy?sslmode=require
```

### 2️⃣ Upstash Redis (2 min)

```bash
# 1. Go to https://console.upstash.com
# 2. Sign up / Login
# 3. Create database (Regional, free tier)
# 4. Copy Redis URL from details
# 5. Update .env:
```

```bash
REDIS_URL=redis://default:PASSWORD@ENDPOINT.upstash.io:6379
```

### 3️⃣ Pinata IPFS (1 min)

```bash
# 1. Go to https://app.pinata.cloud
# 2. Sign up / Login
# 3. Developers → API Keys → New Key
# 4. Copy API Key and Secret
# 5. Update .env:
```

```bash
PINATA_API_KEY=YOUR_API_KEY
PINATA_SECRET=YOUR_SECRET_KEY
```

## ✅ Verify Setup

```bash
# 1. Check .env has all values
cat .env | grep -E "(DATABASE_URL|REDIS_URL|PINATA)"

# 2. Run migrations
npm run prisma:generate
npm run prisma:migrate

# 3. Start server
npm run start:dev
```

## 🎉 Done!

Your backend is now using:
- ✅ Neon (serverless PostgreSQL)
- ✅ Upstash Redis (cloud Redis)
- ✅ Pinata (IPFS storage)

**All free tier!** 🚀

See `CLOUD_SETUP_GUIDE.md` for detailed instructions.


