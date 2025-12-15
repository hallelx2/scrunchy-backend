# Neon Database Connection Setup

## 🔧 Connection String Format

Neon requires specific connection string formats for pooling and direct connections.

### For Prisma (with Connection Pooling)

**DATABASE_URL** (Pooled Connection):
```
postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require
```

**DIRECT_URL** (Direct Connection for Migrations):
```
postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

### Key Differences

1. **Pooler URL**: Uses `-pooler` in the hostname
   - Example: `ep-xxx-pooler.region.aws.neon.tech`
   - Used for: Application queries (DATABASE_URL)

2. **Direct URL**: No `-pooler` in hostname
   - Example: `ep-xxx.region.aws.neon.tech`
   - Used for: Migrations, schema operations (DIRECT_URL)

## 📋 Environment Variables

In your `.env` file:

```bash
# Pooled connection (for application queries)
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require"

# Direct connection (for migrations)
DIRECT_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

## 🔍 Common Issues

### Issue 1: Wrong Connection String Format

**Error**: `Can't reach database server`

**Solution**: 
- Ensure you're using the **pooler** URL for `DATABASE_URL`
- Ensure you're using the **direct** URL for `DIRECT_URL`
- Check that `sslmode=require` is included

### Issue 2: Missing DIRECT_URL

**Error**: Migration failures

**Solution**: 
- Add `DIRECT_URL` to your `.env` file
- Use the direct connection (non-pooler) URL

### Issue 3: Connection Timeout

**Error**: Connection timeout errors

**Solution**:
- Check your Neon project is active
- Verify network connectivity
- Check firewall settings
- Ensure connection string is correct

## ✅ Verification

Test your connection:

```bash
# Test connection
npx prisma db pull

# Run migrations
npx prisma migrate deploy
```

## 🔗 Getting Connection Strings from Neon

1. Go to your Neon dashboard
2. Select your project
3. Go to "Connection Details"
4. Copy:
   - **Pooled connection** → Use for `DATABASE_URL`
   - **Direct connection** → Use for `DIRECT_URL`

## 📝 Prisma Schema Configuration

Your `schema.prisma` should have:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

This allows Prisma to:
- Use pooled connection for queries (faster, connection pooling)
- Use direct connection for migrations (required by Neon)

