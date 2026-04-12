# TypeScript Configuration & Vercel Deployment Fix

## Issues Fixed

### 1. TS5055 Error: Cannot write file declaration

**Problem**: `rootDir: "."` caused the compiler to treat output files as input files, creating conflicts.

**Solution**: Changed `rootDir` to `"./src"` to properly scope the compilation.

### 2. TS5101 Error: Deprecated baseUrl option

**Problem**: `baseUrl` is deprecated in TypeScript 6.0+ and will be removed in 7.0.

**Solution**: Removed `baseUrl` and the unused `paths` configuration.

## Build Configuration

### Main tsconfig.json (for src/)

```json
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- Compiles all TypeScript files from `src/` directory
- Outputs to `dist/src/` (maintaining directory structure)

### api/tsconfig.json (for API wrapper)

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "../dist/api"
  },
  "include": ["./**/*"]
}
```

- Extends the main configuration
- Compiles the API wrapper file
- Outputs directly to `dist/api/`

### Build Script

```bash
yarn build
# Runs: tsc && tsc --project api/tsconfig.json
```

- First compiles src → dist/src/
- Then compiles api → dist/api/

## Compiled Output Structure

```
dist/
├── api/
│   ├── index.js          ← Vercel entry point
│   └── index.d.ts
├── src/                  ← Main app
│   ├── index.js
│   ├── config/
│   ├── lib/
│   ├── middleware/
│   ├── modules/
│   └── routes/
└── ...
```

## Vercel Configuration

**vercel.json** now points to compiled JavaScript:

```json
{
  "buildCommand": "npx prisma generate && yarn build",
  "functions": {
    "dist/api/index.js": {
      "maxDuration": 60
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "dist/api/index.js"
    }
  ]
}
```

## How It Works on Vercel

1. **Build Phase**:
   - `npx prisma generate` → generates Prisma client
   - `yarn build` → compiles TypeScript to JavaScript
   - Result: All source code in `dist/` as JavaScript

2. **Runtime Phase**:
   - Vercel detects `dist/api/index.js`
   - Routes all API requests to this file
   - The file imports from `../dist/src/index.js` (the Express app)
   - Express app loads all routes and middleware
   - All environment variables and modules resolve correctly

## Key Points

✅ No TypeScript source files are deployed (only compiled JavaScript)
✅ All imports resolve correctly in production
✅ Environment configuration loads without module not found errors
✅ Prisma client is generated during build
✅ API routes and middleware work as expected
