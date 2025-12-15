# Render.com PostgreSQL Setup

## 🔧 Connection String Format

Render.com PostgreSQL uses a single connection string (no separate DIRECT_URL needed).

**DATABASE_URL**:
```
postgresql://user:password@dpg-xxx-xxx.region-postgres.render.com/dbname?sslmode=require
```

## 📋 Environment Variables

In your `.env` file:

```bash
# Render.com PostgreSQL (single connection string)
DATABASE_URL="postgresql://user:password@dpg-xxx-xxx.region-postgres.render.com/dbname?sslmode=require"
```

**Note**: Unlike Neon, Render.com doesn't require a separate `DIRECT_URL`.

## 🔍 Common Issues

### Issue 1: Can't Reach Database Server

**Error**: `P1001: Can't reach database server`

**Solutions**:
1. **Check Render Dashboard**:
   - Go to your Render dashboard
   - Find your PostgreSQL database
   - Ensure it's **Active** (not suspended)
   - Copy the connection string from Render

2. **Database Not Created**:
   - If database doesn't exist, create it in Render dashboard first
   - Render will provide the connection string after creation

3. **Connection String Format**:
   - Ensure `sslmode=require` is included
   - Verify the hostname is correct
   - Check username and password

4. **Network Issues**:
   - Check firewall settings
   - Verify VPN/proxy isn't blocking
   - Test from different network

### Issue 2: Database Suspended

**Error**: Connection timeout or refused

**Solution**:
- Render free tier databases suspend after inactivity
- Go to Render dashboard and resume the database
- Wait a few minutes for it to become active

### Issue 3: Wrong Connection String

**Error**: Authentication failed

**Solution**:
- Copy the connection string directly from Render dashboard
- Don't modify it manually
- Ensure all special characters are URL-encoded

## ✅ Verification

Test your connection:

```bash
# Test connection
npm run check:db

# Or manually
npx prisma db execute --stdin <<< "SELECT 1;"
```

## 🔗 Getting Connection String from Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your PostgreSQL database
3. Go to "Info" or "Connections" tab
4. Copy the "Internal Database URL" or "External Database URL"
5. Use it as `DATABASE_URL` in your `.env`

## 📝 Prisma Schema Configuration

Your `schema.prisma` should have:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**No `directUrl` needed for Render.com** (unlike Neon).

## 🚀 Migration Steps

1. **Ensure database is active in Render dashboard**

2. **Generate Prisma client**:
   ```bash
   bun run prisma:generate
   ```

3. **Run migrations**:
   ```bash
   bun run prisma:migrate
   ```

4. **If migration fails**:
   - Check database is active
   - Verify connection string
   - Run `npm run check:db` to diagnose

## 💡 Tips

- **Free Tier**: Render free databases suspend after 90 days of inactivity
- **Connection Pooling**: Render handles connection pooling automatically
- **SSL Required**: Always use `sslmode=require` in connection string
- **Backups**: Render provides automatic backups for paid plans

