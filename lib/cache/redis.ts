import Redis from "ioredis"

let redis: Redis | null = null

function getRedisUrl(): string | undefined {
    return process.env.REDIS_URL
}

export function getRedis(): Redis | null {
    if (redis) return redis

    const url = getRedisUrl()
    if (!url) return null

    try {
        redis = new Redis(url, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                if (times > 3) return null
                return Math.min(times * 200, 2000)
            },
            lazyConnect: true,
            enableOfflineQueue: false,
        })

        redis.on("error", (err) => {
            console.error("[Redis] Connection error:", err.message)
            // Reset connection on persistent errors to allow reconnection
            redis = null
        })

        return redis
    } catch {
        console.error("[Redis] Failed to create client")
        return null
    }
}

export async function isRedisAvailable(): Promise<boolean> {
    const client = getRedis()
    if (!client) return false

    try {
        await client.ping()
        return true
    } catch {
        return false
    }
}
