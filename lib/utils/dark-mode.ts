import { DarkModeCookie } from "@/lib/flags"

export function shouldDarkModeBeEnabled(cookie: DarkModeCookie) : {
    dark_mode: boolean,
    override: boolean
} {
    if (!cookie.auto_dark_mode) {
        return {
            dark_mode: cookie.dark_mode,
            override: false,
        }
    }

    const now = new Date()
    let shouldItBeEnabled: boolean

    const isAfterStartTime =
        now.getHours() > cookie.startHour ||
        (now.getHours() === cookie.startHour && now.getMinutes() >= cookie.startMinute)
    const isBeforeEndTime =
        now.getHours() < cookie.endHour || (now.getHours() === cookie.endHour && now.getMinutes() < cookie.endMinute)

    if (cookie.startHour > cookie.endHour) {
        // Overnight schedule: Dark mode is ON from startTime until endTime next day
        // (e.g., 8:18 to 4:00 means dark mode ON from 8:18 AM to 4:00 AM next day)
        // OR (e.g., 22:00 to 06:00 means dark mode ON from 10:00 PM to 6:00 AM next day)
        shouldItBeEnabled = isAfterStartTime || isBeforeEndTime
    } else {
        // Same-day schedule: Dark mode is ON only between startTime and endTime on same day
        // (e.g., 06:00 to 18:00 means dark mode ON from 6:00 AM to 6:00 PM same day)
        shouldItBeEnabled = isAfterStartTime && isBeforeEndTime
    }

    // Check if the current state matches what the schedule says it should be
    if (shouldItBeEnabled === cookie.dark_mode || cookie.override) {
        // Current state matches schedule - no override needed
        return {
            dark_mode: cookie.override ? cookie.dark_mode : shouldItBeEnabled,
            override: cookie.override,
        }
    } else {
        // Current state doesn't match schedule - apply the schedule and clear override
        // This handles both cases:
        // 1. Dark mode should be ON but is currently OFF -> turn it ON
        // 2. Dark mode should be OFF but is currently ON -> turn it OFF
        return {
            dark_mode: shouldItBeEnabled,
            override: false,
        }
    }
}