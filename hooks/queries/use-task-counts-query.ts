"use client"

import { useQuery } from "@tanstack/react-query"
import { useUser } from "../use-user"
import { tasksApi } from "@/lib/api/tasks.api"
import { taskKeys, TaskCountFilters } from "@/lib/api/query-keys"
import { simplifiedProject } from "@/components/big/tasks/tasks-card"

export interface UseTaskCountsParams {
    projects?: simplifiedProject[]
    excludedProjects?: simplifiedProject[]
    dueAfter?: Date
    dueBefore?: Date
    enabled?: boolean
}

/**
 * Hook to fetch task counts for calendar/progress
 */
export function useTaskCountsQuery(params: UseTaskCountsParams = {}) {
    const { user } = useUser()

    const filters: TaskCountFilters = {
        projectTitles: params.projects?.map(p => p.title).join(","),
        excludedProjectTitles: params.excludedProjects?.map(p => p.title).join(","),
        dueAfter: params.dueAfter?.toISOString(),
        dueBefore: params.dueBefore?.toISOString(),
    }

    const query = useQuery({
        queryKey: taskKeys.count(filters),
        queryFn: () => tasksApi.getTaskCounts(filters, user?.api_key || ''),
        enabled: params.enabled !== false && !!user?.api_key,
        staleTime: 5000,
    })

    return {
        data: query.data ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
    }
}