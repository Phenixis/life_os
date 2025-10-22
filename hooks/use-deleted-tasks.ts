"use client"

import { Task } from "@/lib/db/schema"
import { useFilteredData } from "./use-filtered-data"

interface UseDeletedTasksParams {
  limit?: number
}

export function useDeletedTasks(params: UseDeletedTasksParams = {}) {
  const { limit } = params

  const { data, isLoading, isError, mutate } = useFilteredData<Task.Task.TaskWithNonRecursiveRelations[]>({
    endpoint: "/api/task/recover",
    params: {
      limit: limit ? limit + 1 : undefined,
    },
  })

  return {
    data: (data as Task.Task.TaskWithNonRecursiveRelations[]) || [],
    isLoading,
    isError,
    tasks: (data as Task.Task.TaskWithNonRecursiveRelations[]) || [],
    mutate,
  }
}
