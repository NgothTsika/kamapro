# Module Resolution Fix for Vercel Deployment

## Problem

The Vercel deployment was failing with error:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/server/src/config/env'
imported from /var/task/server/src/index.js
```

This happened because:

1. Vercel was trying to import TypeScript modules directly instead of compiled JavaScript
2. The API wrapper file wasn't importing from the correct compiled location
3. The `vercel.json` configuration had incorrect paths

## Solution

Made the following changes:

### 1. **tsconfig.json** - Fixed TypeScript compilation configuration

- Kept `rootDir: "."` to handle the full monorepo structure
- Added both `src/**/*` and `api/**/*` to includes
- This ensures both source and API files are compiled to `/dist`

### 2. **api/index.ts** - Updated import path

- Changed from: `import app from "../src/index";`
- Changed to: `import app from "../dist/src/index.js";`
- This ensures Vercel imports the compiled JavaScript, not the TypeScript source

### 3. **vercel.json** - Updated function path

- Updated function path from `"server/api/index.ts"` to `"api/index.ts"`
- This matches the actual directory structure where `api/` is at the root level

## How It Works on Vercel

1. Build step: `npx prisma generate && yarn build`
   - Compiles TypeScript (`tsc`) → outputs to `./dist`
   - Generates Prisma types → `@prisma/client`

2. Vercel detects and wraps `api/index.ts` as a serverless function
3. The wrapper imports the compiled Express app from `../dist/src/index.js`
4. All environment variables and modules are properly resolved

## Verification

The fix ensures:

- ✓ Compiled TypeScript is used in production (not source .ts files)
- ✓ All relative imports work correctly
- ✓ Vercel build process is properly configured
- ✓ Environment configuration loads without errors
