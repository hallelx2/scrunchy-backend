# IDL Build & Runtime Setup

## 📋 Overview

IDL files are now automatically copied to the `dist` folder during build, ensuring they're available at runtime. The build process has been updated to handle this automatically.

## 🔄 Automatic Process

### Build Process

1. **Pre-build**: Copies IDL files from contract repo to `src/idl/`
2. **Build**: Compiles TypeScript to JavaScript
3. **Post-build**: Copies IDL files from `src/idl/` to `dist/idl/`

### Development Process

1. **Pre-start**: Ensures IDL files are copied before starting dev server
2. **Watch mode**: NestJS watch mode will rebuild when files change

## 📁 File Locations

**Source** (from contract repo):
- `../scrunchy-contract/target/idl/*.json`

**Development** (in backend):
- `src/idl/*.json` - Used during development

**Production** (in dist):
- `dist/idl/*.json` - Used at runtime

## 🚀 Usage

### Normal Development

```bash
# Start dev server (automatically copies IDL files first)
npm run start:dev
# or
bun run start:dev
```

### Building for Production

```bash
# Build (automatically copies IDL files)
npm run build
# or
bun run build

# The dist folder will contain:
# - dist/main.js
# - dist/idl/*.json (all IDL files)
```

### Manual IDL Copy

If you need to manually copy IDL files:

```bash
# Copy from contract repo
npm run copy:idl

# This copies to src/idl/
# The build process will then copy to dist/idl/
```

## 🔧 Scripts

- `prebuild` - Runs before build, ensures IDL files are copied
- `build` - Compiles TypeScript
- `postbuild` - Copies IDL files to dist folder
- `prestart:dev` - Ensures IDL files before starting dev server
- `copy:idl` - Manually copy IDL files from contract repo
- `generate:clients` - Generate TypeScript clients from IDL (optional)

## ✅ Verification

Check that IDL files are in dist:

```bash
ls -lh dist/idl/*.json
```

You should see:
- `access_control.json`
- `asset_registry.json`
- `marketplace.json`

## 🎯 Runtime Access

IDL files are accessed at runtime using `require()`:

```typescript
// In solana.service.ts
const assetRegistryIdl = require('../idl/asset_registry.json');
```

The path `../idl/` resolves to `dist/idl/` at runtime since the compiled code is in `dist/`.

## 🚨 Important Notes

- **IDL files are automatically copied during build**
- **No manual copying needed for normal development**
- **IDL files must exist in `src/idl/` before building**
- **The build process handles everything automatically**

## 🔄 Workflow

1. **Update contracts** (in contract repo):
   ```bash
   cd scrunchy-contract
   anchor build
   ```

2. **Copy IDL files** (in backend repo):
   ```bash
   cd scrunchy-backend
   npm run copy:idl
   ```

3. **Build or start dev** (automatic):
   ```bash
   npm run build
   # or
   npm run start:dev
   ```

The IDL files will be automatically available in `dist/idl/` at runtime!

