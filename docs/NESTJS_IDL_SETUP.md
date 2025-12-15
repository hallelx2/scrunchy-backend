# NestJS IDL Files Setup (Native)

## ✅ Solution: Using NestJS Native Asset Copying

Instead of custom scripts, we now use NestJS's built-in asset copying feature via `nest-cli.json`.

## 📋 Configuration

### nest-cli.json

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "assets": [
      {
        "include": "idl/**/*.json",
        "outDir": "dist",
        "watchAssets": true
      }
    ]
  }
}
```

**Key Settings**:
- `include`: Path to IDL files relative to `sourceRoot` (src)
- `outDir`: Where files go in dist (mirrors source structure)
- `watchAssets`: Automatically copies changes during `start:dev`

## 🔄 How It Works

1. **Build Process**:
   ```bash
   npm run build
   # or
   bun run build
   ```
   - NestJS automatically copies `src/idl/*.json` → `dist/src/idl/*.json`
   - No custom scripts needed!

2. **Development Mode**:
   ```bash
   npm run start:dev
   ```
   - NestJS watches for IDL file changes
   - Automatically copies updates to dist
   - Hot reload works seamlessly

3. **Runtime Access**:
   ```typescript
   // From dist/src/solana/solana.service.js
   const idl = require('../../idl/asset_registry.json');
   // Resolves to: dist/src/idl/asset_registry.json ✅
   ```

## 📁 File Structure

```
src/
├── idl/
│   ├── asset_registry.json
│   ├── marketplace.json
│   └── access_control.json
└── solana/
    └── solana.service.ts (uses require('../../idl/...'))

dist/
├── src/
│   ├── idl/              ← Automatically copied by NestJS
│   │   ├── asset_registry.json
│   │   ├── marketplace.json
│   │   └── access_control.json
│   └── solana/
│       └── solana.service.js (requires ../../idl/...)
```

## ✅ Benefits

1. **Native NestJS Support**: No custom scripts needed
2. **Automatic**: Works during build and watch mode
3. **Reliable**: NestJS handles path resolution
4. **Hot Reload**: Changes copied automatically in dev mode
5. **Clean**: Standard NestJS approach

## 🔧 Pre-Build Step

We still need to copy IDL files from the contract repo before building:

```bash
# Copy from contract repo to src/idl/
npm run copy:idl
# or
bun run copy:idl

# Then build (NestJS copies to dist automatically)
npm run build
```

The `prebuild` script in `package.json` handles this automatically.

## 🚀 Workflow

1. **Update Contracts**:
   ```bash
   cd scrunchy-contract
   anchor build
   ```

2. **Copy IDL Files** (automatic via prebuild):
   ```bash
   cd scrunchy-backend
   npm run build
   # prebuild script runs: npm run copy:idl
   # NestJS then copies src/idl/ → dist/src/idl/
   ```

3. **Development**:
   ```bash
   npm run start:dev
   # NestJS watches and copies IDL changes automatically
   ```

## 🎯 Runtime Path Resolution

The `require()` paths in your code work correctly:

```typescript
// In src/solana/solana.service.ts
const assetRegistryIdl = require('../../idl/asset_registry.json');

// At runtime (from dist/src/solana/solana.service.js):
// Resolves to: dist/src/idl/asset_registry.json ✅
```

## ✅ Verification

After building, verify IDL files are in dist:

```bash
ls -lh dist/src/idl/*.json
```

You should see:
- `dist/src/idl/access_control.json`
- `dist/src/idl/asset_registry.json`
- `dist/src/idl/marketplace.json`

## 🚨 Important Notes

- **IDL files must exist in `src/idl/`** before building
- **NestJS automatically copies them** to `dist/src/idl/`
- **No manual copying needed** - NestJS handles it
- **Watch mode works** - changes are automatically copied

## 📝 Summary

✅ **Before**: Custom scripts to copy IDL files to dist  
✅ **Now**: NestJS native asset copying via `nest-cli.json`  
✅ **Result**: Cleaner, more reliable, standard NestJS approach

