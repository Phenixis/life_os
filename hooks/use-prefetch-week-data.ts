"use client"

/**
 * Calendar Week Data Prefetching Hook
 * 
 * This hook implements an intelligent prefetching strategy for the calendar component
 * to improve perceived performance and user experience:
 * 
 * STRATEGY:
 * 1. User selects a date in the calendar
 * 2. The calendar component loads data for that specific date (priority)
 * 3. Once loaded, this hook prefetches data for ALL other days in the same week
 * 4. When user navigates to another day in the week, data is instantly available
 * 
 * BENEFITS:
 * - Near-instant navigation within the same week
 * - Reduces perceived loading time
 * - Leverages React Query and SWR caching mechanisms
 * - Minimal bandwidth overhead (only prefetches 6 additional days)
 * 
 * COVERAGE:
 * - Tasks (completed and uncompleted) via React Query
 * - Task counts via React Query
 * - Workouts via SWR
 * - Notes via SWR
 * - Addiction entries/relapses (loaded on-demand per addiction)
 * 
 * @module use-prefetch-week-data
 */

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useUser } from "@/hooks/use-user"
import { taskKeys } from "@/lib/api/query-keys"
import { tasksApi } from "@/lib/api/tasks.api"
import { fetcher } from "@/lib/fetcher"
import { mutate } from "swr"

/**
 * Get all dates in the same week as the selected date
 * Week starts on Monday
 */
function getWeekDates(selectedDate: Date): Date[] {
    const dates: Date[] = []
    const date = new Date(selectedDate)
    
    // Get Monday of the week (day 0 is Sunday, we want Monday = 1)
    const dayOfWeek = date.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Handle Sunday special case
    
    const monday = new Date(date)
    monday.setDate(date.getDate() + diff)
    monday.setHours(0, 0, 0, 0)
    
    // Generate all 7 days of the week
    for (let i = 0; i < 7; i++) {
        const weekDate = new Date(monday)
        weekDate.setDate(monday.getDate() + i)
        dates.push(weekDate)
    }
    
    return dates
}

/**
 * Hook to prefetch data for all days in the week of the selected date
 * This improves UX by making data instantly available when user navigates between days
 */
export function usePrefetchWeekData(selectedDate: Date | undefined, enabled: boolean = true) {
    const queryClient = useQueryClient()
    const { user } = useUser()
    
    useEffect(() => {
        if (!selectedDate || !enabled || !user?.api_key) {
            return
        }
        
        const weekDates = getWeekDates(selectedDate)
        
        // Skip the currently selected date (it's already being fetched)
        const otherDates = weekDates.filter(date => {
            return date.getTime() !== new Date(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                selectedDate.getDate()
            ).getTime()
        })
        
        // Prefetch with a small delay to prioritize the current date's data
        const timeoutId = setTimeout(() => {
            otherDates.forEach(date => {
                const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
                const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
                
                // Prefetch React Query data (tasks, addiction tracker)
                prefetchReactQueryData(dayStart, dayEnd, user.api_key, queryClient)
                
                // Prefetch SWR data (workouts, notes)
                prefetchSWRData(dayStart, dayEnd, user.api_key)
            })
        }, 500) // Small delay to ensure current date loads first
        
        return () => clearTimeout(timeoutId)
    }, [selectedDate, enabled, user?.api_key, queryClient])
}

/**
 * Prefetch data managed by React Query
 */
async function prefetchReactQueryData(
    dayStart: Date,
    dayEnd: Date,
    apiKey: string,
    queryClient: ReturnType<typeof useQueryClient>
) {
    // Prefetch uncompleted tasks
    queryClient.prefetchQuery({
        queryKey: taskKeys.list({
            completed: false,
            dueBefore: dayEnd.toISOString(),
            dueAfter: dayStart.toISOString(),
        }),
        queryFn: () => tasksApi.getTasks({
            completed: false,
            dueBefore: dayEnd.toISOString(),
            dueAfter: dayStart.toISOString(),
        }, apiKey),
        staleTime: 5000,
    })
    
    // Prefetch completed tasks
    queryClient.prefetchQuery({
        queryKey: taskKeys.list({
            completed: true,
            dueBefore: dayEnd.toISOString(),
            dueAfter: dayStart.toISOString(),
        }),
        queryFn: () => tasksApi.getTasks({
            completed: true,
            dueBefore: dayEnd.toISOString(),
            dueAfter: dayStart.toISOString(),
        }, apiKey),
        staleTime: 5000,
    })
    
    // Prefetch task counts
    const dayBefore = new Date(dayStart)
    dayBefore.setDate(dayBefore.getDate() - 1)
    
    queryClient.prefetchQuery({
        queryKey: taskKeys.count({
            dueAfter: dayBefore.toISOString(),
            dueBefore: dayEnd.toISOString(),
        }),
        queryFn: () => tasksApi.getTaskCounts({
            dueAfter: dayBefore.toISOString(),
            dueBefore: dayEnd.toISOString(),
        }, apiKey),
        staleTime: 5000,
    })
}

/**
 * Prefetch data managed by SWR
 */
async function prefetchSWRData(dayStart: Date, dayEnd: Date, apiKey: string) {
    // Prefetch workouts
    const workoutParams = new URLSearchParams()
    workoutParams.append('limit', '10')
    workoutParams.append('dateAfter', dayStart.toISOString())
    workoutParams.append('dateBefore', dayEnd.toISOString())
    const workoutUrl = `/api/workout?${workoutParams.toString()}`
    
    try {
        const workoutData = await fetcher(workoutUrl, apiKey)
        // Manually populate SWR cache using mutate
        mutate(workoutUrl, workoutData, false)
    } catch (error) {
        // Silently fail prefetch, the actual request will happen when user navigates
        console.debug('Failed to prefetch workout data:', error)
    }
    
    // Prefetch notes
    const noteParams = new URLSearchParams()
    noteParams.append('createdAfter', dayStart.toISOString())
    noteParams.append('createdBefore', dayEnd.toISOString())
    noteParams.append('limit', '10')
    const noteUrl = `/api/note?${noteParams.toString()}`
    
    try {
        const noteData = await fetcher(noteUrl, apiKey)
        // Manually populate SWR cache using mutate
        mutate(noteUrl, noteData, false)
    } catch (error) {
        // Silently fail prefetch
        console.debug('Failed to prefetch note data:', error)
    }
}
