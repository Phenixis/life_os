"use client"

import { Task } from "@/lib/db/schema"
import { useFilteredData } from "./use-filtered-data"

interface UseTasksParams {
  completed?: boolean
  orderBy?: keyof Task.Task.Select
  limit?: number
  orderingDirection?: "asc" | "desc"
  withProject?: boolean
  projectTitles?: string[]
  excludedProjectTitles?: string[]
  dueBefore?: Date
  dueAfter?: Date
}

// hooks/use-tasks.ts
export function useTasks(params: UseTasksParams = {}) {
  const {
    completed,
    orderBy,
    limit,
    orderingDirection,
    withProject,
    projectTitles,
    excludedProjectTitles,
    dueBefore,
    dueAfter,
  } = params

  const { data, isLoading, isError, mutate } = useFilteredData<Task.Task.Select[]>({
    endpoint: "/api/task",
    params: {
      completed,
      orderBy: orderBy as string,
      limit: limit ? limit + 1 : undefined,
      orderingDirection,
      withProject: withProject ? "true" : "false",
      projectTitles: projectTitles?.join(","),
      excludedProjectTitles: excludedProjectTitles?.join(","),
      dueBefore: dueBefore ? dueBefore.toISOString() : undefined,
      dueAfter: dueAfter ? dueAfter.toISOString() : undefined,
    },
  })

  return {
    data: (data as Task.Task.TaskWithRelations[]) || [],
    isLoading,
    isError,
    tasks: (data as Task.Task.TaskWithRelations[]) || [], // Keep backward compatibility
    mutate,
  }
}
