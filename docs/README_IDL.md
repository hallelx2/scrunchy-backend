# IDL Files Setup for Separate Repo Deployment

## 🎯 Quick Start

Since backend and contract repos are deployed separately, choose one approach:

### ✅ Recommended: Commit IDL Files

**For Production Deployments**:

1. Copy IDL files to `src/idl/` after contract builds
2. Commit them to this repo
3. Deploy - IDL files are already included

```bash
# After contract deployment
cp /path/to/contract/idl/*.json src/idl/
git add src/idl/*.json
git commit -m "Update IDL files"
```

### 🔧 Alternative: Environment Variable

**For CI/CD with Artifacts**:

```bash
export CONTRACT_IDL_PATH=/path/to/idl
npm run build
```

## 📋 Script Behavior

The `copy-idl.sh` script automatically detects:

1. **Environment Variable** (`CONTRACT_IDL_PATH`) - Highest priority
2. **Local Development** (`../scrunchy-contract/target/idl`) - For convenience
3. **Pre-committed Files** (`src/idl/*.json`) - For production

If IDL files already exist in `src/idl/`, the script uses them directly.

## 🔄 Update Workflow

When contracts are updated:

1. Build new contracts → Generate new IDL files
2. Copy IDL files to `src/idl/` in backend repo
3. Commit and push backend repo
4. Deploy backend (IDL files included)

This ensures backend always matches deployed contract versions.

