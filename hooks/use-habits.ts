"use client"

import { useFilteredData } from "./use-filtered-data"
import type { Habit } from "@/lib/db/schema"

// Type for the API response structure
interface HabitsApiResponse {
    habits: Habit.Habit.Select[]
}

interface UseHabitsParams {
    frequency?: string
    activeOnly?: boolean
    skipFetch?: boolean
}

export function useHabits(params: UseHabitsParams = {}) {
    const { frequency, activeOnly = true, skipFetch = false } = params

    const { data, isLoading, isError } = useFilteredData<HabitsApiResponse>({
        endpoint: '/api/habits',
        params: {
            frequency,
            activeOnly,
        },
        skipFetch,
    })

    return {
        data: data?.habits as Habit.Habit.Select[] || [],
        isLoading,
        isError,
        habits: data?.habits as Habit.Habit.Select[] || [], // Keep backward compatibility
    }
}