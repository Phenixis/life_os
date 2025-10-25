"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { useFilteredData } from "./use-filtered-data"
import { useUser } from "./use-user"
import { DarkModeCookie } from "@/lib/flags"
import { shouldDarkModeBeEnabled } from "@/lib/utils/dark-mode"

export function useDarkMode() {
    const { data, isLoading, isError, mutate } = useFilteredData({
        endpoint: "/api/dark-mode",
        params: {},
    })
    
    const { mutate: swrMutate } = useSWRConfig()
    const user = useUser().user

    const updateDarkModePreference = useCallback(async (newValue: DarkModeCookie) => {
        try {
            swrMutate(
                (key: unknown) => typeof key === "string" && (key === "/api/dark-mode" || key.startsWith("/api/dark-mode?")),
                async (currentData: unknown): Promise<DarkModeCookie | unknown> => {
                    if (!(typeof currentData === "object" && currentData !== null && "dark_mode" in currentData)) return currentData
                    return newValue
                },
                { revalidate: false },
            )

            await fetch("/api/dark-mode", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user?.api_key}`
                },
                body: JSON.stringify(newValue),
            })

            swrMutate((key) => typeof key === "string" && (key === "/api/dark-mode" || key.startsWith("/api/dark-mode?")))
        } catch (error: unknown) {
            console.error("Error updating dark mode preference:", error)
        }
    }, [swrMutate, user?.api_key])

    const toggleDarkMode = useCallback(async (forceDarkMode?: boolean) => {
        if (!data?.darkModeCookie) return

        const currentCookie = data.darkModeCookie as DarkModeCookie
        
        // Determine the new dark mode state
        const newDarkMode = forceDarkMode !== undefined ? forceDarkMode : !currentCookie.dark_mode
        let override = false

        // If auto dark mode is enabled, check if this manual toggle contradicts the schedule
        if (currentCookie.auto_dark_mode) {
            const scheduledState = shouldDarkModeBeEnabled(currentCookie)
            // If the user wants to toggle to a state different from what the schedule says, set override
            override = newDarkMode !== scheduledState.dark_mode
        }

        const newCookie = {
            ...currentCookie,
            dark_mode: newDarkMode,
            override: override,
        }
        
        // Update DOM immediately for better UX
        document.documentElement.classList.toggle("dark", newDarkMode)
        
        // Update SWR cache optimistically
        mutate(async () => ({ darkModeCookie: newCookie }), { revalidate: false })
        
        // Persist to API
        await updateDarkModePreference(newCookie)
    }, [data?.darkModeCookie, updateDarkModePreference, mutate])

    const shouldShowAutoDarkModeDialog = useCallback(() => {
        if (!data?.darkModeCookie) return false
        const currentCookie = data.darkModeCookie as DarkModeCookie
        return currentCookie.auto_dark_mode && !currentCookie.has_jarvis_asked_dark_mode
    }, [data?.darkModeCookie])

    const updateDarkModeSettings = useCallback(async (
        newCookie: DarkModeCookie,
        onCookieUpdate: (newCookie: DarkModeCookie) => void
    ) => {
        onCookieUpdate(newCookie)
        document.documentElement.classList.toggle("dark", newCookie.dark_mode)
        await updateDarkModePreference(newCookie)
    }, [updateDarkModePreference])

    return {
        darkMode: (data?.darkModeCookie ?? null) as DarkModeCookie | null,
        isLoading,
        isError,
        mutate,
        toggleDarkMode,
        shouldShowAutoDarkModeDialog,
        updateDarkModeSettings,
    }
}