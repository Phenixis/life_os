"use client"

import useSWR, {mutate} from "swr"
import {useUser} from "@/hooks/use-user"
import {fetcher} from "@/lib/fetcher"
import type {PastWorkout} from "@/lib/db/queries/workout/past-workout"
import type {SavedWorkout} from "@/lib/db/queries/workout/saved-workout"
import type {PersonalRecord} from "@/lib/db/queries/workout/personal-records"
import type {
    CreateSavedWorkoutRequest,
    CreateWorkoutRequest,
    UpdateSavedWorkoutRequest,
    UpdateWorkoutRequest,
    WorkoutProgression
} from "@/lib/types/workout"
import {analyzeWorkoutProgression} from "@/lib/utils/workout-progression"

// Hook to fetch past workouts
export function useWorkouts(limit: number = 10, offset: number = 0) {
    const {user} = useUser()

    const url = `/api/workout?limit=${limit}&offset=${offset}`

    const {data, error, isLoading} = useSWR(
        user ? url : null,
        (url) => fetcher(url, user!.api_key)
    )

    return {
        workouts: data?.workouts as PastWorkout[] || [],
        isLoading,
        error
    }
}

// Hook to fetch saved workout templates
export function useSavedWorkouts() {
    const {user} = useUser()

    const {data, error, isLoading} = useSWR(
        user ? '/api/workout/saved' : null,
        (url) => fetcher(url, user!.api_key)
    )

    return {
        savedWorkouts: data?.savedWorkouts as SavedWorkout[] || [],
        isLoading,
        error
    }
}

// Hook to fetch personal records
export function usePersonalRecords() {
    const {user} = useUser()

    const {data, error, isLoading} = useSWR(
        user ? '/api/workout/personal-records' : null,
        (url) => fetcher(url, user!.api_key)
    )

    return {
        personalRecords: data?.personalRecords as PersonalRecord[] || [],
        isLoading,
        error
    }
}

// Hook for workout actions
export function useWorkoutActions() {
    const {user} = useUser()

    const createWorkout = async (workoutData: CreateWorkoutRequest) => {
        if (!user) throw new Error('User not authenticated')

        const response = await fetch('/api/workout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.api_key}`
            },
            body: JSON.stringify(workoutData)
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to create workout')
        }

        // Invalidate workout cache
        mutate((key) => typeof key === 'string' && key.startsWith('/api/workout'))

        return response.json()
    }

    const updateWorkout = async (workoutData: UpdateWorkoutRequest) => {
        if (!user) throw new Error('User not authenticated')

        const response = await fetch('/api/workout', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.api_key}`
            },
            body: JSON.stringify(workoutData)
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to update workout')
        }

        // Invalidate workout cache
        mutate((key) => typeof key === 'string' && key.startsWith('/api/workout'))

        return response.json()
    }

    const deleteWorkout = async (workoutId: number) => {
        if (!user) throw new Error('User not authenticated')

        const response = await fetch(`/api/workout?id=${workoutId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${user.api_key}`
            }
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to delete workout')
        }

        // Invalidate workout cache
        mutate((key) => typeof key === 'string' && key.startsWith('/api/workout'))

        return response.json()
    }

    const createSavedWorkout = async (savedWorkoutData: CreateSavedWorkoutRequest) => {
        if (!user) throw new Error('User not authenticated')

        const response = await fetch('/api/workout/saved', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.api_key}`
            },
            body: JSON.stringify(savedWorkoutData)
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to create saved workout')
        }

        // Invalidate saved workout cache
        mutate((key) => typeof key === 'string' && key.startsWith('/api/workout/saved'))

        return response.json()
    }

    const updateSavedWorkout = async (savedWorkoutData: UpdateSavedWorkoutRequest) => {
        if (!user) throw new Error('User not authenticated')

        const response = await fetch('/api/workout/saved', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.api_key}`
            },
            body: JSON.stringify(savedWorkoutData)
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to update saved workout')
        }

        // Invalidate saved workout cache
        mutate((key) => typeof key === 'string' && key.startsWith('/api/workout/saved'))

        return response.json()
    }

    const deleteSavedWorkout = async (savedWorkoutId: number) => {
        if (!user) throw new Error('User not authenticated')

        const response = await fetch(`/api/workout/saved?id=${savedWorkoutId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${user.api_key}`
            }
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to delete saved workout')
        }

        // Invalidate saved workout cache
        mutate((key) => typeof key === 'string' && key.startsWith('/api/workout/saved'))

        return response.json()
    }

    return {
        createWorkout,
        updateWorkout,
        deleteWorkout,
        createSavedWorkout,
        updateSavedWorkout,
        deleteSavedWorkout
    }
}

/**
 * Hook to analyze workout progression
 * Compares exercises in a workout against previous workouts
 *
 * @param workoutId - ID of the workout to analyze
 * @returns Progression analysis or null if workout not found
 */
export function useWorkoutProgression(workoutId: number | null): {
    progression: WorkoutProgression | null;
    isLoading: boolean;
    error: unknown;
} {
    const {workouts, isLoading, error} = useWorkouts()

    if (isLoading || !workoutId) {
        return {progression: null, isLoading, error}
    }

    const currentWorkout = workouts.find(w => w.id === workoutId)

    if (!currentWorkout) {
        return {progression: null, isLoading: false, error: null}
    }

    const progression = analyzeWorkoutProgression(currentWorkout, workouts)

    return {
        progression,
        isLoading: false,
        error: null
    }
}

/**
 * Hook to search for exercises by name
 *
 * @param query - Search query for exercise name
 * @param limit - Maximum number of results to return
 * @returns List of matching exercise names
 */
export function useExerciseSearch(query: string, limit: number = 10): {
    exercises: { name: string }[];
    isLoading: boolean;
    error: unknown;
} {
    const {user} = useUser()

    const url = query.trim()
        ? `/api/workout/exercises/search?q=${encodeURIComponent(query)}&limit=${limit}`
        : null

    const {data, error, isLoading} = useSWR(
        user && url ? url : null,
        (url) => fetcher(url, user!.api_key)
    )

    return {
        exercises: data?.exercises || [],
        isLoading,
        error
    }
}
