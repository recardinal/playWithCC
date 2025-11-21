"use client"

import { useAuth } from "@/contexts/auth-context"
import { useApiQuery, useApiMutation } from "@/hooks/use-api"

/**
 * Example component demonstrating API integration
 *
 * This shows:
 * 1. How to access the token
 * 2. How to make GET requests with useApiQuery
 * 3. How to make POST requests with useApiMutation
 * 4. Loading and error states
 */

// Define your types
interface User {
  id: number
  name: string
  email: string
}

interface CreateUserData {
  name: string
  email: string
}

export function ExampleUsage() {
  const { token, isLoading: authLoading, error: authError } = useAuth()

  // Example GET request
  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = useApiQuery<User[]>("/api/users", ["users"])

  // Example POST request
  const createUser = useApiMutation<User, CreateUserData>(
    "/api/users",
    "POST",
    {
      onSuccess: (data) => {
        console.log("User created:", data)
      },
      onError: (error) => {
        console.error("Failed to create user:", error)
      },
      // Invalidate users query to refetch the list
      invalidateQueries: [["users"]],
    }
  )

  // Auth loading state
  if (authLoading) {
    return <div>Loading authentication...</div>
  }

  // Auth error state
  if (authError) {
    return <div>Auth error: {authError.message}</div>
  }

  // Show token (for debugging only - remove in production!)
  console.log("Current token:", token)

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Example API Usage</h1>

      {/* Display users */}
      <div className="mb-6">
        <h2 className="mb-2 text-xl font-semibold">Users List</h2>
        {usersLoading && <div>Loading users...</div>}
        {usersError && <div>Error: {usersError.message}</div>}
        {users && (
          <ul className="space-y-2">
            {users.map((user) => (
              <li key={user.id} className="rounded border p-2">
                {user.name} - {user.email}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create user button */}
      <div>
        <h2 className="mb-2 text-xl font-semibold">Create User</h2>
        <button
          onClick={() =>
            createUser.mutate({
              name: "John Doe",
              email: "john@example.com",
            })
          }
          disabled={createUser.isPending}
          className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
        >
          {createUser.isPending ? "Creating..." : "Create User"}
        </button>
        {createUser.isError && (
          <div className="mt-2 text-red-500">
            Error: {createUser.error.message}
          </div>
        )}
        {createUser.isSuccess && (
          <div className="mt-2 text-green-500">User created successfully!</div>
        )}
      </div>
    </div>
  )
}
