import { getClientCache, setClientCache } from "@/lib/cache/client-cache"

// A simple fetcher function for SWR
export const fetcher = async (url: string, api_key: string) => {
  // Check client-side cache first (include api_key in cache key to prevent data leaking between users)
  const cacheKey = `${api_key}:${url}`
  const cached = getClientCache(cacheKey)
  if (cached) return cached

  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${api_key}`
    }
  })

  // If the status code is not in the range 200-299,
  // we still try to parse and throw it.
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.") as Error & { info?: unknown; status?: number }
    // Attach extra info to the error object.
    const info = await res.json()
    error.info = info
    error.status = res.status
    throw error
  }

  const data = await res.json()

  // Store in client-side cache (30 seconds TTL)
  setClientCache(cacheKey, data, 30_000)

  return data
}

/**
 * Base fetch wrapper with auth
 */
export async function fetchWithAuth<T>(url: string, apiKey: string, options?: RequestInit): Promise<T> {
    // Only cache GET requests
    const isGet = !options?.method || options.method === "GET"
    const cacheKey = `${apiKey}:${url}`
    if (isGet) {
        const cached = getClientCache<T>(cacheKey)
        if (cached) return cached
    }

    const res = await fetch(url, {
        ...options,
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            ...options?.headers,
        }
    })

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Unknown error" }))
        throw new Error(errorData.message || errorData.error || `HTTP ${res.status}`)
    }

    const data = await res.json() as T

    // Cache GET responses
    if (isGet) {
        setClientCache(cacheKey, data, 30_000)
    }

    return data
}