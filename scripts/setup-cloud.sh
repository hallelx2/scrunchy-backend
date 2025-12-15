#!/bin/bash

# Interactive cloud services setup script
# Helps configure Neon, Upstash Redis, and Pinata

set -e

echo "☁️  Scrunchy Backend - Cloud Services Setup"
echo "==========================================="
echo ""

if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "Creating from .env.example..."
    cp .env.example .env
fi

echo "This script will help you configure:"
echo "1. Neon Database (PostgreSQL)"
echo "2. Upstash Redis (Cloud Redis)"
echo "3. Pinata (IPFS Storage)"
echo ""

read -p "Continue? (Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    exit 0
fi

# Neon Setup
echo ""
echo "🗄️  Neon Database Setup"
echo "----------------------"
echo "1. Go to https://console.neon.tech"
echo "2. Create account / Login"
echo "3. Create new project"
echo "4. Copy connection string from dashboard"
echo ""
read -p "Enter DATABASE_URL: " neon_url
if [ ! -z "$neon_url" ]; then
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=${neon_url}|" .env
    sed -i "s|DIRECT_URL=.*|DIRECT_URL=${neon_url}|" .env
    echo "✅ Neon database configured"
fi

# Upstash Redis Setup
echo ""
echo "🔴 Upstash Redis Setup"
echo "---------------------"
echo "1. Go to https://console.upstash.com"
echo "2. Create account / Login"
echo "3. Create database (Regional, free tier)"
echo "4. Copy Redis URL from details"
echo ""
read -p "Enter REDIS_URL: " redis_url
if [ ! -z "$redis_url" ]; then
    sed -i "s|REDIS_URL=.*|REDIS_URL=${redis_url}|" .env
    echo "✅ Upstash Redis configured"
fi

# Pinata Setup
echo ""
echo "📦 Pinata IPFS Setup"
echo "-------------------"
echo "1. Go to https://app.pinata.cloud"
echo "2. Create account / Login"
echo "3. Developers → API Keys → New Key"
echo "4. Copy API Key and Secret"
echo ""
read -p "Enter PINATA_API_KEY: " pinata_key
read -p "Enter PINATA_SECRET: " -s pinata_secret
echo ""

if [ ! -z "$pinata_key" ] && [ ! -z "$pinata_secret" ]; then
    sed -i "s|PINATA_API_KEY=.*|PINATA_API_KEY=${pinata_key}|" .env
    sed -i "s|PINATA_SECRET=.*|PINATA_SECRET=${pinata_secret}|" .env
    echo "✅ Pinata configured"
fi

echo ""
echo "✅ Cloud services configuration complete!"
echo ""
echo "Next steps:"
echo "1. Run migrations: npm run prisma:migrate"
echo "2. Start server: npm run start:dev"
echo "3. Verify: Check health endpoint"


