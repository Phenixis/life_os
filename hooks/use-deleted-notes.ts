"use client"

import { NotesAndData } from "@/lib/db/queries/note"
import { useFilteredData } from "./use-filtered-data"

interface UseDeletedNotesParams {
    limit?: number
    page?: number
}

export function useDeletedNotes(params: UseDeletedNotesParams = {}) {
    const {
        limit,
        page,
    } = params

    const { data, isLoading, isError, mutate } = useFilteredData<NotesAndData>({
        endpoint: "/api/note/recover",
        params: {
            limit: limit ? limit + 1 : undefined,
            page,
        },
    })

    return {
        data: data as NotesAndData,
        isLoading,
        isError,
        mutate,
        notes: data as NotesAndData,
    }
}
