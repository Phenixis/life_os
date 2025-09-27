import { NextResponse, NextRequest } from "next/server"
import * as HabitQueries from "@/lib/db/queries/habit/habit"
import { verifyRequest } from "@/lib/auth/api"

// Toggle habit active status
export async function PATCH(
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

        const newActiveStatus = await HabitQueries.toggleHabitActive(habitId)

        if (newActiveStatus === null) {
            return NextResponse.json(
                { error: "Failed to toggle habit status" },
                { status: 500 }
            )
        }

        const updatedHabit = await HabitQueries.getHabitById(habitId)

        return NextResponse.json({ 
            habit: updatedHabit,
            message: `Habit ${newActiveStatus ? 'activated' : 'deactivated'} successfully`
        })
    } catch (error) {
        console.error('Error toggling habit status:', error)
        return NextResponse.json(
            { error: "Failed to toggle habit status" },
            { status: 500 }
        )
    }
}
