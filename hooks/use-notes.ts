"use client"

import { NotesAndData } from "@/lib/db/queries/note"
import { useFilteredData } from "./use-filtered-data"

interface UseNotesParams {
    title?: string
    projectTitle?: string
    limit?: number
    page?: number
    projectTitles?: string[]
    excludedProjectTitles?: string[]
}

export function useNotes(params: UseNotesParams = {}) {
    const {
        title,
        projectTitle,
        limit,
        page,
        projectTitles,
        excludedProjectTitles
    } = params

    const { data, isLoading, isError, mutate } = useFilteredData<NotesAndData>({
        endpoint: "/api/note",
        params: {
            title,
            projectTitle,
            limit: limit ? limit + 1 : undefined,
            page,
            projectTitles: projectTitles?.join(","),
            excludedProjectTitles: excludedProjectTitles?.join(",")
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