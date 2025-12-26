"use client"

import {useFilteredData} from "./use-filtered-data"
import {Project} from "@/lib/db/schema"

interface UseProjectsParams {
    /** Filter by exact project ID */
    projectId?: number
    /** Maximum number of projects to return */
    limit?: number
    /** Include the synthetic "No project" option (default: true) */
    includeNoProject?: boolean
}

export function useProjects(params: UseProjectsParams = {}) {
    const {
        projectId,
        limit,
        includeNoProject,
    } = params

    const {data, isLoading, isError, mutate} = useFilteredData<Project.Select[]>({
        endpoint: "/api/project",
        params: {
            projectId,
            limit,
            includeNoProject,
        },
    })

    return {
        data: (data as Project.Select[]) || [],
        isLoading,
        isError,
        projects: (data as Project.Select[]) || [],
        mutate,
    }
}
