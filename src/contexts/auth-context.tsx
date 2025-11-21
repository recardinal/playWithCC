"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { getTokenFromNative, mockJsBridge } from "@/lib/jsbridge"

interface AuthContextType {
  token: string | null
  isLoading: boolean
  error: Error | null
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadToken = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const newToken = await getTokenFromNative()
      setToken(newToken)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load token"))
      console.error("[Auth] Failed to get token:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Initialize mock jsbridge in development if needed
    if (process.env.NODE_ENV === "development") {
      mockJsBridge()
    }

    loadToken()
  }, [])

  const refreshToken = async () => {
    await loadToken()
  }

  return (
    <AuthContext.Provider value={{ token, isLoading, error, refreshToken }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access authentication token
 * @throws Error if used outside of AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

/**
 * Hook to get the current token
 * Returns null if token is not available yet
 */
export function useToken() {
  const { token } = useAuth()
  return token
}
