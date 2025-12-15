#!/bin/bash

# Test Neon database connection
# Helps debug connection issues

set -e

echo "🔍 Testing Neon Database Connection..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found"
    echo "   Please create .env file with DATABASE_URL and DIRECT_URL"
    exit 1
fi

# Load .env file
export $(grep -v '^#' .env | xargs)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set in .env"
    exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Extract connection details
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "📋 Connection Details:"
echo "   Host: $DB_HOST"
echo "   Database: $DB_NAME"
echo ""

# Check if it's a pooler URL
if [[ $DB_HOST == *"-pooler"* ]]; then
    echo "✅ Using pooled connection (correct for DATABASE_URL)"
else
    echo "⚠️  Warning: DATABASE_URL should use -pooler for Neon"
    echo "   Current: $DB_HOST"
    echo "   Expected: ep-xxx-pooler.region.aws.neon.tech"
fi

echo ""

# Test connection with psql if available
if command -v psql &> /dev/null; then
    echo "🔗 Testing connection with psql..."
    if psql "$DATABASE_URL" -c "SELECT version();" &> /dev/null; then
        echo "✅ Connection successful!"
    else
        echo "❌ Connection failed"
        echo "   Check your credentials and network connectivity"
    fi
else
    echo "⚠️  psql not found, skipping direct connection test"
    echo "   Install postgresql-client to test connection"
fi

echo ""

# Test with Prisma
echo "🔗 Testing connection with Prisma..."
if npx prisma db execute --stdin <<< "SELECT 1;" &> /dev/null; then
    echo "✅ Prisma connection successful!"
else
    echo "❌ Prisma connection failed"
    echo "   Run: npx prisma generate"
    echo "   Then check your DATABASE_URL"
fi

echo ""
echo "💡 If connection fails, check:"
echo "   1. Neon dashboard - is database active?"
echo "   2. Connection string format (need -pooler for DATABASE_URL)"
echo "   3. Network connectivity"
echo "   4. Firewall/security settings"

