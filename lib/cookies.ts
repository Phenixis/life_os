"use server";

import { cookies } from "next/headers"
import { DarkModeCookie, TaskFilterCookie, defaultValueCookie, defaultTaskFilterCookie } from "@/lib/flags"
import { WatchlistFilterCookie, defaultWatchlistFilterCookie } from "@/lib/types/watchlist"

export async function getDarkModeCookie() {
    const cookieStore = await cookies()
    const cookie = cookieStore.get("dark_mode")?.value
    if (!cookie) {
        return defaultValueCookie
    } else {
        try {
            return JSON.parse(cookie) as DarkModeCookie
        } catch (error) {
            console.error("Failed to parse dark mode cookie:", error)
            return defaultValueCookie
        }
    }
}

export async function updateDarkModeCookie(cookie: DarkModeCookie) {
    const cookieStore = await cookies();
    cookieStore.set("dark_mode", JSON.stringify(cookie), {
        path: "/", // Ensure the cookie is accessible across the app
        maxAge: 30 * 24 * 60 * 60 // 30 days in seconds
    });
}

export async function syncDarkModeState(isDarkMode: boolean, cookie: DarkModeCookie) {
    const newCookie: DarkModeCookie = {
        ...cookie,
        dark_mode: isDarkMode,
        override: false // Reset override when syncing
    }

    await updateDarkModeCookie(newCookie)
    return newCookie
}

export async function getTaskFilterCookie(): Promise<TaskFilterCookie> {
    const cookieStore = await cookies()
    const cookie = cookieStore.get("task_filter")?.value
    if (!cookie) {
        return defaultTaskFilterCookie
    } else {
        try {
            return JSON.parse(cookie) as TaskFilterCookie
        } catch (error) {
            console.error("Failed to parse task filter cookie:", error)
            return defaultTaskFilterCookie
        }
    }
}

export async function updateTaskFilterCookie(cookie: TaskFilterCookie): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set("task_filter", JSON.stringify(cookie), {
        path: "/", // Ensure the cookie is accessible across the app
        // Setting maxAge to undefined makes this a session cookie
        // It will expire when the browser is closed
    });
}

export async function getWatchlistFilterCookie(): Promise<WatchlistFilterCookie> {
    const cookieStore = await cookies()
    const cookie = cookieStore.get("watchlist_filter")?.value
    if (!cookie) {
        return defaultWatchlistFilterCookie
    } else {
        try {
            return JSON.parse(cookie) as WatchlistFilterCookie
        } catch (error) {
            console.error("Failed to parse watchlist filter cookie:", error)
            return defaultWatchlistFilterCookie
        }
    }
}

export async function updateWatchlistFilterCookie(cookie: WatchlistFilterCookie): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set("watchlist_filter", JSON.stringify(cookie), {
        path: "/", // Ensure the cookie is accessible across the app
        maxAge: 30 * 24 * 60 * 60 // 30 days in seconds
    });
}