import { verifyRequest } from "@/lib/auth/api"
import * as HabitEntryQueries from "@/lib/db/queries/habit/entry"
import * as HabitQueries from "@/lib/db/queries/habit/habit"
import { NextRequest, NextResponse } from "next/server"

// List all entries for a specific habit
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

        const { searchParams } = new URL(request.url)
        const startDateParam = searchParams.get('startDate')
        const endDateParam = searchParams.get('endDate')
        const limitParam = searchParams.get('limit')

        let startDate: Date | undefined
        let endDate: Date | undefined
        let limit: number | undefined

        if (startDateParam) {
            startDate = new Date(startDateParam)
            if (isNaN(startDate.getTime())) {
                return NextResponse.json(
                    { error: "Invalid start date format" },
                    { status: 400 }
                )
            }
        }

        if (endDateParam) {
            endDate = new Date(endDateParam)
            if (isNaN(endDate.getTime())) {
                return NextResponse.json(
                    { error: "Invalid end date format" },
                    { status: 400 }
                )
            }
        }

        if (limitParam) {
            limit = parseInt(limitParam)
            if (isNaN(limit) || limit <= 0) {
                return NextResponse.json(
                    { error: "Limit must be a positive number" },
                    { status: 400 }
                )
            }
        }

        const entries = await HabitEntryQueries.getHabitEntries(
            habitId,
            startDate,
            endDate,
            limit
        )

        return NextResponse.json({ entries })
    } catch (error) {
        console.error('Error fetching habit entries:', error)
        return NextResponse.json(
            { error: "Failed to fetch habit entries" },
            { status: 500 }
        )
    }
}

// Add an entry for a specific habit
export async function POST(
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

        const body = await request.json()
        const { date, count, notes } = body

        // Validate required fields
        if (!date || count === undefined) {
            return NextResponse.json(
                { error: "Missing required fields: date, count" },
                { status: 400 }
            )
        }

        // Validate data types
        if (typeof count !== 'number' || count <= 0) {
            return NextResponse.json(
                { error: "Count must be a positive number" },
                { status: 400 }
            )
        }

        if (notes !== undefined && typeof notes !== 'string') {
            return NextResponse.json(
                { error: "Notes must be a string" },
                { status: 400 }
            )
        }

        // Parse and validate date
        const entryDate = new Date(date)
        if (isNaN(entryDate.getTime())) {
            return NextResponse.json(
                { error: "Invalid date format" },
                { status: 400 }
            )
        }

        const entryId = await HabitEntryQueries.createHabitEntry(
            userId,
            habitId,
            entryDate,
            count,
            notes
        )

        const newEntry = await HabitEntryQueries.getHabitEntryById(userId, entryId)

        return NextResponse.json({ entry: newEntry }, { status: 201 })
    } catch (error) {
        console.error('Error creating habit entry:', error)
        return NextResponse.json(
            { error: "Failed to create habit entry" },
            { status: 500 }
        )
    }
}
