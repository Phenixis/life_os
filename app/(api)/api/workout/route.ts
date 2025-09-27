import { type NextRequest, NextResponse } from "next/server"
import { WorkoutQueries } from "@/lib/db/queries"
import { verifyRequest } from "@/lib/auth/api"

export async function GET(request: NextRequest) {
  const verification = await verifyRequest(request)
  if ('error' in verification) return verification.error

  try {
    // This is a placeholder - you'll need to implement a function to get workouts with their seances
    const workouts = await WorkoutQueries.getAllWorkouts(verification.userId)

    return NextResponse.json(workouts)
  } catch (error) {
    console.error("Error fetching workouts:", error)
    return NextResponse.json({ error: "Failed to fetch workouts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const verification = await verifyRequest(request)
  if ('error' in verification) return verification.error

  try {
    const { date, seance_id } = await request.json()

    const workoutId = await WorkoutQueries.createWorkout(verification.userId, new Date(date), seance_id)

    return NextResponse.json({ id: workoutId })
  } catch (error) {
    console.error("Error creating workout:", error)
    return NextResponse.json({ error: "Failed to create workout" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const verification = await verifyRequest(request)
  if ('error' in verification) return verification.error

  try {
    const { id, note, seance_id } = await request.json()

    const workoutId = await WorkoutQueries.updateWorkout(verification.userId, id, note, seance_id)

    return NextResponse.json({ id: workoutId })
  } catch (error) {
    console.error("Error updating workout:", error)
    return NextResponse.json({ error: "Failed to update workout" }, { status: 500 })
  }
}

