#!/bin/bash

# Check Render.com PostgreSQL connection
# Helps debug connection issues

set -e

echo "🔍 Checking Render.com PostgreSQL Connection..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found"
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
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')

echo "📋 Connection Details:"
echo "   Host: $DB_HOST"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Check if it's a Render.com URL
if [[ $DB_HOST == *"render.com"* ]]; then
    echo "✅ Using Render.com PostgreSQL"
    echo ""
    echo "💡 Render.com Connection Notes:"
    echo "   - Render databases are accessible from anywhere"
    echo "   - Check Render dashboard to ensure database is running"
    echo "   - Verify connection string is correct"
    echo "   - Check if database needs to be created first"
else
    echo "⚠️  Not a Render.com URL"
fi

echo ""

# Test connection with psql if available
if command -v psql-18 &> /dev/null; then
    echo "🔗 Testing connection with psql..."
    if timeout 5 psql-18 "$DATABASE_URL" -c "SELECT version();" &> /dev/null; then
        echo "✅ Connection successful!"
    else
        echo "❌ Connection failed"
        echo ""
        echo "💡 Troubleshooting:"
        echo "   1. Check Render dashboard - is database active?"
        echo "   2. Verify DATABASE_URL is correct"
        echo "   3. Check network connectivity"
        echo "   4. Ensure database exists in Render"
    fi
else
    echo "⚠️  psql not found, skipping direct connection test"
    echo "   Install postgresql-client to test connection"
fi

echo ""

# Test with Prisma
echo "🔗 Testing connection with Prisma..."
if timeout 5 npx prisma db execute --stdin <<< "SELECT 1;" &> /dev/null; then
    echo "✅ Prisma connection successful!"
else
    echo "❌ Prisma connection failed"
    echo ""
    echo "💡 Common Render.com Issues:"
    echo "   1. Database not created yet - create it in Render dashboard"
    echo "   2. Wrong connection string - copy from Render dashboard"
    echo "   3. Database suspended - check Render dashboard"
    echo "   4. Network timeout - check firewall/VPN"
fi

echo ""
echo "📚 Next Steps:"
echo "   1. Go to Render.com dashboard"
echo "   2. Check your PostgreSQL database status"
echo "   3. Copy the connection string from Render"
echo "   4. Ensure database is 'Active' (not suspended)"
echo "   5. If database doesn't exist, create it first"

