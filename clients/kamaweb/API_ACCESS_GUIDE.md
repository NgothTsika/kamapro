# API Access Guide - Frontend Usage

Now that we have a unified API proxy, here's how to access APIs from the frontend.

## Two Approaches

### Approach 1: Direct API Proxy (Simpler)

Call the unified proxy directly from the frontend.

**Pros:**

- Direct calls, fewer layers
- Works immediately
- No additional wrapper needed

**Cons:**

- No type safety
- No centralized error handling in frontend

```typescript
// frontend/pages/dashboard.tsx
const response = await fetch("/api/v1/admin/users", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await response.json();
```

---

### Approach 2: Using lib/kama-api.ts (Recommended)

Use the existing typed API client from `lib/kama-api.ts`.

**Pros:**

- ✅ Type-safe
- ✅ Centralized error handling
- ✅ Cleaner code
- ✅ Reusable functions
- ✅ Consistent API patterns

**Cons:**

- One more abstraction layer (negligible performance impact)

```typescript
// frontend/pages/dashboard.tsx
import { getAdminUsers, type AdminUser } from "@/lib/kama-api";

// Call the typed function
const users: AdminUser[] = await getAdminUsers(token);
```

---

## Current Architecture

```
┌─────────────────────────┐
│   Frontend Components   │
│   (React/Next.js)       │
└────────────┬────────────┘
             │
             ├─ Approach 1: Direct Calls
             │              ↓
             │    /api/[[...route]]/route.ts
             │    (Unified Proxy)
             │              ↓
             │    Backend API
             │
             └─ Approach 2: Via lib/kama-api.ts
                            ↓
                   Typed Functions
                            ↓
                    /api/[[...route]]/route.ts
                    (Unified Proxy)
                            ↓
                    Backend API
```

---

## Code Examples

### Example 1: Get Admin Users

#### Using Approach 1 (Direct)

```typescript
// components/AdminUsers.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';

export default function AdminUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    // Direct call to proxy
    fetch('/api/v1/users/admin', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => setUsers(data.users))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.email}</li>
      ))}
    </ul>
  );
}
```

#### Using Approach 2 (Recommended)

```typescript
// components/AdminUsers.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { getAdminUsers, type AdminUser } from '@/lib/kama-api';

export default function AdminUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    // Call typed function
    getAdminUsers(token)
      .then(users => setUsers(users))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.email}</li>
      ))}
    </ul>
  );
}
```

---

### Example 2: Upload File

#### Using Approach 1 (Direct)

```typescript
// components/FileUpload.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';

export default function FileUpload() {
  const { token } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', 'uploads/');

    try {
      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      console.log('Upload successful:', data);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleUpload(e.target.files[0]);
          }
        }}
        disabled={uploading}
      />
    </div>
  );
}
```

#### Using Approach 2 (Recommended)

```typescript
// First, add to lib/kama-api.ts (if not already there):
export async function uploadFile(
  token: string,
  file: File,
  path: string = 'uploads/'
) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', path);

  const response = await fetch('/api/storage/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return response.json();
}

// Then use it in component:
// components/FileUpload.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { uploadFile } from '@/lib/kama-api';

export default function FileUpload() {
  const { token } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    if (!token) return;

    setUploading(true);
    try {
      const result = await uploadFile(token, file, 'uploads/');
      console.log('Upload successful:', result);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleUpload(e.target.files[0]);
          }
        }}
        disabled={uploading}
      />
    </div>
  );
}
```

---

### Example 3: Admin Operations

#### Using Approach 1 (Direct)

```typescript
// Create admin user
const response = await fetch("/api/v1/users/admin", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    email: "admin@example.com",
    username: "admin",
    password: "SecurePassword123!",
  }),
});
```

#### Using Approach 2 (Recommended)

```typescript
// Add to lib/kama-api.ts:
export async function createAdminUser(
  token: string,
  data: {
    email: string;
    username: string;
    password: string;
  },
): Promise<AdminUser> {
  const response = await fetch("/api/v1/users/admin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error("Failed to create admin");
  return response.json();
}

// Then use in component:
const newAdmin = await createAdminUser(token, {
  email: "admin@example.com",
  username: "admin",
  password: "SecurePassword123!",
});
```

