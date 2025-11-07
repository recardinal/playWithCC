"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToken } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";

/**
 * Hook for making GET requests with automatic token injection
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useApiQuery('/users', ['users'])
 * ```
 */
export function useApiQuery<T = unknown>(
  endpoint: string,
  queryKey: unknown[],
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
  }
) {
  const token = useToken();

  return useQuery<T>({
    queryKey,
    queryFn: () => api.get<T>(endpoint, token),
    enabled: options?.enabled !== false && !!token, // Only fetch when token is available
    staleTime: options?.staleTime,
    refetchInterval: options?.refetchInterval,
  });
}

/**
 * Hook for making POST/PUT/PATCH/DELETE requests with automatic token injection
 *
 * @example
 * ```tsx
 * const createUser = useApiMutation('/users', 'POST')
 *
 * // In your component
 * <button onClick={() => createUser.mutate({ name: 'John' })}>
 *   Create User
 * </button>
 * ```
 */
export function useApiMutation<TData = unknown, TVariables = unknown>(
  endpoint: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE" = "POST",
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
    invalidateQueries?: unknown[][];
  }
) {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      switch (method) {
        case "POST":
          return api.post<TData>(endpoint, variables, token);
        case "PUT":
          return api.put<TData>(endpoint, variables, token);
        case "PATCH":
          return api.patch<TData>(endpoint, variables, token);
        case "DELETE":
          return api.delete<TData>(endpoint, token);
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data);
      // Invalidate related queries
      options?.invalidateQueries?.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    },
    onError: options?.onError,
  });
}
