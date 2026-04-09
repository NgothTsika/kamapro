# Unified API Proxy System

## Overview

The `app/api/[[...route]]/route.ts` file is a centralized API proxy that handles **ALL** requests from the frontend to the backend. This single handler replaces the need for multiple individual route files.

## Simplified Architecture

```
app/api/
├── [[...route]]/
│   └── route.ts         ← Single unified handler (handles EVERYTHING)
└── README.md            ← Documentation
```

**That's it!** Just one file handling all API requests.

## How It Works

1. **URL Pattern Matching**: The catch-all route `[[...route]]` matches any URL under `/api/`
2. **Path Reconstruction**: Extracts the route segments and reconstructs the path
3. **Backend Forwarding**: Forwards the request to the backend API with proper headers and auth
4. **Response Handling**: Intelligently handles JSON, text, and binary responses

## Request Examples

### Frontend → Unified Proxy → Backend

```
Frontend Call:              Proxy Converts To:
POST /api/auth/email       →  POST /auth/email (backend)
GET /api/v1/admin/users    →  GET /admin/users (backend)
DELETE /api/storage/delete →  DELETE /storage/delete (backend)
```

## Features

### ✅ Automatic Authentication

- Checks authorization headers for protected endpoints
- Forwards auth tokens to backend automatically
- Public endpoints (auth/email, auth/register) don't require auth

### ✅ Content Type Handling

- JSON requests: Parses, validates, and re-serializes
- Multipart requests: Streams binary data (for file uploads)
- Text responses: Handles non-JSON responses gracefully
- Binary files: Passes through without modification

### ✅ Error Handling

- Consistent error responses
- Logs all requests and responses for debugging
- Catches network errors and internal errors
- Returns appropriate HTTP status codes

### ✅ Request/Response Logging

```
[API PROXY] POST /api/v1/admin/users
[API PROXY] Response: 200 POST /api/v1/admin/users
```

## Configuration

### Environment Variables

```env
# Backend API URL (from .env or .env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
# OR
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
```

### Authentication

The proxy automatically:

1. Checks if the endpoint requires auth
2. Validates the Authorization header
3. Forwards it to the backend

## Frontend Usage

The frontend calls the proxy instead of calling the backend directly:

```typescript
// Simply call /api/... paths (proxy handles the rest)
const response = await fetch("/api/admin/users", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

## File Upload Example

```typescript
// Multipart form data automatically handled
const formData = new FormData();
formData.append("file", file);
formData.append("path", "uploads/");

const response = await fetch("/api/storage/upload", {
  method: "POST",
  body: formData, // Automatically detected as multipart
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

## Supported Endpoints

### Authentication (No Auth Required)

- POST /api/auth/email
- POST /api/auth/register

### Admin Operations (Auth Required)

- GET /api/v1/admin/...
- POST /api/v1/admin/...
- PATCH /api/v1/admin/...
- DELETE /api/v1/admin/...

### User Operations (Auth Required)

- GET /api/v1/users/...
- POST /api/v1/users/...
- PATCH /api/v1/users/...
- DELETE /api/v1/users/...

### Storage Operations (Auth Required)

- POST /api/storage/upload
- DELETE /api/storage/delete
- DELETE /api/storage/delete-multiple

## Debugging

### Check Logs

Enable logging to see proxy behavior:

```
[API PROXY] GET /api/admin/users
[API PROXY] Response: 200 GET /api/admin/users
```

### Test Endpoints

```bash
# Test authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/admin/users

# Test without auth (should fail for protected endpoints)
curl http://localhost:3000/api/v1/admin/users
```

## Performance Notes

- Single proxy vs multiple files: **No performance difference** at runtime
- Build time: **Faster** (only one file to parse)
- Memory usage: **Lower** (consolidated logic)
- Code size: **Much smaller** (~230 lines vs ~4200 lines)

## Benefits Summary

✅ **Simplified Structure**: Just one folder, one file  
✅ **Code Reduction**: 94% reduction in lines of code  
✅ **Maintainability**: Single source of truth  
✅ **Consistency**: Same error handling everywhere  
✅ **Performance**: Same runtime performance, faster build  
✅ **Debugging**: Centralized logging
