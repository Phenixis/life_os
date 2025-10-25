import { verifyRequest } from "@/lib/auth/api";
import * as HabitEntryQueries from "@/lib/db/queries/habit/entry";
import * as HabitQueries from "@/lib/db/queries/habit/habit";
import { NextRequest, NextResponse } from "next/server";

// Get or update habit entry by date
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ "habit-id": string; date: string }> }
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

        // Parse and validate date
        const entryDate = new Date(parameters.date)
        if (isNaN(entryDate.getTime())) {
            return NextResponse.json(
                { error: "Invalid date format" },
                { status: 400 }
            )
        }

        const entry = await HabitEntryQueries.getHabitEntryByDate(userId, habitId, entryDate)

        if (!entry) {
            return NextResponse.json(
                { error: "Entry not found for this date" },
                { status: 404 }
            )
        }

        return NextResponse.json({ entry })
    } catch (error) {
        console.error('Error fetching habit entry by date:', error)
        return NextResponse.json(
            { error: "Failed to fetch habit entry" },
            { status: 500 }
        )
    }
}

// Update habit entry by date
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ "habit-id": string; date: string }> }
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

        // Parse and validate date
        const entryDate = new Date(parameters.date)
        if (isNaN(entryDate.getTime())) {
            return NextResponse.json(
                { error: "Invalid date format" },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { count, notes } = body

        // Validate data types if provided
        if (count !== undefined && (typeof count !== 'number' || count <= 0)) {
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

        const updatedEntryId = await HabitEntryQueries.updateHabitEntryByDate(
            userId,
            habitId,
            entryDate,
            count,
            notes
        )

        if (!updatedEntryId) {
            return NextResponse.json(
                { error: "Entry not found for this date" },
                { status: 404 }
            )
        }

        const updatedEntry = await HabitEntryQueries.getHabitEntryById(userId, updatedEntryId)

        return NextResponse.json({ entry: updatedEntry })
    } catch (error) {
        console.error('Error updating habit entry by date:', error)
        return NextResponse.json(
            { error: "Failed to update habit entry" },
            { status: 500 }
        )
    }
}

// Delete habit entry by date
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ "habit-id": string; date: string }> }
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

        // Parse and validate date
        const entryDate = new Date(parameters.date)
        if (isNaN(entryDate.getTime())) {
            return NextResponse.json(
                { error: "Invalid date format" },
                { status: 400 }
            )
        }

        const deletedEntryId = await HabitEntryQueries.deleteHabitEntryByDate(
            userId,
            habitId,
            entryDate
        )

        if (!deletedEntryId) {
            return NextResponse.json(
                { error: "Entry not found for this date" },
                { status: 404 }
            )
        }

        return NextResponse.json({
            message: "Entry deleted successfully",
            entryId: deletedEntryId
        })
    } catch (error) {
        console.error('Error deleting habit entry by date:', error)
        return NextResponse.json(
            { error: "Failed to delete habit entry" },
            { status: 500 }
        )
    }
}
