# IDL Files Setup Guide

## 📋 Overview

IDL (Interface Definition Language) files are JSON files that describe your Solana program interfaces. They're generated when you build your Anchor programs and are needed in the backend for:

1. **Type-safe contract interactions** - TypeScript types generated from IDL
2. **Program initialization** - Loading programs with correct types
3. **Transaction building** - Creating properly typed transactions

## 🔄 Copying IDL Files

Since the contract and backend are separate repos, you need to copy IDL files after building contracts.

### Option 1: Using the Script (Recommended)

```bash
# Copy IDL files from contract repo
npm run copy:idl
# or
bun run copy:idl
```

This script:
- Checks if contract IDL files exist
- Copies them to `src/idl/`
- Verifies the copy was successful

### Option 2: Manual Copy

```bash
# From backend directory
cp ../scrunchy-contract/target/idl/*.json src/idl/
```

## 📁 IDL Files Location

**Source**: `../scrunchy-contract/target/idl/`
- `asset_registry.json`
- `marketplace.json`
- `access_control.json`

**Destination**: `src/idl/`
- Same files copied here

## 🔧 Usage in Code

IDL files are imported via the type-safe wrapper:

```typescript
import { AssetRegistryIdl, MarketplaceIdl, AccessControlIdl } from './solana/types/idl.types';

// Use in SolanaService
this.assetRegistryProgram = new Program(
  AssetRegistryIdl,
  programId,
  provider
);
```

## 🔄 Workflow

1. **Build contracts** (in contract repo):
   ```bash
   cd scrunchy-contract
   anchor build
   ```

2. **Copy IDL files** (in backend repo):
   ```bash
   cd scrunchy-backend
   npm run copy:idl
   ```

3. **Rebuild backend** (if needed):
   ```bash
   bun run build
   ```

## ✅ Verification

Check that IDL files exist:
```bash
ls -lh src/idl/*.json
```

You should see:
- `access_control.json` (~6.7KB)
- `asset_registry.json` (~22.9KB)
- `marketplace.json` (~24.5KB)

## 🚨 Important Notes

- **Always copy IDL files after contract updates**
- **IDL files must match deployed program versions**
- **Keep IDL files in sync with deployed contracts**
- **Don't commit IDL files if contracts are in separate repo** (or do, if you want version control)

## 📝 Script Details

The `copy-idl.sh` script:
- Validates contract directory exists
- Creates `src/idl/` if needed
- Copies all `.json` files from contract IDL directory
- Shows copied files for verification

