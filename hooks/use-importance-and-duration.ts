"use client"

import { useFilteredData } from "./use-filtered-data"
import { Task } from "@/lib/db/schema"

interface UseImportanceAndDurationParams {
    skipFetch?: boolean
}

export function useImportanceAndDuration(params: UseImportanceAndDurationParams = {}) {
    const { skipFetch = false } = params
    
    const {
        data: importanceData,
        isLoading: isLoadingImportance,
        isError: isErrorImportance,
    } = useFilteredData<Task.Importance.Select[]>({
        endpoint: "/api/importance",
        params: {},
        skipFetch,
    })

    const {
        data: durationData,
        isLoading: isLoadingDuration,
        isError: isErrorDuration,
    } = useFilteredData<Task.Duration.Select[]>({
        endpoint: "/api/duration",
        params: {},
        skipFetch,
    })

    return {
        data: {
            importance: (importanceData as Task.Importance.Select[]) || [],
            duration: (durationData as Task.Duration.Select[]) || [],
        },
        isLoading: isLoadingImportance || isLoadingDuration,
        isError: isErrorImportance || isErrorDuration,
        importanceData: (importanceData as Task.Importance.Select[]) || [], // Keep backward compatibility
        durationData: (durationData as Task.Duration.Select[]) || [], // Keep backward compatibility
        isLoadingImportance,
        isLoadingDuration,
        isErrorImportance,
        isErrorDuration,
    }
}
