import { NextResponse, NextRequest } from "next/server"
import * as HabitQueries from "@/lib/db/queries/habit/habit"
import { verifyRequest } from "@/lib/auth/api"
import type { HabitColor, HabitFrequency } from "@/lib/types/habit"

// List all habits
export async function GET(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const { searchParams } = new URL(request.url)
        const activeOnly = searchParams.get('activeOnly') === 'true'
        const frequency = searchParams.get('frequency') as HabitFrequency | null
        const search = searchParams.get('search')

        let habits

        if (search) {
            habits = await HabitQueries.searchHabits(userId, search)
        } else if (frequency) {
            habits = await HabitQueries.getHabitsByFrequency(userId, frequency, activeOnly)
        } else {
            habits = await HabitQueries.getUserHabits(userId, activeOnly)
        }

        return NextResponse.json({ habits })
    } catch (error) {
        console.error('Error fetching habits:', error)
        return NextResponse.json(
            { error: "Failed to fetch habits" },
            { status: 500 }
        )
    }
}

// Create a new habit
export async function POST(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const body = await request.json()
        const { title, description, color, icon, frequency, targetCount } = body

        // Validate required fields
        if (!title || !color || !icon || !frequency || targetCount === undefined) {
            return NextResponse.json(
                { error: "Missing required fields: title, color, icon, frequency, targetCount" },
                { status: 400 }
            )
        }

        // Validate data types
        if (typeof title !== 'string' || typeof color !== 'string' || 
            typeof icon !== 'string' || typeof frequency !== 'string' || 
            typeof targetCount !== 'number') {
            return NextResponse.json(
                { error: "Invalid data types" },
                { status: 400 }
            )
        }

        // Validate target count is positive
        if (targetCount <= 0) {
            return NextResponse.json(
                { error: "Target count must be positive" },
                { status: 400 }
            )
        }

        const habitId = await HabitQueries.createHabit(
            userId,
            title,
            color as HabitColor,
            icon,
            frequency as HabitFrequency,
            targetCount,
            description
        )

        const newHabit = await HabitQueries.getHabitById(habitId)

        return NextResponse.json({ habit: newHabit }, { status: 201 })
    } catch (error) {
        console.error('Error creating habit:', error)
        return NextResponse.json(
            { error: "Failed to create habit" },
            { status: 500 }
        )
    }
}