import type { JsBridge } from "@/types/jsbridge"

/**
 * Check if jsbridge is available
 */
export function isJsBridgeAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.proxy !== "undefined"
}

/**
 * Get token from native app via jsbridge
 * Returns a Promise that resolves with the token
 */
export function getTokenFromNative(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isJsBridgeAvailable()) {
      // Development mode: return mock token
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[JsBridge] Not available - using mock token for development"
        )
        resolve(process.env.NEXT_PUBLIC_MOCK_TOKEN || "mock-dev-token")
        return
      }
      reject(new Error("JsBridge is not available"))
      return
    }

    try {
      window.proxy!.getToken((token: string) => {
        if (token) {
          resolve(token)
        } else {
          reject(new Error("Failed to get token from native app"))
        }
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Mock jsbridge for development/testing
 * Call this in development to simulate native app behavior
 */
export function mockJsBridge(mockToken: string = "mock-dev-token") {
  if (typeof window !== "undefined") {
    window.proxy = {
      getToken: (callback) => {
        // Simulate async behavior
        setTimeout(() => {
          callback(mockToken)
        }, 100)
      },
    } as JsBridge
    console.log("[JsBridge] Mock initialized with token:", mockToken)
  }
}
