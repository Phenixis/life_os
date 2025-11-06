/**
 * Workout Progression Tracking Utilities
 * 
 * This module provides utilities to track exercise progression across workout sessions.
 * Progression is measured by comparing the "best set" of each exercise between workouts.
 * 
 * Key concepts:
 * - Best Set: The set with the highest weight for a given exercise (ties broken by reps)
 * - Progression: The difference between the current workout's best set and the previous workout's best set
 */

import type { 
    WorkoutSet, 
    WorkoutExercise, 
    BestSet, 
    ExerciseProgression,
    WorkoutProgression 
} from "@/lib/types/workout"
import type { PastWorkout } from "@/lib/db/queries/workout/past-workout"

/**
 * Calculate the score for a set (weight × reps)
 */
function calculateSetScore(set: WorkoutSet): number {
    return set.weight * set.nb_rep
}

/**
 * Find the best set for an exercise based on the highest weight
 * 
 * @param exercise - The exercise containing multiple sets
 * @returns The best set with calculated score
 */
export function getBestSet(exercise: WorkoutExercise): BestSet | null {
    if (!exercise.sets || exercise.sets.length === 0) {
        return null
    }

    let bestSet = exercise.sets[0]

    for (let i = 1; i < exercise.sets.length; i++) {
        const currentSet = exercise.sets[i]

        if (
            currentSet.weight > bestSet.weight ||
            (currentSet.weight === bestSet.weight && currentSet.nb_rep > bestSet.nb_rep)
        ) {
            // Prefer the heaviest set, breaking ties with the highest rep count
            bestSet = currentSet
        }
    }

    return {
        weight: bestSet.weight,
        nb_rep: bestSet.nb_rep,
        score: calculateSetScore(bestSet)
    }
}

/**
 * Find the best set for a specific exercise from a previous workout
 * 
 * @param exerciseName - Name of the exercise to find
 * @param previousWorkouts - Array of previous workouts ordered by date (most recent first)
 * @returns The best set from the most recent previous workout containing this exercise, or null
 */
export function findPreviousBestSet(
    exerciseName: string,
    previousWorkouts: PastWorkout[]
): { bestSet: BestSet; workoutDate: Date; workoutId: number } | null {
    // Iterate through previous workouts (already sorted by date, most recent first)
    for (const workout of previousWorkouts) {
        // Find the exercise in this workout
        const exercise = workout.exercices.find(
            ex => ex.name.toLowerCase() === exerciseName.toLowerCase()
        )

        if (exercise) {
            const bestSet = getBestSet(exercise)
            if (bestSet) {
                return {
                    bestSet,
                    workoutDate: workout.date,
                    workoutId: workout.id
                }
            }
        }
    }

    return null
}

/**
 * Compare current best set with previous best set and calculate progression metrics
 * 
 * @param currentBestSet - The best set from the current workout
 * @param previousBestSet - The best set from a previous workout
 * @returns Object containing differences in weight, reps, score, and percentage change
 */
export function compareProgression(
    currentBestSet: BestSet,
    previousBestSet: BestSet
): {
    weightDiff: number;
    repsDiff: number;
    scoreDiff: number;
    percentageChange: number;
} {
    const weightDiff = currentBestSet.weight - previousBestSet.weight
    const repsDiff = currentBestSet.nb_rep - previousBestSet.nb_rep
    const scoreDiff = currentBestSet.score - previousBestSet.score
    
    // Calculate percentage change (avoid division by zero)
    const percentageChange = previousBestSet.score > 0
        ? (scoreDiff / previousBestSet.score) * 100
        : 0

    return {
        weightDiff,
        repsDiff,
        scoreDiff,
        percentageChange
    }
}

/**
 * Analyze progression for a single exercise by comparing it with previous workouts
 * 
 * @param exerciseName - Name of the exercise
 * @param currentExercise - Current exercise data with sets
 * @param previousWorkouts - Array of previous workouts to compare against
 * @returns Exercise progression data including current and previous best sets with comparison
 */
export function analyzeExerciseProgression(
    exerciseName: string,
    currentExercise: WorkoutExercise,
    previousWorkouts: PastWorkout[]
): ExerciseProgression | null {
    const currentBestSet = getBestSet(currentExercise)
    
    if (!currentBestSet) {
        return null
    }

    const previousResult = findPreviousBestSet(exerciseName, previousWorkouts)

    return {
        exerciseName,
        currentBestSet,
        previousBestSet: previousResult?.bestSet || null,
        progression: previousResult 
            ? compareProgression(currentBestSet, previousResult.bestSet)
            : null
    }
}

/**
 * Analyze progression for all exercises in a workout
 * 
 * @param currentWorkout - The current workout to analyze
 * @param allWorkouts - All workouts for the user (sorted by date, most recent first)
 * @returns Workout progression data with exercise-by-exercise analysis
 */
export function analyzeWorkoutProgression(
    currentWorkout: PastWorkout,
    allWorkouts: PastWorkout[]
): WorkoutProgression {
    // Filter out the current workout to get only previous workouts
    const previousWorkouts = allWorkouts.filter(
        w => w.id !== currentWorkout.id && new Date(w.date) < new Date(currentWorkout.date)
    )

    const exerciseProgressions: ExerciseProgression[] = []

    for (const exercise of currentWorkout.exercices) {
        const progression = analyzeExerciseProgression(
            exercise.name,
            exercise,
            previousWorkouts
        )

        if (progression) {
            exerciseProgressions.push(progression)
        }
    }

    return {
        workoutId: currentWorkout.id,
        workoutDate: currentWorkout.date,
        exercises: exerciseProgressions
    }
}

/**
 * Get best sets for all exercises in a workout (useful for display purposes)
 * 
 * @param workout - The workout to analyze
 * @returns Map of exercise name to best set
 */
export function getBestSetsForWorkout(
    workout: PastWorkout
): Map<string, BestSet> {
    const bestSets = new Map<string, BestSet>()

    for (const exercise of workout.exercices) {
        const bestSet = getBestSet(exercise)
        if (bestSet) {
            bestSets.set(exercise.name, bestSet)
        }
    }

    return bestSets
}

/**
 * Format progression for display
 * Helper function to create user-friendly progression text
 */
export function formatProgressionText(progression: ExerciseProgression): string {
    if (!progression.progression) {
        return "First time doing this exercise"
    }

    const { weightDiff, repsDiff, scoreDiff, percentageChange } = progression.progression
    
    if (scoreDiff === 0) {
        return "No change"
    }

    const direction = scoreDiff > 0 ? "↑" : "↓"
    const parts: string[] = []

    if (weightDiff !== 0) {
        parts.push(`${Math.abs(weightDiff)}kg ${weightDiff > 0 ? 'heavier' : 'lighter'}`)
    }

    if (repsDiff !== 0) {
        parts.push(`${Math.abs(repsDiff)} ${repsDiff > 0 ? 'more' : 'fewer'} reps`)
    }

    const changeText = parts.length > 0 ? parts.join(', ') : `${Math.abs(scoreDiff)} total`
    
    return `${direction} ${changeText} (${percentageChange > 0 ? '+' : ''}${percentageChange.toFixed(1)}%)`
}
