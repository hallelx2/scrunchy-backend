# What Redis is Used For in Scrunchy Backend

## 🎯 Purpose of Redis

Redis is used for **performance optimization** and **rate limiting**. It's critical for:
1. **Fast API responses** - Caching frequently accessed data
2. **Rate limiting** - Preventing API abuse
3. **SDK performance** - Critical for game integration

## 📊 Redis Usage Breakdown

### 1. **Caching Layer** (Performance)
- **Asset data** - Cache for 5 minutes (reduces database queries)
- **Listings** - Cache for 1 minute (frequently accessed)
- **Game configurations** - Cache for 5 minutes
- **Access checks** - Cache for 30 seconds (critical for SDK)
- **API key validation** - Cache for 1 hour

### 2. **Rate Limiting** (Security)
- **Per API key** - Track requests per minute (default: 300/min)
- **Per user** - Track authenticated user requests (default: 100/min)
- **Prevents abuse** - Protects your infrastructure

### 3. **SDK Performance** (Critical)
- **Access verification** - Cached for 30 seconds (games check this frequently)
- **Player assets** - Cached for 1 minute
- **Asset transformations** - Cached for 10 minutes

## 💡 Why Cloud Redis?

- ✅ **No local setup** - No need to install/run Redis locally
- ✅ **Scalable** - Handles high traffic automatically
- ✅ **Managed** - No maintenance required
- ✅ **Global** - Low latency worldwide
- ✅ **Free tier available** - Upstash has generous free tier

## 🔧 Recommended: Upstash Redis

**Why Upstash?**
- Free tier: 10,000 commands/day
- Serverless (pay per use)
- Global edge locations
- Easy setup
- Works great with serverless deployments

**Alternative: Redis Cloud**
- Also has free tier
- More traditional Redis hosting


