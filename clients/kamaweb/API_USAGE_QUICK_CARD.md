# API Usage Quick Card

## One-Minute Setup

```typescript
// In your component:
'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { getAdminUsers } from '@/lib/kama-api';
import { useEffect, useState } from 'react';

export default function MyComponent() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (token) {
      getAdminUsers(token).then(setUsers);
    }
  }, [token]);

  return <ul>{users.map(u => <li key={u.id}>{u.email}</li>)}</ul>;
}
```

**That's it! You're using the API! ✅**

---

## Common Patterns

### Pattern 1: Get Data with Loading/Error

```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  if (!token) return;

  getAdminUsers(token)
    .then(setData)
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
}, [token]);

if (loading) return <p>Loading...</p>;
if (error) return <p>Error: {error}</p>;
return <div>{/* render data */}</div>;
```

### Pattern 2: Create Data with Form

```typescript
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const result = await createAdminUser(token, {
      email, username, password
    });
    console.log('Success:', result);
  } catch (err) {
    console.error('Error:', err.message);
  }
};

return (
  <form onSubmit={handleSubmit}>
    <input value={email} onChange={e => setEmail(e.target.value)} />
    <button type="submit">Create</button>
  </form>
);
```

### Pattern 3: Handle Errors Properly

```typescript
try {
  const data = await getAdminUsers(token);
  setData(data);
} catch (error) {
  if (error instanceof ApiError) {
    // Handle API errors
    console.error(`Error ${error.status}: ${error.message}`);
  } else {
    // Handle other errors
    console.error("Unexpected error:", error);
  }
}
```

---

## Import Cheat Sheet

```typescript
// Get all types
import type { AdminUser, MeUser, Character } from "@/lib/kama-api";

// Get all functions
import {
  getMe,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getHearts,
  getStreaks,
  getAllLessons,
  getLessonBySlug,
} from "@/lib/kama-api";

// Get error class
import { ApiError } from "@/lib/kama-api";

// Get auth context
import { useAuth } from "@/lib/auth/auth-context";
```

---

## Common Endpoints

### Users

| Function                               | What it does          |
| -------------------------------------- | --------------------- |
| `getMe(token)`                         | Get current user info |
| `getAdminUsers(token)`                 | Get all admin users   |
| `createAdminUser(token, data)`         | Create new admin      |
| `updateAdminUser(token, userId, data)` | Update admin          |
| `deleteAdminUser(token, userId)`       | Delete admin          |

### Gamification

| Function                           | What it does         |
| ---------------------------------- | -------------------- |
| `getHearts(token)`                 | Get hearts data      |
| `getStreaks(token)`                | Get streaks data     |
| `getUnlockedCharacters(token)`     | Get unlocked chars   |
| `unlockCharacter(token, charId)`   | Unlock a character   |
| `purchaseCharacter(token, charId)` | Purchase a character |

### Content

| Function                | What it does         |
| ----------------------- | -------------------- |
| `getAllLessons()`       | Get all lessons      |
| `getLessonBySlug(slug)` | Get lesson by slug   |
| `getAllCharacters()`    | Get all characters   |
| `getCharacter(id)`      | Get single character |

**See lib/kama-api.ts for complete list!**

---

## Error Handling

### Basic Error Handling

```typescript
try {
  const result = await getAdminUsers(token);
} catch (error) {
  console.error("Failed:", error.message);
}
```

### Advanced Error Handling

```typescript
try {
  const result = await getAdminUsers(token);
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        console.log("Not authorized - redirect to login");
        break;
      case 404:
        console.log("Not found");
        break;
      case 500:
        console.log("Server error");
        break;
      default:
        console.log(`Error: ${error.message}`);
    }
  }
}
```

---

## TypeScript Types

```typescript
// Get the right type
import type { AdminUser } from '@/lib/kama-api';

// Use it
const users: AdminUser[] = await getAdminUsers(token);
const user: AdminUser = await createAdminUser(token, {...});

// Available types
type MeUser = {...}
type AdminUser = {...}
type Character = {...}
type Lesson = {...}
type UserHeartsResponse = {...}
type UserStreakResponse = {...}
// ... and many more in lib/kama-api.ts
```

---

## Authentication

```typescript
// Always get token first
import { useAuth } from '@/lib/auth/auth-context';

const MyComponent = () => {
  const { token } = useAuth();

  // Check if token exists
  if (!token) {
    return <p>Please log in</p>;
  }

  // Use token in API calls
  const data = await getAdminUsers(token);

  return <div>{/* render */}</div>;
};
```

---

## File Upload

```typescript
// Add to lib/kama-api.ts:
export async function uploadFile(
  token: string,
  file: File,
  path: string = "uploads/",
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("path", path);

  const response = await fetch("/api/storage/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  return response.json();
}

// Use in component:
const handleFileUpload = async (file: File) => {
  const result = await uploadFile(token, file, "uploads/");
  console.log("Uploaded:", result.url);
};
```

---

## With React Query (Optional)

```typescript
import { useQuery } from "@tanstack/react-query";
import { getAdminUsers } from "@/lib/kama-api";

const { data, isLoading, error } = useQuery({
  queryKey: ["admin-users"],
  queryFn: () => getAdminUsers(token!),
  enabled: !!token,
});
```

---

## Debugging

### Check Proxy Logs

```
[API PROXY] GET /api/v1/users/admin
[API PROXY] Response: 200 GET /api/v1/users/admin
```

### Check Network Tab

- Look at request/response headers
- Check response status code
- Verify Authorization header is sent

### Common Issues

```typescript
// ❌ No token
getAdminUsers(undefined); // Will fail

// ✅ Has token
const { token } = useAuth();
getAdminUsers(token); // Works!

// ❌ Not authenticated
fetch("/api/v1/admin/users"); // 401 Unauthorized

// ✅ Authenticated
fetch("/api/v1/admin/users", {
  headers: { Authorization: `Bearer ${token}` },
}); // Works!
```

---

## Do's and Don'ts

### ✅ DO

- Use `lib/kama-api.ts` functions
- Check if token exists before calling
- Handle errors properly
- Import types for TypeScript
- Use `useAuth()` to get token

### ❌ DON'T

- Call `fetch()` directly (if function exists in kama-api.ts)
- Forget to pass token
- Ignore error responses
- Use `any` type when you have proper types
- Hardcode API URLs (use lib/kama-api.ts)

---

## Next Actions

1. ✅ Copy a pattern from above
2. ✅ Add it to your component
3. ✅ Get token with `useAuth()`
4. ✅ Call API function
5. ✅ Render the data

**That's literally it!** 🎉

---

## Files to Reference

| File                          | For                     |
| ----------------------------- | ----------------------- |
| `lib/kama-api.ts`             | All available functions |
| `lib/kama-types.ts`           | All available types     |
| `FRONTEND_API_INTEGRATION.md` | Detailed examples       |
| `API_QUICK_REFERENCE.md`      | Before/after comparison |
| `app/api/README.md`           | How proxy works         |

---

## Support

Need help?

- Check `FRONTEND_API_INTEGRATION.md` for detailed examples
- Look at `lib/kama-api.ts` to see what functions exist
- Check console logs for `[API PROXY]` messages
- Verify your `.env.local` has `NEXT_PUBLIC_API_URL` set

---

**You've got this! 🚀**
