import { NextResponse, NextRequest } from "next/server"
import * as HabitQueries from "@/lib/db/queries/habit/habit"
import * as HabitEntryQueries from "@/lib/db/queries/habit/entry"
import { verifyRequest } from "@/lib/auth/api"

// Get a specific entry 
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ "habit-id": string; "entry-id": string }> }
) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const parameters = await params
        const habitId = parseInt(parameters["habit-id"])
        const entryId = parseInt(parameters["entry-id"])

        if (isNaN(habitId) || isNaN(entryId)) {
            return NextResponse.json(
                { error: "Invalid habit ID or entry ID" },
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

        const entry = await HabitEntryQueries.getHabitEntryById(userId, entryId)

        if (!entry) {
            return NextResponse.json(
                { error: "Entry not found" },
                { status: 404 }
            )
        }

        // Verify entry belongs to the specified habit
        if (entry.habit_id !== habitId) {
            return NextResponse.json(
                { error: "Entry does not belong to this habit" },
                { status: 400 }
            )
        }

        return NextResponse.json({ entry })
    } catch (error) {
        console.error('Error fetching habit entry:', error)
        return NextResponse.json(
            { error: "Failed to fetch habit entry" },
            { status: 500 }
        )
    }
}

// Update a specific entry
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ "habit-id": string; "entry-id": string }> }
) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const parameters = await params
        const habitId = parseInt(parameters["habit-id"])
        const entryId = parseInt(parameters["entry-id"])

        if (isNaN(habitId) || isNaN(entryId)) {
            return NextResponse.json(
                { error: "Invalid habit ID or entry ID" },
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

        // Verify entry exists and belongs to the habit
        const existingEntry = await HabitEntryQueries.getHabitEntryById(userId, entryId)
        if (!existingEntry || existingEntry.habit_id !== habitId) {
            return NextResponse.json(
                { error: "Entry not found or does not belong to this habit" },
                { status: 404 }
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

        const updatedEntryId = await HabitEntryQueries.updateHabitEntry(
            userId,
            entryId,
            count,
            notes
        )

        if (!updatedEntryId) {
            return NextResponse.json(
                { error: "Failed to update entry" },
                { status: 404 }
            )
        }

        const updatedEntry = await HabitEntryQueries.getHabitEntryById(userId, updatedEntryId)

        return NextResponse.json({ entry: updatedEntry })
    } catch (error) {
        console.error('Error updating habit entry:', error)
        return NextResponse.json(
            { error: "Failed to update habit entry" },
            { status: 500 }
        )
    }
}

// Delete a specific entry
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ "habit-id": string; "entry-id": string }> }
) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const parameters = await params
        const habitId = parseInt(parameters["habit-id"])
        const entryId = parseInt(parameters["entry-id"])

        if (isNaN(habitId) || isNaN(entryId)) {
            return NextResponse.json(
                { error: "Invalid habit ID or entry ID" },
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

        // Verify entry exists and belongs to the habit
        const existingEntry = await HabitEntryQueries.getHabitEntryById(userId, entryId)
        if (!existingEntry || existingEntry.habit_id !== habitId) {
            return NextResponse.json(
                { error: "Entry not found or does not belong to this habit" },
                { status: 404 }
            )
        }

        const deletedEntryId = await HabitEntryQueries.deleteHabitEntry(userId, entryId)

        if (!deletedEntryId) {
            return NextResponse.json(
                { error: "Failed to delete entry" },
                { status: 404 }
            )
        }

        return NextResponse.json({
            message: "Entry deleted successfully",
            entryId: deletedEntryId
        })
    } catch (error) {
        console.error('Error deleting habit entry:', error)
        return NextResponse.json(
            { error: "Failed to delete habit entry" },
            { status: 500 }
        )
    }
}