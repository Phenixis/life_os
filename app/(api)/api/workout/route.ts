import { NextResponse, NextRequest } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import * as WorkoutQueries from "@/lib/db/queries/workout/workout"
import * as PastWorkoutQueries from "@/lib/db/queries/workout/past-workout"
import * as ExerciceQueries from "@/lib/db/queries/workout/exercice"
import * as SetQueries from "@/lib/db/queries/workout/set"
import * as lib from "@/lib/db/queries/lib"
import type { CreateWorkoutRequest, UpdateWorkoutRequest } from "@/lib/types/workout"

// List all workouts
export async function GET(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        // Use getPastWorkouts to get properly formatted workout data with exercises and sets
        const workouts = await PastWorkoutQueries.getPastWorkouts(userId, limit, offset)

        return NextResponse.json({ workouts })
    } catch (error) {
        console.error('Error fetching workouts:', error)
        return NextResponse.json(
            { error: "Failed to fetch workouts" },
            { status: 500 }
        )
    }
}

// Create a new workout
export async function POST(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const body: CreateWorkoutRequest = await request.json()
        const { name, date, difficulty, exercises } = body

        // Validate required fields
        if (!name || !date || !difficulty || !exercises || !Array.isArray(exercises)) {
            return NextResponse.json(
                { error: "Missing required fields: name, date, difficulty, exercises" },
                { status: 400 }
            )
        }

        // Validate difficulty
        if (![1, 2, 3, 4, 5].includes(difficulty)) {
            return NextResponse.json(
                { error: "Difficulty must be between 1 and 5" },
                { status: 400 }
            )
        }

        // Create workout
        const workout = await WorkoutQueries.Create({
            name,
            date: new Date(date),
            difficulty,
            user_id: userId,
        })

        // Create exercises and sets
        for (const exercise of exercises) {
            // Get or create exercise
            let exerciceRecord = await ExerciceQueries.GetByName(userId, exercise.name)
            
            if (!exerciceRecord) {
                exerciceRecord = await ExerciceQueries.Create({
                    name: exercise.name,
                    user_id: userId,
                })
            }

            // Create sets and link them to workout
            for (const set of exercise.sets) {
                const setRecord = await SetQueries.Create({
                    weight: set.weight,
                    nb_reps: set.nb_rep,
                    exercice_id: exerciceRecord.id,
                    user_id: userId,
                })

                // Link set to workout
                await lib.db
                    .insert(lib.Schema.Workout.Set_Workout.table)
                    .values({
                        set_id: setRecord.id,
                        workout_id: workout.id,
                    })
            }
        }

        const createdWorkout = await WorkoutQueries.GetById(userId, workout.id)

        return NextResponse.json({ workout: createdWorkout }, { status: 201 })
    } catch (error) {
        console.error('Error creating workout:', error)
        return NextResponse.json(
            { error: "Failed to create workout" },
            { status: 500 }
        )
    }
}

// Update a workout
export async function PUT(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const body: UpdateWorkoutRequest = await request.json()
        const { workout_id, name, date, difficulty, exercises } = body

        if (!workout_id) {
            return NextResponse.json(
                { error: "workout_id is required" },
                { status: 400 }
            )
        }

        // Verify workout belongs to user
        const existingWorkout = await WorkoutQueries.GetById(userId, workout_id)
        if (!existingWorkout) {
            return NextResponse.json(
                { error: "Workout not found" },
                { status: 404 }
            )
        }

        // Validate difficulty if provided
        if (difficulty && ![1, 2, 3, 4, 5].includes(difficulty)) {
            return NextResponse.json(
                { error: "Difficulty must be between 1 and 5" },
                { status: 400 }
            )
        }

        // Update basic workout info
        const updateData: Record<string, string | number | Date> = {}
        if (name) updateData.name = name
        if (date) updateData.date = new Date(date)
        if (difficulty) updateData.difficulty = difficulty

        if (Object.keys(updateData).length > 0) {
            await WorkoutQueries.Update(workout_id, updateData)
        }

        // Update exercises if provided
        if (exercises && Array.isArray(exercises)) {
            // Get existing set-to-workout links
            const existingLinks = await lib.db
                .select()
                .from(lib.Schema.Workout.Set_Workout.table)
                .where(lib.and(
                    lib.eq(lib.Schema.Workout.Set_Workout.table.workout_id, workout_id),
                    lib.isNull(lib.Schema.Workout.Set_Workout.table.deleted_at)
                ))

            // Soft delete existing links and sets
            for (const link of existingLinks) {
                await lib.db
                    .update(lib.Schema.Workout.Set_Workout.table)
                    .set({ deleted_at: new Date() })
                    .where(lib.eq(lib.Schema.Workout.Set_Workout.table.id, link.id))
                
                await SetQueries.Delete(link.set_id)
            }

            // Create new exercises and sets
            for (const exercise of exercises) {
                // Get or create exercise
                let exerciceRecord = await ExerciceQueries.GetByName(userId, exercise.name)
                
                if (!exerciceRecord) {
                    exerciceRecord = await ExerciceQueries.Create({
                        name: exercise.name,
                        user_id: userId,
                    })
                }

                // Create sets and link them to workout
                for (const set of exercise.sets) {
                    const setRecord = await SetQueries.Create({
                        weight: set.weight,
                        nb_reps: set.nb_rep,
                        exercice_id: exerciceRecord.id,
                        user_id: userId,
                    })

                    // Link set to workout
                    await lib.db
                        .insert(lib.Schema.Workout.Set_Workout.table)
                        .values({
                            set_id: setRecord.id,
                            workout_id: workout_id,
                        })
                }
            }
        }

        const updatedWorkout = await WorkoutQueries.GetById(userId, workout_id)

        return NextResponse.json({ workout: updatedWorkout })
    } catch (error) {
        console.error('Error updating workout:', error)
        return NextResponse.json(
            { error: "Failed to update workout" },
            { status: 500 }
        )
    }
}

// Delete a workout
export async function DELETE(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const { searchParams } = new URL(request.url)
        const workoutId = searchParams.get('id')

        if (!workoutId) {
            return NextResponse.json(
                { error: "Workout ID is required" },
                { status: 400 }
            )
        }

        const workoutIdNum = parseInt(workoutId)

        // Verify workout belongs to user
        const existingWorkout = await WorkoutQueries.GetById(userId, workoutIdNum)
        if (!existingWorkout) {
            return NextResponse.json(
                { error: "Workout not found" },
                { status: 404 }
            )
        }

        await WorkoutQueries.Delete(workoutIdNum)

        return NextResponse.json({ message: "Workout deleted successfully" })
    } catch (error) {
        console.error('Error deleting workout:', error)
        return NextResponse.json(
            { error: "Failed to delete workout" },
            { status: 500 }
        )
    }
}
