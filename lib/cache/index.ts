// Server-side Redis cache
export { getRedis, isRedisAvailable } from "./redis"
export * as serverCache from "./server-cache"
export { cacheThrough, cacheThroughOne, invalidate, invalidateMany } from "./cache-through"

// Client-side cache
export {
    getClientCache,
    setClientCache,
    invalidateClientCache,
    invalidateClientCacheByPrefix,
    clearClientCache,
} from "./client-cache"
