"use client"

import useSWR, { mutate } from "swr"
import { useUser } from "@/hooks/use-user"
import { fetcher } from "@/lib/fetcher"
import type { PastWorkout } from "@/lib/db/queries/workout/past-workout"
import type { SavedWorkout } from "@/lib/db/queries/workout/saved-workout"
import type { 
    CreateWorkoutRequest, 
    UpdateWorkoutRequest,
    CreateSavedWorkoutRequest,
    UpdateSavedWorkoutRequest 
} from "@/lib/types/workout"

interface WorkoutsApiResponse {
    workouts: PastWorkout[]
}

interface SavedWorkoutsApiResponse {
    savedWorkouts: SavedWorkout[]
}

// Hook to fetch past workouts
export function useWorkouts(limit?: number) {
    const { user } = useUser()
    
    const url = limit ? `/api/workout?limit=${limit}` : '/api/workout'
    
    const { data, error, isLoading } = useSWR(
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
    const { user } = useUser()
    
    const { data, error, isLoading } = useSWR(
        user ? '/api/workout/saved' : null,
        (url) => fetcher(url, user!.api_key)
    )

    return {
        savedWorkouts: data?.savedWorkouts as SavedWorkout[] || [],
        isLoading,
        error
    }
}

// Hook for workout actions
export function useWorkoutActions() {
    const { user } = useUser()

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
