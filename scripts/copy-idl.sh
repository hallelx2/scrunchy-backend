#!/bin/bash

# Smart copy IDL files from various sources to backend
# Supports: local contract repo, environment variable path, or pre-committed files
# Designed for separate repo deployments

set -e

BACKEND_IDL_DIR="src/idl"

# Try multiple sources for IDL files (in order of preference)
# 1. Environment variable (for CI/CD or custom paths)
# 2. Relative path (for local development when repos are together)
# 3. Pre-committed files in backend repo (for production deployment)

CONTRACT_IDL_DIR=""

# Check environment variable first (for CI/CD or separate deployments)
if [ -n "$CONTRACT_IDL_PATH" ]; then
    CONTRACT_IDL_DIR="$CONTRACT_IDL_PATH"
    echo "📋 Using IDL path from environment: $CONTRACT_IDL_DIR"
elif [ -d "../scrunchy-contract/target/idl" ]; then
    # Local development: repos in same parent directory
    CONTRACT_IDL_DIR="../scrunchy-contract/target/idl"
    echo "📋 Using local contract repo: $CONTRACT_IDL_DIR"
elif [ -d "src/idl" ] && [ -n "$(ls -A src/idl/*.json 2>/dev/null)" ]; then
    # IDL files already in backend repo (production scenario)
    echo "📋 IDL files already present in backend repo"
    echo "✅ Using pre-committed IDL files"
    exit 0
else
    echo "⚠️  Warning: No IDL source found"
    echo ""
    echo "Options:"
    echo "  1. Set CONTRACT_IDL_PATH environment variable"
    echo "     export CONTRACT_IDL_PATH=/path/to/contract/target/idl"
    echo ""
    echo "  2. Place contract repo at ../scrunchy-contract/"
    echo ""
    echo "  3. Commit IDL files to src/idl/ in this repo"
    echo "     (Recommended for production deployments)"
    echo ""
    exit 1
fi

# Verify contract IDL directory exists
if [ -n "$CONTRACT_IDL_DIR" ] && [ ! -d "$CONTRACT_IDL_DIR" ]; then
    echo "❌ Error: Contract IDL directory not found at $CONTRACT_IDL_DIR"
    echo "Please ensure contracts are built and IDL files are generated."
    exit 1
fi

# Create backend IDL directory if it doesn't exist
mkdir -p "$BACKEND_IDL_DIR"

# Track if any files were copied
FILES_COPIED=0
FILES_SKIPPED=0

echo "📋 Checking IDL files from contract repo..."

# Copy each IDL file only if it's newer or doesn't exist
for idl_file in "$CONTRACT_IDL_DIR"/*.json; do
    # Skip if glob didn't match any files
    [ -e "$idl_file" ] || break
    
    filename=$(basename "$idl_file")
    dest_file="$BACKEND_IDL_DIR/$filename"

    # Check if file needs to be copied
    if [ ! -f "$dest_file" ] || [ "$idl_file" -nt "$dest_file" ]; then
        cp "$idl_file" "$dest_file"
        echo "  ✅ Copied: $filename"
        FILES_COPIED=$((FILES_COPIED + 1))
    else
        echo "  ⏭️  Skipped: $filename (up to date)"
        FILES_SKIPPED=$((FILES_SKIPPED + 1))
    fi
done

echo ""
if [ $FILES_COPIED -gt 0 ]; then
    echo "✅ Updated $FILES_COPIED IDL file(s)"
fi
if [ $FILES_SKIPPED -gt 0 ]; then
    echo "⏭️  Skipped $FILES_SKIPPED IDL file(s) (already up to date)"
fi

# Verify all required IDL files exist
REQUIRED_FILES=("asset_registry.json" "marketplace.json" "access_control.json")
MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$BACKEND_IDL_DIR/$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  Warning: Missing IDL files:"
    for file in "${MISSING_FILES[@]}"; do
        echo "   - $file"
    done
    echo "   Please ensure contracts are built and IDL files are generated."
fi

echo ""
echo "✅ IDL files ready in $BACKEND_IDL_DIR/"

