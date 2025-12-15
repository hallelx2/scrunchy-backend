import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const datasourceUrl = process.env.DATABASE_URL;
    if (!datasourceUrl) {
      throw new Error('DATABASE_URL is not set. Please configure it in your .env file.');
    }

    super({
      datasourceUrl,
    });
  }

  async onModuleInit() {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        console.log('✅ Database connected successfully');
        return;
      } catch (error) {
        console.error(`❌ Database connection attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (attempt === maxRetries) {
          console.error('');
          console.error('💡 Troubleshooting steps:');
          console.error('   1. Check DATABASE_URL in .env file');
          console.error('   2. Verify Neon database is active in dashboard');
          console.error('   3. Ensure connection string format:');
          console.error('      DATABASE_URL: postgresql://...@ep-xxx-pooler.region.aws.neon.tech/...?sslmode=require');
          console.error('      DIRECT_URL: postgresql://...@ep-xxx.region.aws.neon.tech/...?sslmode=require');
          console.error('   4. Check network connectivity');
          console.error('   5. Verify database credentials');
          console.error('   6. Run: npm run test:db to test connection');
          console.error('');
          throw error;
        }
        
        console.log(`⏳ Retrying in ${retryDelay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
