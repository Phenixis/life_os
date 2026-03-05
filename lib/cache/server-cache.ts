import { getRedis } from "./redis"

const DEFAULT_TTL = 3600 // 1 hour in seconds

/**
 * Build a cache key in the format `{table_name}_{id}`
 */
export function buildKey(tableName: string, id: string | number): string {
    return `${tableName}_${id}`
}

/**
 * Get a single cached value by table name and ID
 */
export async function get<T>(tableName: string, id: string | number): Promise<T | null> {
    const client = getRedis()
    if (!client) return null

    try {
        const data = await client.get(buildKey(tableName, id))
        if (!data) return null
        return JSON.parse(data) as T
    } catch {
        return null
    }
}

/**
 * Set a single value in cache with the key `{table_name}_{id}`
 */
export async function set<T>(tableName: string, id: string | number, data: T, ttl: number = DEFAULT_TTL): Promise<void> {
    const client = getRedis()
    if (!client) return

    try {
        const key = buildKey(tableName, id)
        await client.set(key, JSON.stringify(data), "EX", ttl)
    } catch {
        // Silently fail - cache is not critical
    }
}

/**
 * Delete a single cached value
 */
export async function del(tableName: string, id: string | number): Promise<void> {
    const client = getRedis()
    if (!client) return

    try {
        await client.del(buildKey(tableName, id))
    } catch {
        // Silently fail
    }
}

/**
 * Get multiple cached values by table name and IDs.
 * Returns a map of id -> data for found entries, and an array of missing IDs.
 */
export async function getMany<T>(
    tableName: string,
    ids: (string | number)[]
): Promise<{ cached: Map<string | number, T>; missingIds: (string | number)[] }> {
    const client = getRedis()
    if (!client || ids.length === 0) {
        return { cached: new Map(), missingIds: [...ids] }
    }

    try {
        const keys = ids.map((id) => buildKey(tableName, id))
        const results = await client.mget(...keys)

        const cached = new Map<string | number, T>()
        const missingIds: (string | number)[] = []

        for (let i = 0; i < ids.length; i++) {
            const raw = results[i]
            if (raw) {
                try {
                    cached.set(ids[i], JSON.parse(raw) as T)
                } catch {
                    missingIds.push(ids[i])
                }
            } else {
                missingIds.push(ids[i])
            }
        }

        return { cached, missingIds }
    } catch {
        return { cached: new Map(), missingIds: [...ids] }
    }
}

/**
 * Set multiple values in cache using a pipeline for efficiency
 */
export async function setMany<T>(
    tableName: string,
    entries: { id: string | number; data: T }[],
    ttl: number = DEFAULT_TTL
): Promise<void> {
    const client = getRedis()
    if (!client || entries.length === 0) return

    try {
        const pipeline = client.pipeline()
        for (const entry of entries) {
            const key = buildKey(tableName, entry.id)
            pipeline.set(key, JSON.stringify(entry.data), "EX", ttl)
        }
        await pipeline.exec()
    } catch {
        // Silently fail
    }
}

/**
 * Delete multiple cached values
 */
export async function delMany(tableName: string, ids: (string | number)[]): Promise<void> {
    const client = getRedis()
    if (!client || ids.length === 0) return

    try {
        const keys = ids.map((id) => buildKey(tableName, id))
        await client.del(...keys)
    } catch {
        // Silently fail
    }
}
