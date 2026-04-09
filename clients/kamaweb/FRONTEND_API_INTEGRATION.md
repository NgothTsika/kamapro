# Frontend API Integration - Complete Guide

## Your Setup Now

```
Frontend (React/Next.js)
         │
         ├─ lib/kama-api.ts (Typed API Client) ⭐ USE THIS
         │  - Centralized API functions
         │  - Type-safe (TypeScript)
         │  - Error handling built-in
         │
         └─ Direct fetch() calls (Avoid if possible)
            - No types
            - Manual error handling
            - Code duplication

Both use:
         │
         ↓
/api/[[...route]]/route.ts (Unified Proxy)
         - Single catch-all handler
         - Routes all requests
         - Forwards to backend

         ↓

Backend API (Express.js)
```

---

## How to Access the API

### Method 1: Using lib/kama-api.ts ⭐ RECOMMENDED

**Step 1: Import the function**

```typescript
import { getAdminUsers, createAdminUser } from "@/lib/kama-api";
```

**Step 2: Get your token**

```typescript
const { token } = useAuth();
```

**Step 3: Call the function**

```typescript
const users = await getAdminUsers(token);
console.log(users); // Array of AdminUser objects
```

**Example Component:**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { getAdminUsers, type AdminUser } from '@/lib/kama-api';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    getAdminUsers(token)
      .then(setUsers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Admin Users</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.email} ({user.role})</li>
        ))}
      </ul>
    </div>
  );
}
```

---

### Method 2: Using Direct fetch() (Not Recommended)

**When you really need to:**

```typescript
const response = await fetch("/api/v1/admin/users", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await response.json();
const users = data.users;
console.log(users); // type 'any' - no type checking!
```

**Problems with this approach:**

- ❌ No type safety
- ❌ Repetitive code
- ❌ Manual error handling
- ❌ Easy to make mistakes

---

## Available API Functions

All functions are in `lib/kama-api.ts`. Here are the main ones:

### User Functions

```typescript
// Get current user
getMe(token: string): Promise<MeUser>

// Get all admin users
getAdminUsers(token: string): Promise<AdminUser[]>

// Create new admin user
createAdminUser(token: string, data: AdminUserCreate): Promise<AdminUser>

// Update admin user
updateAdminUser(token: string, userId: string, data: AdminUserUpdate): Promise<AdminUser>

// Delete admin user
deleteAdminUser(token: string, userId: string): Promise<void>
```

### Gamification Functions

```typescript
// Get hearts
getHearts(token: string): Promise<UserHeartsResponse>

// Get streaks
getStreaks(token: string): Promise<UserStreakResponse>

// Get character progress
getUnlockedCharacters(token: string): Promise<UnlockedCharactersResponse>

// Unlock a character
unlockCharacter(token: string, characterId: string): Promise<UnlockCharacterResponse>

// Purchase a character
purchaseCharacter(token: string, characterId: string): Promise<PurchaseCharacterResponse>
```

### Content Functions

```typescript
// Get all lessons
getAllLessons(): Promise<Lesson[]>

// Get lesson by slug
getLessonBySlug(slug: string): Promise<LessonFull>

// Get all characters
getAllCharacters(): Promise<Character[]>

// Get single character
getCharacter(characterId: string): Promise<CharacterTranslationAdmin>
```

**See `lib/kama-api.ts` for complete list!**

---

## Common Use Cases

### 1. Display a List of Items

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getAdminUsers, type AdminUser, ApiError } from '@/lib/kama-api';

export default function UsersList() {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const data = await getAdminUsers(token);
        setUsers(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(`Error ${err.status}: ${err.message}`);
        } else {
          setError('Unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div>
      <h2>Users</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.email}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

### 2. Create/Edit a Form

```typescript
'use client';

import { useState } from 'react';
import { createAdminUser, type ApiError } from '@/lib/kama-api';

export default function CreateUserForm() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!token) throw new Error('No token available');

      const newUser = await createAdminUser(token, {
        email,
        username,
        password
      });

      console.log('User created:', newUser);
      // Reset form
      setEmail('');
      setUsername('');
      setPassword('');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create user');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

---

### 3. Handle File Upload

```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';

// First, add this to lib/kama-api.ts if not present:
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
    throw new ApiError(response.status, 'Upload failed');
  }

  return response.json();
}

// Then use in component:
export default function FileUpload() {
  const { token } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploading(true);
    setError(null);

    try {
      const result = await uploadFile(token, file, 'uploads/');
      console.log('Upload complete:', result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

---

### 4. With React Query / SWR (Advanced)

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/auth-context';
import { getAdminUsers, type AdminUser } from '@/lib/kama-api';

export default function UsersList() {
  const { token } = useAuth();

  const { data: users, isLoading, error } = useQuery<AdminUser[]>({
    queryKey: ['admin-users'],
    queryFn: () => getAdminUsers(token!),
    enabled: !!token
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!users) return <p>No users found</p>;

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

## Request Flow Visualization

```
Your Component
       │
       │ const users = await getAdminUsers(token)
       ↓
lib/kama-api.ts
       │
       │ const data = await apiRequest<...>("/users/admin", { token })
       ↓
fetch('/api/v1/users/admin', {
  headers: { Authorization: 'Bearer token', ... }
})
       ↓
Next.js API Route: /api/[[...route]]/route.ts
       │
       ├─ Reconstruct path: /users/admin
       ├─ Check auth: ✓ Has Authorization header
       ├─ Forward request to backend
       │
       ↓
Backend Express API
       │
       ├─ Process request
       ├─ Return response
       │
       ↓
Next.js API Route (Response)
       │
       ├─ Forward response
       │
       ↓
lib/kama-api.ts
       │
       ├─ Parse JSON: response.json()
       ├─ Return typed data: AdminUser[]
       │
       ↓
Your Component
       │
       └─ Receives: users = [AdminUser, AdminUser, ...]
```

---

## Troubleshooting

### "Token is undefined"

```typescript
// ❌ Wrong - useAuth() might return undefined token
const { token } = useAuth();
const users = await getAdminUsers(token);

// ✅ Correct - Check token exists
const { token } = useAuth();
if (!token) {
  console.log("User not logged in");
  return;
}
const users = await getAdminUsers(token);
```

### "Type 'any' is not assignable to type 'AdminUser[]'"

```typescript
// ❌ Wrong - response.json() returns 'any'
const response = await fetch('/api/v1/admin/users', {...});
const users: AdminUser[] = await response.json(); // Type error!

// ✅ Correct - Use lib/kama-api.ts which returns proper type
const users: AdminUser[] = await getAdminUsers(token); // No error!
```

### "401 Unauthorized"

```typescript
// ❌ Wrong - No authorization header
await fetch("/api/v1/admin/users");

// ✅ Correct - Include token
const { token } = useAuth();
const users = await getAdminUsers(token); // lib/kama-api handles header
```

---

## Summary

### Two Ways to Access APIs:

1. **lib/kama-api.ts ⭐ (Recommended)**
   - Type-safe
   - Centralized
   - Error handling included
   - Easier to use

2. **Direct fetch() (Avoid)**
   - No types
   - Manual error handling
   - Duplicate code

### Quick Start:

```typescript
import { getAdminUsers } from "@/lib/kama-api";
const users = await getAdminUsers(token);
```

That's it! You're ready to build your frontend! 🚀
