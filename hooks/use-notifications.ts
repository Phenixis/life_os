"use client"

import { Notification } from "@/lib/db/schema"
import { useFilteredData } from "./use-filtered-data"

interface UseNotificationsParams {
    includeRead?: boolean
    includeDismissed?: boolean
}

export function useNotifications(params: UseNotificationsParams = {}) {
    const {
        includeRead = false,
        includeDismissed = false,
    } = params

    const { data, isLoading, isError, mutate } = useFilteredData<Notification.Select[]>({
        endpoint: "/api/notification",
        params: {
            includeRead: includeRead ? "true" : "false",
            includeDismissed: includeDismissed ? "true" : "false",
        },
    })

    return {
        data: data || [],
        isLoading,
        isError,
        notifications: data || [],
        mutate,
    }
}