---

## How It All Works Together

```
Frontend Component
    │
    ├─ Call: getAdminUsers(token)
    │
    ↓
lib/kama-api.ts
    │
    ├─ Makes: fetch('/api/v1/users/admin', {...})
    │
    ↓
app/api/[[...route]]/route.ts
    │
    ├─ Extracts: route = ["v1", "users", "admin"]
    ├─ Checks: requiresAuth("/v1/users/admin") = true
    ├─ Validates: Authorization header
    ├─ Constructs: http://localhost:3001/api/v1/users/admin
    │
    ↓
Backend Express API
    │
    ├─ Process request
    ├─ Return response
    │
    ↓
app/api/[[...route]]/route.ts
    │
    ├─ Forwards response
    │
    ↓
lib/kama-api.ts
    │
    ├─ Returns typed data: AdminUser[]
    │
    ↓
Frontend Component
    │
    ├─ Receives typed data
    └─ Renders UI
```

---

## Recommendation: Use Approach 2

### Why lib/kama-api.ts is Better

1. **Type Safety**

   ```typescript
   // TypeScript knows the return type
   const users: AdminUser[] = await getAdminUsers(token);
   //          ↑
   //     Type checking works!
   ```

2. **Centralized Error Handling**

   ```typescript
   // All API calls handle errors the same way
   export class ApiError extends Error {
     readonly status: number;
     constructor(status: number, message: string) { ... }
   }
   ```

3. **Consistent Patterns**

   ```typescript
   // All functions follow the same pattern
   export async function getMe(token: string): Promise<MeUser> { ... }
   export async function getAdminUsers(token: string): Promise<AdminUser[]> { ... }
   export async function createAdminUser(token: string, data: ...): Promise<AdminUser> { ... }
   ```

4. **Easier Refactoring**

   ```typescript
   // Change API behavior in one place
   // All components automatically use new behavior
   ```

5. **Better IDE Support**
   ```typescript
   // Autocomplete shows available functions
   import { get... } from '@/lib/kama-api';
   //        ↑
   //   IDE suggestions appear here
   ```

---

## Migration Path

If you have components using direct API calls:

### Before (Direct)

```typescript
const response = await fetch("/api/v1/admin/users", {
  method: "GET",
  headers: { Authorization: `Bearer ${token}` },
});
const users = await response.json();
```

### After (Using lib/kama-api.ts)

```typescript
import { getAdminUsers } from "@/lib/kama-api";

const users = await getAdminUsers(token);
```

---

## Summary

| Feature             | Direct API | lib/kama-api.ts |
| ------------------- | ---------- | --------------- |
| **Type Safety**     | ❌ No      | ✅ Yes          |
| **Error Handling**  | Per call   | Centralized     |
| **Code Reuse**      | No         | ✅ Yes          |
| **IDE Support**     | Limited    | ✅ Excellent    |
| **Maintainability** | Hard       | ✅ Easy         |
| **Learning Curve**  | Low        | Low             |
| **Performance**     | Identical  | Identical       |

---

## Next Steps

1. **Keep using lib/kama-api.ts** - It's already set up and working
2. **For new endpoints**, add them to lib/kama-api.ts
3. **Gradually migrate** existing direct calls to use lib/kama-api.ts
4. **Enjoy type-safe API calls!** ✅

---

## Quick Reference

### Getting Started

```typescript
// 1. Import the function you need
import { getAdminUsers, createAdminUser } from '@/lib/kama-api';

// 2. Get token from context
const { token } = useAuth();

// 3. Call the function with token
const users = await getAdminUsers(token);
const newAdmin = await createAdminUser(token, { ... });
```

### Common Functions

```typescript
// User functions
getMe(token);
getAdminUsers(token);
createAdminUser(token, data);
updateAdminUser(token, userId, data);
deleteAdminUser(token, userId);

// Gamification
getHearts(token);
getStreaks(token);
getUserHeartsResponse(token);
getUserStreakResponse(token);

// And many more... check lib/kama-api.ts for full list
```

Happy coding! 🚀
