# IDL Files for Separate Repo Deployment

## 🎯 Overview

Since the backend and contract repos are deployed separately, we need a strategy for getting IDL files into the backend.

## 📋 Options

### Option 1: Commit IDL Files to Backend Repo (Recommended ✅)

**Best for**: Production deployments, CI/CD pipelines

**How**:
1. Copy IDL files from contract repo to `src/idl/`
2. Commit them to the backend repo
3. Update when contracts change

**Pros**:
- ✅ Works in all environments
- ✅ No external dependencies
- ✅ Simple deployment
- ✅ Version controlled with backend

**Cons**:
- ⚠️ Manual step when contracts update
- ⚠️ Need to remember to update

**Setup**:
```bash
# After building contracts, copy IDL files
cp /path/to/contract/target/idl/*.json src/idl/
git add src/idl/*.json
git commit -m "Update IDL files"
```

### Option 2: Environment Variable Path

**Best for**: CI/CD with artifact storage, Docker builds

**How**:
1. Set `CONTRACT_IDL_PATH` environment variable
2. Script automatically uses it

**Pros**:
- ✅ Flexible for different environments
- ✅ Works with artifact storage
- ✅ CI/CD friendly

**Cons**:
- ⚠️ Requires environment setup
- ⚠️ Path must be accessible

**Setup**:
```bash
# In CI/CD or Docker
export CONTRACT_IDL_PATH=/path/to/contract/target/idl
npm run build
```

### Option 3: Download from Published Location

**Best for**: Public contracts, CDN distribution

**How**:
1. Publish IDL files to a CDN or artifact storage
2. Download during build

**Pros**:
- ✅ Always get latest version
- ✅ No manual copying
- ✅ Works across environments

**Cons**:
- ⚠️ Requires network access
- ⚠️ Need to set up publishing

## 🔧 Current Script Behavior

The `copy-idl.sh` script now supports multiple sources (in order):

1. **Environment Variable**: `CONTRACT_IDL_PATH`
   ```bash
   export CONTRACT_IDL_PATH=/path/to/idl
   npm run build
   ```

2. **Local Development**: `../scrunchy-contract/target/idl`
   - Works when repos are in same parent directory
   - For local development convenience

3. **Pre-committed Files**: `src/idl/*.json`
   - If IDL files already exist in repo, uses them
   - Perfect for production deployments

## 📝 Recommended Workflow

### Development (Repos Together)

```bash
# Build contracts
cd ../scrunchy-contract
anchor build

# Build backend (automatically copies IDL)
cd ../scrunchy-backend
npm run build
```

### Production (Separate Repos)

**Step 1: Update IDL Files in Backend Repo**

```bash
# After contract deployment, copy IDL files
cp /path/to/deployed/contract/idl/*.json src/idl/

# Commit to backend repo
git add src/idl/*.json
git commit -m "Update IDL files for contract v1.2.3"
git push
```

**Step 2: Deploy Backend**

```bash
# IDL files are already in repo
npm run build  # Script detects pre-committed files
npm run start:prod
```

### CI/CD Pipeline

**Option A: Pre-committed Files**
```yaml
# .github/workflows/deploy.yml
- name: Build
  run: npm run build
  # IDL files already in repo
```

**Option B: Download from Artifacts**
```yaml
# .github/workflows/deploy.yml
- name: Download IDL files
  run: |
    # Download from artifact storage
    curl -o src/idl/asset_registry.json $IDL_CDN_URL/asset_registry.json
    # ... etc

- name: Build
  run: npm run build
```

**Option C: Environment Variable**
```yaml
# .github/workflows/deploy.yml
- name: Build
  env:
    CONTRACT_IDL_PATH: ${{ github.workspace }}/contract-artifacts/idl
  run: npm run build
```

## 🎯 Best Practice

**For Production**: Commit IDL files to backend repo
- ✅ Reliable
- ✅ No external dependencies
- ✅ Version controlled
- ✅ Works everywhere

**For Development**: Use local path or env var
- ✅ Fast iteration
- ✅ Automatic updates

## 📁 File Structure

```
scrunchy-backend/
├── src/
│   └── idl/              # IDL files (committed to repo for production)
│       ├── asset_registry.json
│       ├── marketplace.json
│       └── access_control.json
├── scripts/
│   └── copy-idl.sh       # Smart copy script
└── package.json
```

## ✅ Verification

After setup, verify IDL files are accessible:

```bash
# Check files exist
ls -lh src/idl/*.json

# Test build
npm run build

# Verify in dist
ls -lh dist/src/idl/*.json
```

## 🔄 Update Workflow

When contracts are updated:

1. **Build new contracts**
2. **Copy new IDL files to backend repo**
3. **Commit and push**
4. **Deploy backend**

This ensures backend always uses matching IDL files for deployed contracts.

