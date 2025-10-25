import { verifyRequest } from "@/lib/auth/api"
import * as HabitEntryQueries from "@/lib/db/queries/habit/entry"
import { NextRequest, NextResponse } from "next/server"

// Get overall user habit statistics
export async function GET(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const stats = await HabitEntryQueries.getUserHabitStats(userId)

        return NextResponse.json({ stats })
    } catch (error) {
        console.error('Error fetching user habit stats:', error)
        return NextResponse.json(
            { error: "Failed to fetch user habit stats" },
            { status: 500 }
        )
    }
}
