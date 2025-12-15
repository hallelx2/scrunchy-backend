#!/bin/bash

# Setup PostgreSQL database for Scrunchy backend
# This script creates the database and user

set -e

echo "🗄️  Setting up PostgreSQL database for Scrunchy"
echo "=============================================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed!"
    echo "Install with: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

# Default values
DB_NAME=${DB_NAME:-scrunchy_db}
DB_USER=${DB_USER:-scrunchy_user}
DB_PASSWORD=${DB_PASSWORD:-scrunchy_password}

echo "Database Configuration:"
echo "  Name: $DB_NAME"
echo "  User: $DB_USER"
echo ""

read -p "Continue with these settings? (Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    read -p "Database name [$DB_NAME]: " input_db_name
    DB_NAME=${input_db_name:-$DB_NAME}
    
    read -p "Database user [$DB_USER]: " input_db_user
    DB_USER=${input_db_user:-$DB_USER}
    
    read -p "Database password: " -s input_db_password
    echo
    DB_PASSWORD=${input_db_password:-$DB_PASSWORD}
fi

echo ""
echo "Creating database and user..."

# Create database and user
sudo -u postgres psql <<EOF
-- Create user
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';

-- Create database
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- Connect to database and grant schema privileges
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};
EOF

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Update your .env file with:"
echo "DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"
echo ""
echo "Next steps:"
echo "1. Update .env file"
echo "2. Run: npm run prisma:generate"
echo "3. Run: npm run prisma:migrate"

