# Quick Start Guide - Scrunchy Backend

## 🚀 Setup (5 minutes)

### 1. Install Dependencies
```bash
cd scrunchy-backend
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration
```

**Required Environment Variables:**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/scrunchy
REDIS_URL=redis://localhost:6379
SOLANA_RPC_URL=https://api.devnet.solana.com
JWT_SECRET=your-secret-key-change-in-production
```

### 3. Copy IDL Files
```bash
cp ../scrunchy-contract/target/idl/*.json src/idl/
```

### 4. Database Setup
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view database
npm run prisma:studio
```

### 5. Start Server
```bash
npm run start:dev
```

Server will start on `http://localhost:3000`

## 📚 API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health

## 🧪 Test the API

### 1. Get Nonce for Authentication
```bash
curl -X POST http://localhost:3000/api/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "YOUR_WALLET_ADDRESS"}'
```

### 2. Verify Signature & Get JWT
```bash
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "YOUR_WALLET_ADDRESS",
    "signature": "SIGNED_MESSAGE",
    "message": "NONCE_FROM_STEP_1"
  }'
```

### 3. Get Assets (Public)
```bash
curl http://localhost:3000/api/assets?limit=10
```

### 4. Create Asset (Authenticated)
```bash
curl -X POST http://localhost:3000/api/assets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fire Sword",
    "imageUrl": "https://example.com/sword.png",
    "assetType": "WEAPON",
    "rarity": "LEGENDARY",
    "baseAttributes": {"power": 85, "speed": 60}
  }'
```

### 5. SDK Endpoint (API Key Auth)
```bash
curl -X POST http://localhost:3000/api/sdk/check-access \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "WALLET_ADDRESS",
    "assetId": "ASSET_ID"
  }'
```

## 🎯 Key Endpoints

### Authentication
- `POST /api/auth/nonce` - Get nonce
- `POST /api/auth/verify` - Verify & get JWT
- `GET /api/auth/me` - Get current user

### Assets
- `GET /api/assets` - List assets
- `GET /api/assets/:id` - Get asset
- `POST /api/assets` - Create asset

### Marketplace
- `GET /api/marketplace/listings` - List listings
- `POST /api/marketplace/listings` - Create listing
- `POST /api/marketplace/rentals` - Rent asset

### Games & SDK
- `POST /api/games` - Register game
- `POST /api/games/:id/api-keys` - Create API key
- `GET /api/sdk/players/:wallet/assets` - Get player assets

## 🔧 Development

### Run Tests
```bash
npm run test
npm run test:e2e
```

### Database Migrations
```bash
# Create migration
npm run prisma:migrate

# Reset database (dev only)
npx prisma migrate reset
```

### View Logs
Background jobs and events are logged to console.

## 📖 Next Steps

1. **Configure your Solana RPC** - Update `SOLANA_RPC_URL` in `.env`
2. **Set up PostgreSQL** - Create database and update `DATABASE_URL`
3. **Set up Redis** - Install Redis and update `REDIS_URL`
4. **Deploy** - Follow deployment guide for production

## 🆘 Troubleshooting

### Database Connection Issues
- Check PostgreSQL is running
- Verify `DATABASE_URL` is correct
- Run `npm run prisma:generate` again

### Redis Connection Issues
- Check Redis is running: `redis-cli ping`
- Verify `REDIS_URL` is correct

### Solana RPC Issues
- Check network connectivity
- Try different RPC endpoint
- Verify program IDs in `.env`

## ✅ Verification Checklist

- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] IDL files copied
- [ ] Database migrated
- [ ] Server starts without errors
- [ ] Swagger docs accessible
- [ ] Health check returns OK

**You're ready to go!** 🎉

