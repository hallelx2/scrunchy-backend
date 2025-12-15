#!/bin/bash

# Scrunchy Backend - Environment Setup Script
# This script helps you set up your .env file interactively

set -e

echo "🚀 Scrunchy Backend - Environment Setup"
echo "========================================"
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

# Copy example file
cp .env.example .env
echo "✅ Created .env from .env.example"
echo ""

# Database configuration
echo "📊 Database Configuration"
echo "-------------------------"
read -p "PostgreSQL Username [scrunchy_user]: " db_user
db_user=${db_user:-scrunchy_user}

read -p "PostgreSQL Password: " -s db_password
echo ""

read -p "PostgreSQL Host [localhost]: " db_host
db_host=${db_host:-localhost}

read -p "PostgreSQL Port [5432]: " db_port
db_port=${db_port:-5432}

read -p "Database Name [scrunchy_db]: " db_name
db_name=${db_name:-scrunchy_db}

DATABASE_URL="postgresql://${db_user}:${db_password}@${db_host}:${db_port}/${db_name}"
sed -i "s|DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|" .env
echo "✅ Database URL configured"
echo ""

# Redis configuration
echo "🔴 Redis Configuration"
echo "---------------------"
read -p "Redis URL [redis://localhost:6379]: " redis_url
redis_url=${redis_url:-redis://localhost:6379}
sed -i "s|REDIS_URL=.*|REDIS_URL=${redis_url}|" .env
echo "✅ Redis URL configured"
echo ""

# JWT Secret
echo "🔐 Security Configuration"
echo "-------------------------"
read -p "Generate JWT secret automatically? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    if command -v openssl &> /dev/null; then
        jwt_secret=$(openssl rand -base64 32 | tr -d '\n')
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=${jwt_secret}|" .env
        echo "✅ JWT secret generated"
    else
        echo "⚠️  openssl not found. Please set JWT_SECRET manually in .env"
    fi
else
    read -p "Enter JWT secret (min 32 chars): " jwt_secret
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=${jwt_secret}|" .env
fi
echo ""

# Platform Treasury
echo "💰 Platform Configuration"
echo "-------------------------"
read -p "Platform Treasury Wallet Address: " treasury
if [ ! -z "$treasury" ]; then
    sed -i "s|PLATFORM_TREASURY=.*|PLATFORM_TREASURY=${treasury}|" .env
    echo "✅ Platform treasury configured"
fi
echo ""

# Solana RPC
echo "⛓️  Solana Configuration"
echo "-------------------------"
read -p "Solana Network [devnet]: " solana_network
solana_network=${solana_network:-devnet}
sed -i "s|SOLANA_NETWORK=.*|SOLANA_NETWORK=${solana_network}|" .env

read -p "Solana RPC URL [https://api.devnet.solana.com]: " rpc_url
rpc_url=${rpc_url:-https://api.devnet.solana.com}
sed -i "s|SOLANA_RPC_URL=.*|SOLANA_RPC_URL=${rpc_url}|" .env
echo "✅ Solana configuration updated"
echo ""

# Program IDs (already set from Anchor.toml, but allow override)
echo "📝 Program IDs"
echo "--------------"
echo "Current program IDs from Anchor.toml:"
echo "  Asset Registry: 7vxpftgcdbh6NW77uAGVxp4aM2RcbQtmeGixNp2ifCDn"
echo "  Marketplace: G46EH6LskmJpBTvZNewSL4Xe5fkdbcdkMpRM8wQ9T3RH"
echo "  Access Control: n41USxoi9Lf1RyZUVAfCHD5TSeuDBuqDxEpUHzkDqf2"
read -p "Use these program IDs? (Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    read -p "Asset Registry Program ID: " asset_registry_id
    read -p "Marketplace Program ID: " marketplace_id
    read -p "Access Control Program ID: " access_control_id
    
    if [ ! -z "$asset_registry_id" ]; then
        sed -i "s|ASSET_REGISTRY_PROGRAM_ID=.*|ASSET_REGISTRY_PROGRAM_ID=${asset_registry_id}|" .env
    fi
    if [ ! -z "$marketplace_id" ]; then
        sed -i "s|MARKETPLACE_PROGRAM_ID=.*|MARKETPLACE_PROGRAM_ID=${marketplace_id}|" .env
    fi
    if [ ! -z "$access_control_id" ]; then
        sed -i "s|ACCESS_CONTROL_PROGRAM_ID=.*|ACCESS_CONTROL_PROGRAM_ID=${access_control_id}|" .env
    fi
fi
echo ""

echo "✅ Environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review .env file: cat .env"
echo "2. Setup database: npm run prisma:migrate"
echo "3. Start server: npm run start:dev"
echo ""
echo "📖 For detailed configuration guide, see ENV_SETUP_GUIDE.md"

