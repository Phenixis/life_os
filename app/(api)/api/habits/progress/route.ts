import { verifyRequest } from "@/lib/auth/api"
import * as HabitEntryQueries from "@/lib/db/queries/habit/entry"
import { HABIT_FREQUENCIES, HabitFrequency } from "@/lib/types/habit"
import { NextRequest, NextResponse } from "next/server"

// Get the progress of a cycle
// Params: { "frequency": "daily" | "weekly" | "monthly" | "quarterly" | "yearly", "date"?: string }
export async function GET(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const { searchParams } = new URL(request.url)
        const frequency = searchParams.get('frequency')
        const dateParam = searchParams.get('date')

        if (!frequency) {
            return NextResponse.json(
                { error: "Missing frequency parameter" },
                { status: 400 }
            )
        }

        // Validate frequency
        if (!Object.values(HABIT_FREQUENCIES).includes(frequency as HabitFrequency)) {
            return NextResponse.json(
                { error: "Invalid frequency parameter" },
                { status: 400 }
            )
        }

        // Parse and validate date
        const date = new Date(dateParam || new Date().toISOString())
        if (isNaN(date.getTime())) {
            return NextResponse.json(
                { error: "Invalid date format" },
                { status: 400 }
            )
        }

        const progress = await HabitEntryQueries.getCycleProgress(userId, frequency as HabitFrequency, date)

        return NextResponse.json({ progress })
    } catch (error) {
        console.error('Error fetching cycle progress:', error)
        return NextResponse.json(
            { error: "Failed to fetch cycle progress" },
            { status: 500 }
        )
    }
}