# API Consolidation Migration Guide

## Summary

You now have a unified API proxy at `app/api/[[...route]]/route.ts` that handles ALL API requests. This replaces the 42 individual route files that were previously scattered throughout `app/api/`.

## What Changed

### Before

- 42 separate route files
- Duplicate code in each file
- Different patterns in different files
- Hard to maintain and debug

### After

- 1 unified route handler
- Consistent behavior across all endpoints
- Easier to maintain and modify
- Better error handling and logging

## How to Clean Up

### Step 1: Test the Unified Proxy

Before deleting individual route files, test the new unified proxy:

```bash
# Start your app
npm run dev

# Test a few endpoints to ensure they work:
curl http://localhost:3000/api/auth/email -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

curl http://localhost:3000/api/v1/users/admin \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 2: Delete Individual Route Files

Once you're confident the proxy works, delete these folders/files:

```bash
# Remove all v1 route files (they're now handled by the proxy)
rm -rf app/api/v1/

# Remove individual auth routes (use proxy instead)
rm -rf app/api/auth/email/

# Remove individual storage routes (use proxy instead)
rm -rf app/api/storage/
```

### Step 3: Update Frontend Code (if needed)

The frontend already calls `/api/...` paths, so no changes needed! But ensure consistency:

```typescript
// This already works with the new proxy:
const response = await fetch("/api/auth/email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "test@example.com" }),
});

const response = await fetch("/api/v1/admin/users", {
  method: "GET",
  headers: { Authorization: `Bearer ${token}` },
});
```

## File Deletion Checklist

### Remove These Folders

- [ ] `app/api/v1/` (entire folder with all subfolders)
- [ ] `app/api/auth/email/` (keep the parent `auth` folder if empty, or remove)
- [ ] `app/api/storage/` (entire folder)

### Keep These

- [ ] `app/api/[[...route]]/route.ts` (the unified proxy)
- [ ] `app/api/README.md` (documentation)

### Detailed File List to Delete

#### Auth Routes

```
app/api/auth/email/route.ts
```

#### Storage Routes

```
app/api/storage/upload/route.ts
app/api/storage/delete/route.ts
app/api/storage/delete-multiple/route.ts
```

#### V1 Admin Routes

```
app/api/v1/admin/gamification/hearts/route.ts
app/api/v1/admin/gamification/hearts/[userId]/[action]/route.ts
app/api/v1/admin/gamification/hearts/recovery-history/route.ts
app/api/v1/admin/gamification/hearts/restore-all/route.ts
app/api/v1/admin/gamification/hearts/stats/route.ts
app/api/v1/admin/gamification/streaks/route.ts
app/api/v1/admin/gamification/streaks/[userId]/[action]/route.ts
app/api/v1/admin/gamification/streaks/stats/route.ts
app/api/v1/admin/gamification/characters/route.ts
app/api/v1/admin/gamification/characters/[userId]/[characterId]/unlock/route.ts
app/api/v1/admin/gamification/characters/stats/route.ts
app/api/v1/admin/gamification/events/route.ts
app/api/v1/admin/gamification/events/[eventId]/route.ts
app/api/v1/admin/gamification/users/[userId]/profile/route.ts
app/api/v1/users/admin/route.ts
app/api/v1/users/admin/[userId]/route.ts
(and all other files in app/api/v1/)
```

## Verification Steps

### 1. Build Check

```bash
npm run build
# Should complete without errors
```

### 2. Type Check

```bash
npx tsc --noEmit
# Should show no TypeScript errors
```

### 3. Runtime Test

```bash
npm run dev

# Test various endpoints:
# - Auth endpoints
# - Admin endpoints
# - Storage endpoints
# - User endpoints
```

### 4. Lint Check

```bash
npm run lint
# Should pass without issues
```

## Rollback Plan

If something goes wrong and you need to revert:

1. The old individual route files are still in version control
2. Simply restore them: `git checkout app/api/`
3. The unified proxy will still work alongside them (it won't interfere)

## Benefits Summary

✅ **Code Reduction**: 42 files → 1 file  
✅ **Maintainability**: Single source of truth  
✅ **Consistency**: Same error handling everywhere  
✅ **Performance**: Same runtime performance, faster build  
✅ **Debugging**: Centralized logging  
✅ **Type Safety**: Can add TypeScript types to proxy

## Next: Consolidate lib/kama-api.ts

After you've cleaned up the `app/api/` folder, consider:

1. **Frontend could call the unified proxy**: Instead of calling backend directly via `lib/kama-api.ts`, it could use `/api/...` paths
2. **lib/kama-api.ts becomes a client wrapper**: Could wrap the `/api/...` calls with typed interfaces

But this is optional - the current setup works well!

## Questions?

If you have questions about specific endpoints or need to modify the proxy behavior, refer to:

- `app/api/[[...route]]/route.ts` - The unified proxy implementation
- `app/api/README.md` - Technical documentation
- `lib/kama-api.ts` - The API types and client functions
