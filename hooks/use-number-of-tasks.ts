"use client"

import { TaskCount } from "@/components/ui/calendar"
import type { Task } from "@/lib/db/schema"
import { useFilteredData } from "./use-filtered-data"
import {simplifiedProject} from "@/components/big/tasks/tasks-card";

interface UseNumberOfTasksParams {
    projects?: simplifiedProject[]
    excludedProjects?: simplifiedProject[]
    dueAfter?: Date
    dueBefore?: Date
    enabled?: boolean
}

// hooks/use-number-of-tasks.ts
export function useNumberOfTasks(params: UseNumberOfTasksParams = {}) {
    const {
        projects,
        excludedProjects,
        dueAfter,
        dueBefore,
        enabled = true
    } = params

    const { data, isLoading, isError, mutate } = useFilteredData<Task.Task.Select[]>({
        endpoint: "/api/task/count",
        params: {
            projectTitles: projects?.map(p => p.title).join(","),
            excludedProjectTitles: excludedProjects?.map(p => p.title).join(","),
            dueAfter: dueAfter ? dueAfter.toISOString() : undefined,
            dueBefore: dueBefore ? dueBefore.toISOString() : undefined,
        },
        skipFetch: !enabled,
    })

    return {
        data: (data as TaskCount[]) || [],
        isLoading,
        isError,
        mutate,
        taskCounts: (data as TaskCount[]) || [], // Keep backward compatibility
    }
}
