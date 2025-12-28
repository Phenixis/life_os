"use client"

import { useQuery, UseQueryOptions } from "@tanstack/react-query"
import { Task } from "@/lib/db/schema"
import { useUser } from "../use-user"
import { tasksApi } from "@/lib/api/tasks.api"
import { taskKeys, TaskFilters } from "@/lib/api/query-keys"

export interface UseTasksParams {
    completed?: boolean
    orderBy?: keyof Task.Task.Select
    limit?: number
    orderingDirection?: "asc" | "desc"
    withProject?: boolean
    selectedProjects?: number[]
    excludedProjects?: number[]
    dueBefore?: Date
    dueAfter?: Date
    state?: string
    enabled?: boolean
}

/**
 * Hook to fetch tasks list with filters
 */
export function useTasksQuery(params: UseTasksParams = {}) {
    const { user } = useUser()

    const filters: TaskFilters = {
        completed: params.completed,
        orderBy: params.orderBy as string,
        limit: params.limit ? params.limit + 1 : undefined,
        orderingDirection: params.orderingDirection,
        withProject: params.withProject,
        projectIds: params.selectedProjects,
        excludedProjectIds: params.excludedProjects,
        dueBefore: params.dueBefore?.toISOString(),
        dueAfter: params.dueAfter?.toISOString(),
        state: params.state,
    }

    const query = useQuery({
        queryKey: taskKeys.list(filters),
        queryFn: () => tasksApi.getTasks(filters, user?.api_key || ''),
        enabled: params.enabled !== false && !!user?.api_key,
        staleTime: 5000,
    })

    return {
        ...query,
        tasks: query.data ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
    }
}

/**
 * Hook to fetch a single task by ID
 */
export function useTaskQuery(id: number | undefined, options?: Partial<UseQueryOptions>) {
    const { user } = useUser()

    return useQuery({
        queryKey: taskKeys.detail(id!),
        queryFn: () => tasksApi.getTask(id!, user?.api_key || ''),
        enabled: !!id && !!user?.api_key,
        ...options,
    })
}

/**
 * Hook to search tasks
 */
export function useTaskSearchQuery(query: string, enabled: boolean = true) {
    const { user } = useUser()

    return useQuery({
        queryKey: taskKeys.search(query),
        queryFn: () => tasksApi.searchTasks(query, user?.api_key || ''),
        enabled: enabled && !!query && query.length > 0 && !!user?.api_key,
        staleTime: 30000, // Search results stay fresh longer
    })
}