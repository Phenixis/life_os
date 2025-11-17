"use client"

import { NotesAndData } from "@/lib/db/queries/note"
import { useFilteredData } from "./use-filtered-data"
import {simplifiedProject} from "@/components/big/tasks/tasks-card";

interface UseNotesParams {
    title?: string
    projectTitle?: string
    limit?: number
    page?: number
    projects?: simplifiedProject[]
    excludedProjects?: simplifiedProject[]
}

export function useNotes(params: UseNotesParams = {}) {
    const {
        title,
        projectTitle,
        limit,
        page,
        projects,
        excludedProjects
    } = params

    const { data, isLoading, isError, mutate } = useFilteredData<NotesAndData>({
        endpoint: "/api/note",
        params: {
            title,
            projectTitle,
            limit: limit ? limit + 1 : undefined,
            page,
            projectTitles: projects?.join(","),
            excludedProjectTitles: excludedProjects?.join(",")
        },
    })

    return {
        data: data as NotesAndData,
        isLoading,
        isError,
        mutate,
        notes: data as NotesAndData, // Keep backward compatibility
    }
}
// Hook to fetch notes by date range
export function useNotesByDate(createdAfter?: Date, createdBefore?: Date, limit: number = 10) {
    const { data, isLoading, isError, mutate } = useFilteredData<NotesAndData>({
        endpoint: "/api/note",
        params: {
            createdAfter: createdAfter?.toISOString(),
            createdBefore: createdBefore?.toISOString(),
            limit,
        },
    })

    return {
        notes: data?.notes || [],
        isLoading,
        isError,
        mutate,
    }
}
