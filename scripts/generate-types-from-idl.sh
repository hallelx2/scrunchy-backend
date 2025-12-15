#!/bin/bash

# Generate TypeScript types from IDL files
# This creates type definitions for better type safety
# Note: You still need IDL JSON files at runtime for the Program class

set -e

IDL_DIR="src/idl"
TYPES_DIR="src/types"
ANCHOR_CLI="anchor"

echo "📦 Generating TypeScript types from IDL files..."

# Check if anchor CLI is available
if ! command -v $ANCHOR_CLI &> /dev/null; then
    echo "⚠️  Anchor CLI not found. Installing types manually..."
    echo "   You can install Anchor CLI: cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked"
    echo ""
    echo "   Or use the manual type generation script instead."
    exit 1
fi

# Create types directory
mkdir -p "$TYPES_DIR"

# Generate types for each IDL file
for idl_file in "$IDL_DIR"/*.json; do
    if [ ! -f "$idl_file" ]; then
        echo "⚠️  No IDL files found in $IDL_DIR"
        exit 1
    fi

    filename=$(basename "$idl_file" .json)
    output_file="$TYPES_DIR/${filename}.types.ts"

    echo "Generating types for $filename..."
    
    # Use anchor CLI to generate types
    $ANCHOR_CLI idl typescript "$idl_file" > "$output_file" || {
        echo "⚠️  Failed to generate types for $filename"
        echo "   This is optional - IDL files still work at runtime"
        continue
    }

    echo "✅ Generated: $output_file"
done

echo ""
echo "✅ Type generation complete!"
echo ""
echo "📝 Note: You still need IDL JSON files at runtime."
echo "   Generated types are for better type safety during development."
echo "   The Program class requires IDL JSON to function."

