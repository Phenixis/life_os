import { verifyRequest } from "@/lib/auth/api"
import * as HabitEntryQueries from "@/lib/db/queries/habit/entry"
import * as HabitQueries from "@/lib/db/queries/habit/habit"
import { NextRequest, NextResponse } from "next/server"

// Get the stats for a specific habit
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ "habit-id": string }> }
) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const parameters = await params
        const habitId = parseInt(parameters["habit-id"])
        if (isNaN(habitId)) {
            return NextResponse.json(
                { error: "Invalid habit ID" },
                { status: 400 }
            )
        }

        // Verify habit ownership
        const habit = await HabitQueries.getHabitById(habitId)
        if (!habit || habit.user_id !== userId) {
            return NextResponse.json(
                { error: "Habit not found or unauthorized" },
                { status: 404 }
            )
        }

        const stats = await HabitEntryQueries.getHabitStats(userId, habitId)

        return NextResponse.json({ stats })
    } catch (error) {
        console.error('Error fetching habit stats:', error)
        return NextResponse.json(
            { error: "Failed to fetch habit stats" },
            { status: 500 }
        )
    }
}