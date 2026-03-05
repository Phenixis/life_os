/**
 * Client-side cache layer using in-memory storage with sessionStorage persistence.
 * Works alongside SWR/React Query to reduce redundant API calls.
 */

type CacheEntry<T> = {
    data: T
    timestamp: number
    ttl: number
}

const memoryCache = new Map<string, CacheEntry<unknown>>()

const DEFAULT_CLIENT_TTL = 30_000 // 30 seconds

function isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > entry.ttl
}

/**
 * Get a value from the client cache (memory first, then sessionStorage).
 */
export function getClientCache<T>(key: string): T | null {
    // Check memory cache first
    const memEntry = memoryCache.get(key) as CacheEntry<T> | undefined
    if (memEntry && !isExpired(memEntry)) {
        return memEntry.data
    }

    // Clean up expired memory entry
    if (memEntry) {
        memoryCache.delete(key)
    }

    // Fall back to sessionStorage
    if (typeof window !== "undefined") {
        try {
            const raw = sessionStorage.getItem(`cache:${key}`)
            if (raw) {
                const entry = JSON.parse(raw) as CacheEntry<T>
                if (!isExpired(entry)) {
                    // Restore to memory cache
                    memoryCache.set(key, entry)
                    return entry.data
                }
                // Clean up expired sessionStorage entry
                sessionStorage.removeItem(`cache:${key}`)
            }
        } catch {
            // sessionStorage not available or parse error
        }
    }

    return null
}

/**
 * Set a value in the client cache (both memory and sessionStorage).
 */
export function setClientCache<T>(key: string, data: T, ttl: number = DEFAULT_CLIENT_TTL): void {
    const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
    }

    memoryCache.set(key, entry as CacheEntry<unknown>)

    if (typeof window !== "undefined") {
        try {
            sessionStorage.setItem(`cache:${key}`, JSON.stringify(entry))
        } catch {
            // sessionStorage full or not available
        }
    }
}

/**
 * Invalidate a specific cache entry.
 */
export function invalidateClientCache(key: string): void {
    memoryCache.delete(key)
    if (typeof window !== "undefined") {
        try {
            sessionStorage.removeItem(`cache:${key}`)
        } catch {
            // Ignore
        }
    }
}

/**
 * Invalidate all cache entries matching a prefix.
 */
export function invalidateClientCacheByPrefix(prefix: string): void {
    // Clear matching memory entries
    for (const key of memoryCache.keys()) {
        if (key.startsWith(prefix)) {
            memoryCache.delete(key)
        }
    }

    // Clear matching sessionStorage entries
    if (typeof window !== "undefined") {
        try {
            const keysToRemove: string[] = []
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i)
                if (key && key.startsWith(`cache:${prefix}`)) {
                    keysToRemove.push(key)
                }
            }
            for (const key of keysToRemove) {
                sessionStorage.removeItem(key)
            }
        } catch {
            // Ignore
        }
    }
}

/**
 * Clear all client cache entries.
 */
export function clearClientCache(): void {
    memoryCache.clear()

    if (typeof window !== "undefined") {
        try {
            const keysToRemove: string[] = []
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i)
                if (key && key.startsWith("cache:")) {
                    keysToRemove.push(key)
                }
            }
            for (const key of keysToRemove) {
                sessionStorage.removeItem(key)
            }
        } catch {
            // Ignore
        }
    }
}
