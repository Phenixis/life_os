import { NextResponse, NextRequest } from "next/server"
import * as HabitQueries from "@/lib/db/queries/habit/habit"
import { verifyRequest } from "@/lib/auth/api"
import type { HabitColor, HabitFrequency } from "@/lib/types/habit"

// Get a specific habit
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

        const habit = await HabitQueries.getHabitById(habitId)
        
        if (!habit) {
            return NextResponse.json(
                { error: "Habit not found" },
                { status: 404 }
            )
        }

        // Verify ownership
        if (habit.user_id !== userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            )
        }

        return NextResponse.json({ habit })
    } catch (error) {
        console.error('Error fetching habit:', error)
        return NextResponse.json(
            { error: "Failed to fetch habit" },
            { status: 500 }
        )
    }
}

// Update a specific habit
export async function PUT(
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

        const body = await request.json()
        const { title, description, color, icon, frequency, targetCount, isActive } = body

        // Validate data types if provided
        if (title !== undefined && typeof title !== 'string') {
            return NextResponse.json(
                { error: "Title must be a string" },
                { status: 400 }
            )
        }

        if (description !== undefined && typeof description !== 'string') {
            return NextResponse.json(
                { error: "Description must be a string" },
                { status: 400 }
            )
        }

        if (color !== undefined && typeof color !== 'string') {
            return NextResponse.json(
                { error: "Color must be a string" },
                { status: 400 }
            )
        }

        if (icon !== undefined && typeof icon !== 'string') {
            return NextResponse.json(
                { error: "Icon must be a string" },
                { status: 400 }
            )
        }

        if (frequency !== undefined && typeof frequency !== 'string') {
            return NextResponse.json(
                { error: "Frequency must be a string" },
                { status: 400 }
            )
        }

        if (targetCount !== undefined && (typeof targetCount !== 'number' || targetCount <= 0)) {
            return NextResponse.json(
                { error: "Target count must be a positive number" },
                { status: 400 }
            )
        }

        if (isActive !== undefined && typeof isActive !== 'boolean') {
            return NextResponse.json(
                { error: "isActive must be a boolean" },
                { status: 400 }
            )
        }

        const updatedHabitId = await HabitQueries.updateHabit(
            userId,
            habitId,
            title,
            description,
            color as HabitColor,
            icon,
            frequency as HabitFrequency,
            targetCount,
            isActive
        )

        if (!updatedHabitId) {
            return NextResponse.json(
                { error: "Habit not found or unauthorized" },
                { status: 404 }
            )
        }

        const updatedHabit = await HabitQueries.getHabitById(updatedHabitId)

        return NextResponse.json({ habit: updatedHabit })
    } catch (error) {
        console.error('Error updating habit:', error)
        return NextResponse.json(
            { error: "Failed to update habit" },
            { status: 500 }
        )
    }
}

// Delete a specific habit
export async function DELETE(
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

        const deletedHabitId = await HabitQueries.deleteHabit(userId, habitId)

        if (!deletedHabitId) {
            return NextResponse.json(
                { error: "Habit not found or unauthorized" },
                { status: 404 }
            )
        }

        return NextResponse.json({ 
            message: "Habit deleted successfully",
            habitId: deletedHabitId 
        })
    } catch (error) {
        console.error('Error deleting habit:', error)
        return NextResponse.json(
            { error: "Failed to delete habit" },
            { status: 500 }
        )
    }
}