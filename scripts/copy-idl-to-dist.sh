#!/bin/bash

# Copy IDL files to dist folder after build
# This ensures IDL files are available at runtime

set -e

SRC_IDL_DIR="src/idl"
DIST_IDL_DIR="dist/idl"

echo "📋 Copying IDL files to dist folder..."

if [ ! -d "$SRC_IDL_DIR" ]; then
    echo "❌ Error: Source IDL directory not found at $SRC_IDL_DIR"
    echo "Please run: npm run copy:idl"
    exit 1
fi

# Create dist/idl directory if it doesn't exist
mkdir -p "$DIST_IDL_DIR"

# Copy all IDL files
cp "$SRC_IDL_DIR"/*.json "$DIST_IDL_DIR/" 2>/dev/null || {
    echo "⚠️  Warning: No IDL files found to copy"
    exit 0
}

echo "✅ IDL files copied to dist:"
ls -lh "$DIST_IDL_DIR"/*.json

echo ""
echo "✅ IDL files are ready in dist folder!"

