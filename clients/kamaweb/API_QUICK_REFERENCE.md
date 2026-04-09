# API Access Cheat Sheet

## Quick Decision Tree

```
Do you want type-safe calls?
├─ YES → Use lib/kama-api.ts ⭐ RECOMMENDED
└─ NO  → Use Direct fetch() calls
```

---

## Side-by-Side Comparison

### Getting a List of Users

#### Option A: Direct Fetch

```typescript
const response = await fetch("/api/v1/users/admin", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await response.json(); // data has type 'any' ❌
const users = data.users; // No type checking
```

#### Option B: Using lib/kama-api.ts ⭐

```typescript
import { getAdminUsers } from "@/lib/kama-api";

const users = await getAdminUsers(token); // Type is AdminUser[] ✅
```

---

### Creating an Admin User

#### Option A: Direct Fetch

```typescript
const response = await fetch("/api/v1/users/admin", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    email: "test@example.com",
    username: "testuser",
    password: "password123",
  }),
});

if (!response.ok) {
  const error = await response.json();
  console.error(error.error); // string | undefined ❌
}

const result = await response.json(); // type 'any' ❌
```

#### Option B: Using lib/kama-api.ts ⭐

```typescript
import { createAdminUser, type AdminUser } from "@/lib/kama-api";

try {
  const newUser: AdminUser = await createAdminUser(token, {
    email: "test@example.com",
    username: "testuser",
    password: "password123",
  });
  console.log(`Created: ${newUser.email}`);
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`Status ${error.status}: ${error.message}`);
  }
}
```

---

### Uploading a File

#### Option A: Direct Fetch

```typescript
const formData = new FormData();
formData.append("file", file);
formData.append("path", "uploads/");

const response = await fetch("/api/storage/upload", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

// No type info, no error details
const result = await response.json();
```

#### Option B: Using lib/kama-api.ts ⭐

```typescript
import { uploadFile } from "@/lib/kama-api";

try {
  const result = await uploadFile(token, file, "uploads/");
  console.log(`Uploaded: ${result.url}`);
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`Upload failed: ${error.message}`);
  }
}
```

---

## Error Handling Comparison

### Direct Fetch (Error Prone)

```typescript
const response = await fetch("/api/v1/admin/users", {
  headers: { Authorization: `Bearer ${token}` },
});

if (!response.ok) {
  // ❌ Response might not be JSON
  const error = await response.json();
  // ❌ error.error might not exist
  console.error(error.error || "Unknown error");
  // ❌ No status code information
  return null;
}

const data = await response.json();
// ❌ No type checking
return data.users;
```

### lib/kama-api.ts (Safe)

```typescript
try {
  // ✅ Always returns proper type
  const users = await getAdminUsers(token);
  return users;
} catch (error) {
  // ✅ Catches ApiError with status and message
  if (error instanceof ApiError) {
    console.error(`API Error ${error.status}: ${error.message}`);
  } else {
    console.error("Unexpected error:", error);
  }
  return null;
}
```

---

## TypeScript Benefits

### Without lib/kama-api.ts

```typescript
const response = await fetch("/api/v1/admin/users", {
  headers: { Authorization: `Bearer ${token}` },
});
const data = await response.json(); // type: any

// TypeScript can't help here:
data.uuserss.map((u) => u.name); // ❌ Typo - TypeScript allows it!
// Runtime Error: Cannot read property 'map' of undefined
```

### With lib/kama-api.ts ⭐

```typescript
const users = await getAdminUsers(token); // type: AdminUser[]

// TypeScript catches typos immediately:
users.uuserss.map((u) => u.name); // ❌ Error: Property 'uuserss' not found
users.map((u) => u.name); // ✅ Works perfectly
```

---

## Architecture Flow

### Direct Fetch Flow

```
Component
    ↓ fetch()
Next.js Proxy (/api/[[...route]])
    ↓ forwards
Backend
    ↓ response
Next.js Proxy
    ↓ passes through
Component (any type) ❌
```

### lib/kama-api.ts Flow

```
Component
    ↓ getAdminUsers(token)
lib/kama-api.ts (typed wrapper)
    ↓ fetch()
Next.js Proxy (/api/[[...route]])
    ↓ forwards
Backend
    ↓ response
Next.js Proxy
    ↓ passes through
lib/kama-api.ts (converts to type)
    ↓ returns AdminUser[]
Component (typed) ✅
```

---

## When to Use Each

### Use Direct Fetch When:

- ❌ You don't want type safety (not recommended)
- ❌ One-off API calls (still better to add to kama-api.ts)
- ❌ Prototyping quickly (but convert to kama-api.ts soon)

### Use lib/kama-api.ts When: ⭐ ALWAYS

- ✅ Building real features
- ✅ Want type safety
- ✅ Need consistent error handling
- ✅ Building production code
- ✅ Working with a team
- ✅ Want IDE autocompletion

---

## Adding New Endpoints to lib/kama-api.ts

### Step 1: Define Types (if needed)

```typescript
// In lib/kama-types.ts
export interface MyNewResponse {
  id: string;
  name: string;
  // ... other fields
}
```

### Step 2: Add API Function

```typescript
// In lib/kama-api.ts
export async function getMyNewData(token: string): Promise<MyNewResponse> {
  const data = await apiRequest<{ data: MyNewResponse }>("/my-endpoint", {
    token,
  });
  return data.data;
}
```

### Step 3: Use in Component

```typescript
// In your component
import { getMyNewData } from "@/lib/kama-api";

const myData = await getMyNewData(token); // Fully typed! ✅
```

---

## Current Endpoint Examples

### Admin Users

```typescript
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from '@/lib/kama-api';

const users = await getAdminUsers(token);
const newUser = await createAdminUser(token, {...});
const updated = await updateAdminUser(token, userId, {...});
await deleteAdminUser(token, userId);
```

### Gamification

```typescript
import {
  getHearts,
  getStreaks,
  getUserHeartsResponse,
  getUserStreakResponse,
} from "@/lib/kama-api";

const hearts = await getHearts(token);
const streaks = await getStreaks(token);
const heartsData = await getUserHeartsResponse(token);
const streaksData = await getUserStreakResponse(token);
```

### And Many More!

Check `lib/kama-api.ts` for the complete list of available functions.

---

## Summary Table

| Aspect             | Direct Fetch | lib/kama-api.ts |
| ------------------ | ------------ | --------------- |
| **Type Safety**    | ❌ None      | ✅ Full         |
| **Error Handling** | ❌ Manual    | ✅ Built-in     |
| **IDE Help**       | ❌ No        | ✅ Yes          |
| **Reusability**    | ❌ No        | ✅ Yes          |
| **Code Quality**   | ❌ Lower     | ✅ Higher       |
| **Maintenance**    | ❌ Hard      | ✅ Easy         |
| **Recommended**    | ❌ No        | ✅ Yes          |

---

## TL;DR

**Always use `lib/kama-api.ts` for your API calls.** It's:

- ✅ Type-safe
- ✅ Well-maintained
- ✅ Centralized
- ✅ Easier to use
- ✅ Better for teams

Example:

```typescript
import { getAdminUsers } from "@/lib/kama-api";

const users = await getAdminUsers(token); // Done! ✅
```

That's it! No manual fetch, no error handling, no type casting. Just type-safe API calls.
