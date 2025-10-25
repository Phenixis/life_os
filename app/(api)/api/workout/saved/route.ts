import { NextResponse, NextRequest } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import * as SavedWorkoutQueries from "@/lib/db/queries/workout/saved-workout"
import * as ExerciceQueries from "@/lib/db/queries/workout/exercice"
import * as SetQueries from "@/lib/db/queries/workout/set"
import * as lib from "@/lib/db/queries/lib"
import type { CreateSavedWorkoutRequest, UpdateSavedWorkoutRequest } from "@/lib/types/workout"

// List all saved workout templates
export async function GET(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const savedWorkouts = await SavedWorkoutQueries.getSavedWorkouts(userId)

        return NextResponse.json({ savedWorkouts })
    } catch (error) {
        console.error('Error fetching saved workouts:', error)
        return NextResponse.json(
            { error: "Failed to fetch saved workouts" },
            { status: 500 }
        )
    }
}

// Create a new saved workout template
export async function POST(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const body: CreateSavedWorkoutRequest = await request.json()
        const { name, exercises } = body

        // Validate required fields
        if (!name || !exercises || !Array.isArray(exercises)) {
            return NextResponse.json(
                { error: "Missing required fields: name, exercises" },
                { status: 400 }
            )
        }

        // Create saved workout
        const savedWorkout = await SavedWorkoutQueries.Create(userId, name)

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

            // Create sets and link them to saved workout
            for (const set of exercise.sets) {
                const setRecord = await SetQueries.Create({
                    weight: set.weight,
                    nb_reps: set.nb_rep,
                    exercice_id: exerciceRecord.id,
                    user_id: userId,
                })

                // Link set to saved workout
                await lib.db
                    .insert(lib.Schema.Workout.Set_SavedWorkout.table)
                    .values({
                        set_id: setRecord.id,
                        saved_workout_id: savedWorkout.id,
                    })
            }
        }

        const createdSavedWorkout = await SavedWorkoutQueries.GetById(userId, savedWorkout.id)

        return NextResponse.json({ savedWorkout: createdSavedWorkout }, { status: 201 })
    } catch (error) {
        console.error('Error creating saved workout:', error)
        return NextResponse.json(
            { error: "Failed to create saved workout" },
            { status: 500 }
        )
    }
}

// Update a saved workout template
export async function PUT(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const body: UpdateSavedWorkoutRequest = await request.json()
        const { saved_workout_id, name, exercises } = body

        if (!saved_workout_id) {
            return NextResponse.json(
                { error: "saved_workout_id is required" },
                { status: 400 }
            )
        }

        // Verify saved workout belongs to user
        const existingSavedWorkout = await SavedWorkoutQueries.GetById(userId, saved_workout_id)
        if (!existingSavedWorkout) {
            return NextResponse.json(
                { error: "Saved workout not found" },
                { status: 404 }
            )
        }

        // Update name if provided
        if (name) {
            await SavedWorkoutQueries.Update(saved_workout_id, { name })
        }

        // Update exercises if provided
        if (exercises && Array.isArray(exercises)) {
            // Get existing set-to-saved-workout links
            const existingLinks = await lib.db
                .select()
                .from(lib.Schema.Workout.Set_SavedWorkout.table)
                .where(lib.and(
                    lib.eq(lib.Schema.Workout.Set_SavedWorkout.table.saved_workout_id, saved_workout_id),
                    lib.isNull(lib.Schema.Workout.Set_SavedWorkout.table.deleted_at)
                ))

            // Soft delete existing links and sets
            for (const link of existingLinks) {
                await lib.db
                    .update(lib.Schema.Workout.Set_SavedWorkout.table)
                    .set({ deleted_at: new Date() })
                    .where(lib.eq(lib.Schema.Workout.Set_SavedWorkout.table.id, link.id))
                
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

                // Create sets and link them to saved workout
                for (const set of exercise.sets) {
                    const setRecord = await SetQueries.Create({
                        weight: set.weight,
                        nb_reps: set.nb_rep,
                        exercice_id: exerciceRecord.id,
                        user_id: userId,
                    })

                    // Link set to saved workout
                    await lib.db
                        .insert(lib.Schema.Workout.Set_SavedWorkout.table)
                        .values({
                            set_id: setRecord.id,
                            saved_workout_id: saved_workout_id,
                        })
                }
            }
        }

        const updatedSavedWorkout = await SavedWorkoutQueries.GetById(userId, saved_workout_id)

        return NextResponse.json({ savedWorkout: updatedSavedWorkout })
    } catch (error) {
        console.error('Error updating saved workout:', error)
        return NextResponse.json(
            { error: "Failed to update saved workout" },
            { status: 500 }
        )
    }
}

// Delete a saved workout template
export async function DELETE(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const { searchParams } = new URL(request.url)
        const savedWorkoutId = searchParams.get('id')

        if (!savedWorkoutId) {
            return NextResponse.json(
                { error: "Saved workout ID is required" },
                { status: 400 }
            )
        }

        const savedWorkoutIdNum = parseInt(savedWorkoutId)

        // Verify saved workout belongs to user
        const existingSavedWorkout = await SavedWorkoutQueries.GetById(userId, savedWorkoutIdNum)
        if (!existingSavedWorkout) {
            return NextResponse.json(
                { error: "Saved workout not found" },
                { status: 404 }
            )
        }

        await SavedWorkoutQueries.Delete(savedWorkoutIdNum)

        return NextResponse.json({ message: "Saved workout deleted successfully" })
    } catch (error) {
        console.error('Error deleting saved workout:', error)
        return NextResponse.json(
            { error: "Failed to delete saved workout" },
            { status: 500 }
        )
    }
}
