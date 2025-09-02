import { QueryClient, QueryFunction } from "@tanstack/react-query";

// This flag helps track when app is navigating, to prevent fetch errors
let isNavigating = false;

// Set this to true when navigation starts and false when navigation ends
export function setNavigating(status: boolean) {
  isNavigating = status;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`Making API request: ${method} ${url}`);
  
  try {
    // Don't use signals at all - simpler approach
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      // Use no-cache to ensure we always get fresh data
      cache: 'no-cache'
    });

    console.log(`API response status: ${res.status}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API error: ${res.status}`, errorText);
      throw new Error(`${res.status}: ${errorText || res.statusText}`);
    }
    
    return res;
  } catch (error) {
    // If we're navigating and get any error, just throw a navigation error
    if (isNavigating) {
      throw new Error('Navigation in progress');
    }
    // Otherwise throw the original error
    console.error("API request failed:", error);
    throw error;
  }
}

// Simplest possible implementation of the query function
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => { // Completely remove signal param so it's not even in scope
    try {
      // IMPORTANT: We never use the signal parameter to avoid AbortController issues
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        // No signal parameter - explicitly omitted
        cache: 'no-cache' // Don't cache API responses
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // If we're navigating and get any error, just ignore it
      if (isNavigating) {
        throw new Error('Navigation in progress');
      }
      // Otherwise throw the original error
      throw error;
    }
  };

// Basic query client config
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,  // Changed to true to refresh on tab focus
      staleTime: 30 * 1000,       // 30 seconds stale time instead of Infinity
      retry: 1,                   // Allow one retry for failed requests
      gcTime: 1000 * 60 * 5,      // 5 minutes
      // Important setting to fix abort issues!
      networkMode: 'always',
    },
    mutations: {
      retry: false,
    },
  },
});
