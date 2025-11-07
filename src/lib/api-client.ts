/**
 * API Client for making authenticated requests to backend
 * Automatically injects token from auth context
 */

interface FetchOptions extends RequestInit {
  token?: string | null;
}

/**
 * Base API URL - configure this in your .env file
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Create authenticated fetch with automatic token injection
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  // Build full URL
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  // Prepare headers
  const headers = new Headers(fetchOptions.headers);

  // Add token to Authorization header if available
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Add Content-Type if not set and has body
  if (fetchOptions.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Make request
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Handle errors
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `API Error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  // Parse response
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return response.text() as T;
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T = unknown>(endpoint: string, token?: string | null) =>
    apiFetch<T>(endpoint, { method: "GET", token }),

  post: <T = unknown>(
    endpoint: string,
    data?: unknown,
    token?: string | null
  ) =>
    apiFetch<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      token,
    }),

  put: <T = unknown>(endpoint: string, data?: unknown, token?: string | null) =>
    apiFetch<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      token,
    }),

  patch: <T = unknown>(
    endpoint: string,
    data?: unknown,
    token?: string | null
  ) =>
    apiFetch<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
      token,
    }),

  delete: <T = unknown>(endpoint: string, token?: string | null) =>
    apiFetch<T>(endpoint, { method: "DELETE", token }),
};
