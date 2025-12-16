"use client"

import { useEffect, useRef } from "react"
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

    // Track if notifications have been shown today to avoid duplicates
    const lastMorningNotificationDate = useRef<string>("")
    const lastEveningNotificationDate = useRef<string>("")

    useEffect(() => {
        if (!user) return

        const checkMoodReminders = () => {
            const now = new Date()
            const currentHour = now.getHours()
            const currentMinute = now.getMinutes()
            const currentDateKey = now.toDateString()

            // Helper function to check if current time is within reminder window
            const isInTimeRange = (reminderHour: number, reminderMinute: number) => {
                // Calculate reminder time in minutes from midnight
                const reminderTimeInMinutes = reminderHour * 60 + reminderMinute
                // Calculate current time in minutes from midnight
                const currentTimeInMinutes = currentHour * 60 + currentMinute
                // Check if current time is within 2-hour window (120 minutes) after reminder time
                return currentTimeInMinutes >= reminderTimeInMinutes && 
                       currentTimeInMinutes < reminderTimeInMinutes + 120
            }

            // Check morning reminder (e.g., 8:00 AM - 10:00 AM)
            if (
                user.mood_reminder_morning_enabled &&
                isInTimeRange(user.mood_reminder_morning_hour, user.mood_reminder_morning_minute) &&
                lastMorningNotificationDate.current !== currentDateKey
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
                    lastMorningNotificationDate.current = currentDateKey
                }
            }

            // Check evening reminder (e.g., 8:00 PM - 10:00 PM)
            if (
                user.mood_reminder_evening_enabled &&
                isInTimeRange(user.mood_reminder_evening_hour, user.mood_reminder_evening_minute) &&
                lastEveningNotificationDate.current !== currentDateKey
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
                    lastEveningNotificationDate.current = currentDateKey
                }
            }

            // Reset notification tracking at midnight
            const currentDate = now.toDateString()
            if (lastMorningNotificationDate.current && lastMorningNotificationDate.current !== currentDate) {
                lastMorningNotificationDate.current = ""
            }
            if (lastEveningNotificationDate.current && lastEveningNotificationDate.current !== currentDate) {
                lastEveningNotificationDate.current = ""
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
