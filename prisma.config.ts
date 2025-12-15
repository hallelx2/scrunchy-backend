import 'dotenv/config';
import { defineConfig } from '@prisma/config';

const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL ?? databaseUrl;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Please configure it in your .env file.');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
    directUrl,
  },
});

