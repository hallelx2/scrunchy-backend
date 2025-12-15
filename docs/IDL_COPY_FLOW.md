# IDL File Copy Flow

## 🔄 Two-Step Process

### Step 1: Contract Repo → Backend Source (Still Needed ✅)

**Script**: `prebuild` → `copy:idl`

**Purpose**: Copy IDL files from contract repo to backend source directory

```
../scrunchy-contract/target/idl/*.json → src/idl/*.json
```

**Why needed**:
- IDL files are generated in the contract repo when you run `anchor build`
- They need to be in `src/idl/` before NestJS can process them
- NestJS only copies from `src/` to `dist/`, not from external repos

### Step 2: Backend Source → Dist (Automatic ✅)

**Process**: NestJS build (via `nest-cli.json`)

**Purpose**: Copy IDL files from source to dist during build

```
src/idl/*.json → dist/src/idl/*.json (automatic)
```

**Why automatic**:
- Configured in `nest-cli.json` as assets
- NestJS handles this during `nest build`
- Also works in watch mode (`start:dev`)

## 🤔 Can We Remove Step 1?

### Option 1: Keep It (Recommended ✅)

**Pros**:
- ✅ Ensures IDL files are always up-to-date
- ✅ Automatic - no manual steps
- ✅ Works for CI/CD pipelines
- ✅ Handles contract updates seamlessly

**Cons**:
- ⚠️ Requires contract repo to be built first
- ⚠️ Adds a small step to build process

### Option 2: Make It Optional

Only copy if files don't exist or are outdated:

```bash
# Only copy if src/idl/ is empty or contract IDL is newer
if [ ! -d "src/idl" ] || [ -z "$(ls -A src/idl)" ] || \
   [ "../scrunchy-contract/target/idl/asset_registry.json" -nt "src/idl/asset_registry.json" ]; then
  # Copy files
fi
```

**Pros**:
- ✅ Faster builds if IDL files already exist
- ✅ Still ensures files are up-to-date

**Cons**:
- ⚠️ More complex script
- ⚠️ Might miss updates in some edge cases

### Option 3: Remove It (Not Recommended ❌)

**Pros**:
- ✅ Simpler build process

**Cons**:
- ❌ Requires manual copying of IDL files
- ❌ Easy to forget after contract updates
- ❌ Breaks CI/CD automation
- ❌ IDL files might be out of sync

## 💡 Recommendation

**Keep the `prebuild` step** because:

1. **Separation of Concerns**:
   - Contract repo generates IDL files
   - Backend repo consumes them
   - Clear boundary between repos

2. **Automation**:
   - No manual steps required
   - Works in all environments (local, CI/CD)
   - Always ensures latest IDL files

3. **Reliability**:
   - Can't forget to copy files
   - Build fails if contract repo not built
   - Clear error messages

4. **Standard Practice**:
   - Common pattern in monorepos
   - Similar to copying generated types
   - Well-understood workflow

## 📋 Current Setup (Optimal)

```json
{
  "scripts": {
    "prebuild": "npm run copy:idl",  // Step 1: Contract → src/
    "build": "nest build"             // Step 2: src/ → dist/ (automatic)
  }
}
```

**Flow**:
1. `prebuild` runs automatically before `build`
2. Copies IDL from contract repo to `src/idl/`
3. `nest build` compiles TypeScript
4. NestJS automatically copies `src/idl/` to `dist/src/idl/`
5. Runtime code can access IDL files ✅

## ✅ Conclusion

**Yes, the `prebuild` step is still necessary** because:
- NestJS only handles `src/` → `dist/` copying
- IDL files originate from the contract repo
- We need to bridge the gap between repos
- It ensures files are always up-to-date

The two-step process is the correct approach:
1. **prebuild**: External → Source (manual script)
2. **build**: Source → Dist (NestJS automatic)

