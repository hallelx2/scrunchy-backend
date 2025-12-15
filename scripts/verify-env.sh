#!/bin/bash

# Verify .env configuration
# Checks if all required environment variables are set

set -e

echo "🔍 Verifying .env configuration..."
echo ""

if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Run: cp .env.example .env"
    exit 1
fi

# Source .env file
set -a
source .env
set +a

errors=0
warnings=0

# Required variables
required_vars=(
    "DATABASE_URL"
    "REDIS_URL"
    "SOLANA_NETWORK"
    "SOLANA_RPC_URL"
    "ASSET_REGISTRY_PROGRAM_ID"
    "MARKETPLACE_PROGRAM_ID"
    "ACCESS_CONTROL_PROGRAM_ID"
    "JWT_SECRET"
)

# Check required variables
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ $var is not set"
        errors=$((errors + 1))
    elif [[ "$var" == "JWT_SECRET" && "${!var}" == *"your-secret-key"* ]]; then
        echo "⚠️  $var is using default value (should be changed)"
        warnings=$((warnings + 1))
    else
        echo "✅ $var is set"
    fi
done

# Check optional but recommended
if [ -z "$PLATFORM_TREASURY" ] || [[ "$PLATFORM_TREASURY" == *"YOUR"* ]]; then
    echo "⚠️  PLATFORM_TREASURY is not set (recommended)"
    warnings=$((warnings + 1))
fi

echo ""
if [ $errors -eq 0 ] && [ $warnings -eq 0 ]; then
    echo "✅ All configuration looks good!"
    exit 0
elif [ $errors -eq 0 ]; then
    echo "⚠️  Configuration complete with $warnings warning(s)"
    exit 0
else
    echo "❌ Configuration has $errors error(s) and $warnings warning(s)"
    exit 1
fi

