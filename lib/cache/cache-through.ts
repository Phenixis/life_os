import * as serverCache from "./server-cache"

const DEFAULT_TTL = 3600 // 1 hour

/**
 * Cache-through pattern for database queries.
 *
 * Flow:
 *   1. Receive a list of IDs matching the search
 *   2. Retrieve data stored in Redis for those IDs
 *   3. Retrieve data NOT stored in Redis from the database
 *   4. Update Redis with newly fetched data
 *   5. Return combined results in original ID order
 *
 * Records for IDs not found in cache or DB are omitted from the result.
 *
 * @param tableName  - The table/entity name used as cache key prefix
 * @param ids        - The list of IDs matching the search criteria
 * @param fetchByIds - Function to fetch full records from DB for a subset of IDs
 * @param getId      - Function to extract the ID from a record
 * @param ttl        - Cache TTL in seconds (default: 1 hour)
 */
export async function cacheThrough<T, ID extends string | number = string | number>(
    tableName: string,
    ids: ID[],
    fetchByIds: (missingIds: ID[]) => Promise<T[]>,
    getId: (record: T) => ID,
    ttl: number = DEFAULT_TTL
): Promise<T[]> {
    if (ids.length === 0) return []

    // Step 1: Retrieve data stored in Redis
    const { cached, missingIds } = await serverCache.getMany<T>(tableName, ids)

    // Step 2: Retrieve data NOT stored in Redis from DB
    let freshRecords: T[] = []
    if (missingIds.length > 0) {
        freshRecords = await fetchByIds(missingIds as ID[])

        // Step 3: Update Redis with newly fetched data
        if (freshRecords.length > 0) {
            await serverCache.setMany(
                tableName,
                freshRecords.map((record) => ({
                    id: getId(record),
                    data: record,
                })),
                ttl
            )
        }
    }

    // Build a map of fresh records by ID for quick lookup
    const freshMap = new Map<string | number, T>()
    for (const record of freshRecords) {
        freshMap.set(getId(record), record)
    }

    // Combine and return results in original ID order
    const results: T[] = []
    for (const id of ids) {
        const fromCache = cached.get(id)
        if (fromCache) {
            results.push(fromCache)
            continue
        }
        const fromDb = freshMap.get(id)
        if (fromDb) {
            results.push(fromDb)
        }
    }

    return results
}

/**
 * Cache-through pattern for single record retrieval.
 *
 * @param tableName - The table/entity name used as cache key prefix
 * @param id        - The record ID
 * @param fetchById - Function to fetch the full record from DB
 * @param ttl       - Cache TTL in seconds (default: 1 hour)
 */
export async function cacheThroughOne<T>(
    tableName: string,
    id: string | number,
    fetchById: () => Promise<T | null>,
    ttl: number = DEFAULT_TTL
): Promise<T | null> {
    // Try cache first
    const cached = await serverCache.get<T>(tableName, id)
    if (cached) return cached

    // Fetch from DB
    const result = await fetchById()
    if (result) {
        await serverCache.set(tableName, id, result, ttl)
    }

    return result
}

/**
 * Invalidate cache for a single record after a write operation.
 */
export async function invalidate(tableName: string, id: string | number): Promise<void> {
    await serverCache.del(tableName, id)
}

/**
 * Invalidate cache for multiple records after a write operation.
 */
export async function invalidateMany(tableName: string, ids: (string | number)[]): Promise<void> {
    await serverCache.delMany(tableName, ids)
}
