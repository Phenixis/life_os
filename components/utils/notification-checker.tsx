"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { useUser } from "@/hooks/use-user"
import { useDailyMoods } from "@/hooks/use-daily-moods"
import { useDailyMoodModal } from "@/contexts/modal-commands-context"
import { SmilePlus } from "lucide-react"

export function NotificationChecker() {
    const { user } = useUser()
    const { openModal } = useDailyMoodModal()
    const today = new Date()
    const { data: todayMood } = useDailyMoods({
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
    })

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const { data: yesterdayMood } = useDailyMoods({
        startDate: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
        endDate: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1),
    })

    useEffect(() => {
        if (!user) return

        const checkMoodReminders = () => {
            const now = new Date()
            const currentHour = now.getHours()
            const currentMinute = now.getMinutes()

            // Check morning reminder
            if (
                user.mood_reminder_morning_enabled &&
                currentHour === user.mood_reminder_morning_hour &&
                currentMinute === user.mood_reminder_morning_minute
            ) {
                // Check if yesterday's mood is missing
                if (!yesterdayMood || yesterdayMood.length === 0) {
                    toast.info("Good morning! Don't forget to log yesterday's mood.", {
                        icon: <SmilePlus className="h-5 w-5" />,
                        duration: 10000,
                        action: {
                            label: "Log Mood",
                            onClick: () => openModal(yesterday)
                        }
                    })
                }
            }

            // Check evening reminder
            if (
                user.mood_reminder_evening_enabled &&
                currentHour === user.mood_reminder_evening_hour &&
                currentMinute === user.mood_reminder_evening_minute
            ) {
                // Check if today's mood is missing
                if (!todayMood || todayMood.length === 0) {
                    toast.info("Good evening! How was your day? Log your mood.", {
                        icon: <SmilePlus className="h-5 w-5" />,
                        duration: 10000,
                        action: {
                            label: "Log Mood",
                            onClick: () => openModal(today)
                        }
                    })
                }
            }
        }

        // Check immediately on mount
        checkMoodReminders()

        // Check every minute
        const interval = setInterval(checkMoodReminders, 60000)

        return () => clearInterval(interval)
    }, [user, todayMood, yesterdayMood, openModal])

    return null
}
