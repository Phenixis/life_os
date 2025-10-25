"use client"

import { Task } from "@/lib/db/schema"
import { useFilteredData } from "./use-filtered-data"

interface UseSearchTasksParams {
  query?: string
  limit?: number
  excludeIds?: number[]
}

export function useSearchTasks(params: UseSearchTasksParams = {}) {
  const { query, limit, excludeIds = [] } = params

  // Only create a SWR key if query has a value
  const shouldFetch = query !== undefined && query !== ""

  const { data, isLoading, isError, mutate } = useFilteredData<Task.Task.Select[]>({
    endpoint: "/api/task/search",
    params: {
      query,
      limit,
      excludeIds: excludeIds.length > 0 ? excludeIds.join(",") : undefined,
    },
    // Skip fetching if query is empty
    skipFetch: !shouldFetch,
  })

  // Filter out tasks with excluded IDs (in case server filtering fails)
  const filteredTasks = data ?
    (data as Task.Task.Select[]).filter(task => !excludeIds.includes(task.id)) :
    []

  return {
    data: filteredTasks,
    isLoading,
    isError,
    mutate,
    tasks: filteredTasks, // Keep backward compatibility
  }
}
