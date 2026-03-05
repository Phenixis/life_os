import { NextResponse } from "next/server"

/**
 * Create a JSON response with Cache-Control headers for GET API responses.
 * Uses stale-while-revalidate to allow serving cached data while fetching fresh data.
 */
export function cachedJsonResponse<T>(data: T, maxAge: number = 5, staleWhileRevalidate: number = 30): NextResponse {
    return NextResponse.json(data, {
        headers: {
            "Cache-Control": `private, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
        },
    })
}
