"use client"

import { Task } from "@/lib/db/schema"
import { useFilteredData } from "./use-filtered-data"
import {simplifiedProject} from "@/components/big/tasks/tasks-card";

interface UseTasksParams {
  completed?: boolean
  orderBy?: keyof Task.Task.Select
  limit?: number
  orderingDirection?: "asc" | "desc"
  withProject?: boolean
  projects?: simplifiedProject[]
  excludedProjects?: simplifiedProject[]
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
    projects,
    excludedProjects,
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
      projectTitles: projects?.join(","),
      excludedProjectTitles: excludedProjects?.join(","),
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
