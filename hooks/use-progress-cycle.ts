"use client"

import { useFilteredData } from "./use-filtered-data"
import type { HabitFrequency } from "@/lib/types/habit"
import { useState } from "react"

interface UseProgressCycleParams {
    defaultFrequency?: HabitFrequency
    date?: Date
    skipFetch?: boolean
}

export function useProgressCycle(params: UseProgressCycleParams = {}) {
    const { defaultFrequency = "daily", date = new Date(), skipFetch = false } = params
    
    const [frequency, setFrequency] = useState<HabitFrequency>(defaultFrequency)

    const { data, isLoading, isError } = useFilteredData({
        endpoint: '/api/habits/progress',
        params: {
            frequency,
            date: date.toISOString(),
        },
        skipFetch,
    })

    return {
        data,
        isLoading,
        isError,
        frequency,
        setFrequency,
        progressData: data, // Keep backward compatibility
    }
}

