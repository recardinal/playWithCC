# API Integration Guide

## Overview

This Next.js application is designed to run in a WebView with jsbridge authentication. The token is obtained from the native app and automatically injected into all API requests.

## Architecture

```
Native App (iOS/Android)
    ↓ window.proxy.getToken(callback)
Next.js WebView
    ↓ useAuth() / useToken()
API Client (auto-injects token)
    ↓ Authorization: Bearer {token}
Backend API
```

## Setup

### 1. Environment Variables

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-backend-api.com
NEXT_PUBLIC_MOCK_TOKEN=your-mock-token-for-development
```

### 2. JsBridge Interface

The app expects the native app to provide:

```javascript
window.proxy.getToken(callback)
```

**Callback signature:**

```typescript
callback: (token: string) => void
```

## Usage

### Getting the Token

```tsx
import { useAuth, useToken } from "@/contexts/auth-context"

function MyComponent() {
  // Full auth context
  const { token, isLoading, error, refreshToken } = useAuth()

  // Or just the token
  const token = useToken()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return <div>Token: {token}</div>
}
```

### Making API Requests

#### Option 1: Using Hooks (Recommended)

```tsx
import { useApiQuery, useApiMutation } from "@/hooks/use-api"

// GET request
function UserList() {
  const { data, isLoading, error } = useApiQuery<User[]>("/api/users", [
    "users",
  ])

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {data?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}

// POST request
function CreateUser() {
  const createUser = useApiMutation<User, CreateUserData>(
    "/api/users",
    "POST",
    {
      onSuccess: (data) => console.log("Created:", data),
      invalidateQueries: [["users"]], // Refetch users list
    }
  )

  return (
    <button
      onClick={() => createUser.mutate({ name: "John" })}
      disabled={createUser.isPending}
    >
      Create User
    </button>
  )
}
```

#### Option 2: Using API Client Directly

```tsx
import { api } from "@/lib/api-client"
import { useToken } from "@/contexts/auth-context"

function MyComponent() {
  const token = useToken()

  const fetchUsers = async () => {
    try {
      const users = await api.get<User[]>("/api/users", token)
      console.log(users)
    } catch (error) {
      console.error(error)
    }
  }

  return <button onClick={fetchUsers}>Fetch Users</button>
}
```

#### Option 3: Using TanStack Query Manually

```tsx
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api-client"
import { useToken } from "@/contexts/auth-context"

function MyComponent() {
  const token = useToken()

  const { data } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get("/api/users", token),
    enabled: !!token,
  })

  return <div>{/* render data */}</div>
}
```

## API Client Methods

```typescript
import { api } from "@/lib/api-client"

// GET
const data = await api.get<T>("/endpoint", token)

// POST
const result = await api.post<T>("/endpoint", { data }, token)

// PUT
const result = await api.put<T>("/endpoint", { data }, token)

// PATCH
const result = await api.patch<T>("/endpoint", { data }, token)

// DELETE
const result = await api.delete<T>("/endpoint", token)
```

## Development Mode

### Running Locally

When running locally without the native app, the jsbridge is automatically mocked:

1. Mock is initialized automatically in development
2. Returns `NEXT_PUBLIC_MOCK_TOKEN` from `.env.local`
3. Simulates async behavior (100ms delay)

### Custom Mock

You can manually initialize a custom mock:

```tsx
import { mockJsBridge } from "@/lib/jsbridge"

// Initialize with custom token
mockJsBridge("my-custom-token")
```

## Error Handling

### Token Loading Errors

```tsx
import { useAuth } from "@/contexts/auth-context"

function MyComponent() {
  const { error, refreshToken } = useAuth()

  if (error) {
    return (
      <div>
        <p>Failed to load token: {error.message}</p>
        <button onClick={refreshToken}>Retry</button>
      </div>
    )
  }

  return <div>Content</div>
}
```

### API Request Errors

```tsx
import { useApiQuery } from "@/hooks/use-api"

function MyComponent() {
  const { data, error, refetch } = useApiQuery("/api/users", ["users"])

  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    )
  }

  return <div>{/* render data */}</div>
}
```

## TypeScript Types

### Extending JsBridge

If your native app provides additional methods:

```typescript
// src/types/jsbridge.ts
export interface JsBridge {
  getToken: (callback: (token: string) => void) => void
  getUserInfo: (callback: (info: UserInfo) => void) => void // Add more
  // ... other methods
}
```

### API Response Types

Define your API response types:

```typescript
// src/types/api.ts
export interface User {
  id: number
  name: string
  email: string
}

export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}
```

Use with hooks:

```typescript
import { useApiQuery } from "@/hooks/use-api"
import type { ApiResponse, User } from "@/types/api"

const { data } = useApiQuery<ApiResponse<User[]>>("/api/users", ["users"])
```

## Best Practices

1. **Always use hooks** (`useApiQuery`, `useApiMutation`) for data fetching
2. **Define TypeScript types** for all API responses
3. **Use query keys consistently** for cache management
4. **Handle loading and error states** in all components
5. **Don't expose tokens** in production logs
6. **Set appropriate staleTime** for different data types

## Troubleshooting

### Token Not Available

**Problem:** `token` is `null`

**Solutions:**

1. Check if jsbridge is available: `window.proxy`
2. Verify native app calls the callback
3. Check console for errors
4. Try refreshing: `refreshToken()`

### API Calls Failing

**Problem:** API requests return 401/403

**Solutions:**

1. Verify token is being sent: Check Network tab
2. Check `Authorization` header format
3. Verify `NEXT_PUBLIC_API_URL` is correct
4. Check backend CORS configuration

### Development Mode Issues

**Problem:** Mock token not working

**Solutions:**

1. Ensure `.env.local` exists
2. Verify `NEXT_PUBLIC_MOCK_TOKEN` is set
3. Restart dev server after env changes
4. Check browser console for mock initialization

## Examples

See `src/components/example-usage.tsx` for a complete working example.

## File Structure

```
src/
├── types/
│   └── jsbridge.ts           # JsBridge TypeScript types
├── lib/
│   ├── jsbridge.ts           # JsBridge utilities
│   ├── api-client.ts         # API client with token injection
│   └── utils.ts              # General utilities
├── contexts/
│   └── auth-context.tsx      # Auth context & token management
├── hooks/
│   └── use-api.ts            # API hooks (useApiQuery, useApiMutation)
└── components/
    ├── providers.tsx         # Root providers
    └── example-usage.tsx     # Usage examples
```
