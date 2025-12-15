import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../../redis/redis.service';
import { GamesService } from '../../games/games.service';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(
    private redis: RedisService,
    private gamesService: GamesService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Check for API key
    const apiKey = req.headers['x-api-key'] as string;
    
    if (apiKey) {
      const gameId = await this.gamesService.verifyApiKey(apiKey);
      if (gameId) {
        // Get API key record for rate limit
        const keyHash = require('crypto').createHash('sha256').update(apiKey).digest('hex');
        const cacheKey = `ratelimit:apikey:${keyHash}`;
        
        // Get rate limit from cache or default
        const rateLimit = (await this.redis.get<number>(`apikey:${keyHash}:ratelimit`)) || 300;
        
        // Check rate limit
        const current = await this.redis.getClient().incr(cacheKey);
        if (current === 1) {
          await this.redis.getClient().expire(cacheKey, 60); // 1 minute window
        }
        
        if (current > rateLimit) {
          throw new HttpException(
            {
              error: 'Rate limit exceeded',
              retryAfter: await this.redis.getClient().ttl(cacheKey),
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        
        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', rateLimit);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, rateLimit - current));
      }
    }

    // User-based rate limiting (for authenticated endpoints)
    if (req.user && (req.user as any).id) {
      const userCacheKey = `ratelimit:user:${(req.user as any).id}`;
      const userLimit = 100; // 100 requests per minute for users
      
      const current = await this.redis.getClient().incr(userCacheKey);
      if (current === 1) {
        await this.redis.getClient().expire(userCacheKey, 60);
      }
      
      if (current > userLimit) {
        throw new HttpException(
          {
            error: 'Rate limit exceeded',
            retryAfter: await this.redis.getClient().ttl(userCacheKey),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      
      res.setHeader('X-RateLimit-Limit', userLimit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, userLimit - current));
    }

    next();
  }
}

