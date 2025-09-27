import { flag } from "flags/next"
import { shouldDarkModeBeEnabled } from "@/lib/utils/dark-mode"
import { Task } from "@/lib/db/schema"

export interface DarkModeCookie {
    has_jarvis_asked_dark_mode: boolean
    dark_mode: boolean
    auto_dark_mode: boolean
    startHour: number
    startMinute: number
    endHour: number
    endMinute: number
    override: boolean
}

export interface TaskFilterCookie {
    completed?: boolean
    limit?: number
    orderBy?: keyof Task.Task.Select
    orderingDirection?: "asc" | "desc"
    projects?: string[]
    removedProjects?: string[]
    dueBeforeDate?: string
    groupByProject?: boolean
}

export interface WatchlistFilterCookie {
    search?: string
    sortBy?: 'updated' | 'title' | 'vote_average' | 'date_added'
    sortOrder?: 'asc' | 'desc'
    mediaFilter?: 'all' | 'movie' | 'tv'
    currentPage?: number
}

export const defaultValueCookie = {
    has_jarvis_asked_dark_mode: false,
    dark_mode: false,
    auto_dark_mode: true,
    startHour: 19, // 7pm
    startMinute: 0,
    endHour: 6, // 6am
    endMinute: 0,
    override: false,
} as DarkModeCookie

export const defaultTaskFilterCookie: TaskFilterCookie = {
    completed: false,
    limit: 5,
    orderBy: "score",
    orderingDirection: "desc",
    projects: [],
    removedProjects: [],
    groupByProject: false
}

export const defaultWatchlistFilterCookie: WatchlistFilterCookie = {
    search: '',
    sortBy: 'date_added',
    sortOrder: 'desc',
    mediaFilter: 'all',
    currentPage: 1
}

export const darkMode = flag<boolean, DarkModeCookie>({
    key: "dark-mode",
    identify({ cookies }) {
        // Get the current user from the session
        const darkModeCookie = cookies.get("dark_mode")?.value
        if (!darkModeCookie) {
            return defaultValueCookie
        }
        const preferences = JSON.parse(darkModeCookie) as DarkModeCookie

        const { dark_mode, override } = shouldDarkModeBeEnabled(preferences)

        return {
            ...preferences,
            dark_mode: dark_mode,
            override: override,
        }
    },
    decide({ entities }) {
        return entities?.dark_mode ?? false
    }
})
