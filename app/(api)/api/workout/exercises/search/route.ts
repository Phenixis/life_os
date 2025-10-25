import { NextResponse, NextRequest } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import * as ExerciceQueries from "@/lib/db/queries/workout/exercice"

// Search exercises by name
export async function GET(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q') || ''
        const limit = parseInt(searchParams.get('limit') || '10')

        // Get all user exercises
        const allExercises = await ExerciceQueries.GetByUserId(userId, false, 100)

        // Filter by query (case-insensitive)
        const filteredExercises = query
            ? allExercises.filter(ex =>
                ex.name.toLowerCase().includes(query.toLowerCase())
            ).slice(0, limit)
            : allExercises.slice(0, limit)

        // Return unique exercise names
        const uniqueNames = Array.from(
            new Set(filteredExercises.map(ex => ex.name))
        ).map(name => ({ name }))

        return NextResponse.json({ exercises: uniqueNames })
    } catch (error) {
        console.error('Error searching exercises:', error)
        return NextResponse.json(
            { error: "Failed to search exercises" },
            { status: 500 }
        )
    }
}
