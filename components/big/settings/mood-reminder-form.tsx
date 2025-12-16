"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { User } from "@/lib/db/schema"
import { useSWRConfig } from "swr"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MoodReminderFormProps {
    user: User.User.Select
}

export function MoodReminderForm({ user }: MoodReminderFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formState, setFormState] = useState({
        mood_reminder_morning_enabled: user.mood_reminder_morning_enabled,
        mood_reminder_morning_hour: user.mood_reminder_morning_hour,
        mood_reminder_morning_minute: user.mood_reminder_morning_minute,
        mood_reminder_evening_enabled: user.mood_reminder_evening_enabled,
        mood_reminder_evening_hour: user.mood_reminder_evening_hour,
        mood_reminder_evening_minute: user.mood_reminder_evening_minute,
    })
    const [initialFormState] = useState(formState)
    const { mutate } = useSWRConfig()

    const isDirty = useMemo(() => {
        return Object.keys(formState).some(
            key => formState[key as keyof typeof formState] !== initialFormState[key as keyof typeof initialFormState]
        )
    }, [formState, initialFormState])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!isDirty) {
            toast.info("No changes detected - your mood reminder preferences are already up to date.")
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch("/api/user/notifications", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.api_key}`
                },
                body: JSON.stringify(formState),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to update mood reminder preferences")
            }

            toast.success("Mood reminder preferences updated successfully!")

            mutate("/api/user")

        } catch (error) {
            console.error("Error updating mood reminder preferences:", error)
            toast.error(error instanceof Error ? error.message : "Failed to update mood reminder preferences. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const hours = Array.from({ length: 24 }, (_, i) => i)
    const minutes = [0, 15, 30, 45]

    const formatTime = (hour: number, minute: number) => {
        const h = hour.toString().padStart(2, '0')
        const m = minute.toString().padStart(2, '0')
        return `${h}:${m}`
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Daily Mood Reminders</CardTitle>
                <CardDescription>
                    Get reminded to log your daily mood in the morning and evening.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Morning Reminder */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between space-x-4">
                            <div className="flex-1 space-y-1">
                                <Label htmlFor="morning-reminder" className="text-base font-medium">
                                    Morning Reminder
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Get reminded to log yesterday's mood in the morning.
                                </p>
                            </div>
                            <Switch
                                id="morning-reminder"
                                checked={formState.mood_reminder_morning_enabled}
                                onCheckedChange={(val) =>
                                    setFormState(prev => ({ ...prev, mood_reminder_morning_enabled: val }))
                                }
                                disabled={isLoading}
                            />
                        </div>
                        {formState.mood_reminder_morning_enabled && (
                            <div className="ml-4 space-y-2">
                                <Label htmlFor="morning-time" className="text-sm">
                                    Reminder Time
                                </Label>
                                <div className="flex gap-2">
                                    <Select
                                        value={formState.mood_reminder_morning_hour.toString()}
                                        onValueChange={(val) =>
                                            setFormState(prev => ({ ...prev, mood_reminder_morning_hour: parseInt(val) }))
                                        }
                                        disabled={isLoading}
                                    >
                                        <SelectTrigger className="w-24">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {hours.map(h => (
                                                <SelectItem key={h} value={h.toString()}>
                                                    {h.toString().padStart(2, '0')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <span className="flex items-center">:</span>
                                    <Select
                                        value={formState.mood_reminder_morning_minute.toString()}
                                        onValueChange={(val) =>
                                            setFormState(prev => ({ ...prev, mood_reminder_morning_minute: parseInt(val) }))
                                        }
                                        disabled={isLoading}
                                    >
                                        <SelectTrigger className="w-24">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {minutes.map(m => (
                                                <SelectItem key={m} value={m.toString()}>
                                                    {m.toString().padStart(2, '0')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Current: {formatTime(formState.mood_reminder_morning_hour, formState.mood_reminder_morning_minute)}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Evening Reminder */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between space-x-4">
                            <div className="flex-1 space-y-1">
                                <Label htmlFor="evening-reminder" className="text-base font-medium">
                                    Evening Reminder
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Get reminded to log today's mood in the evening.
                                </p>
                            </div>
                            <Switch
                                id="evening-reminder"
                                checked={formState.mood_reminder_evening_enabled}
                                onCheckedChange={(val) =>
                                    setFormState(prev => ({ ...prev, mood_reminder_evening_enabled: val }))
                                }
                                disabled={isLoading}
                            />
                        </div>
                        {formState.mood_reminder_evening_enabled && (
                            <div className="ml-4 space-y-2">
                                <Label htmlFor="evening-time" className="text-sm">
                                    Reminder Time
                                </Label>
                                <div className="flex gap-2">
                                    <Select
                                        value={formState.mood_reminder_evening_hour.toString()}
                                        onValueChange={(val) =>
                                            setFormState(prev => ({ ...prev, mood_reminder_evening_hour: parseInt(val) }))
                                        }
                                        disabled={isLoading}
                                    >
                                        <SelectTrigger className="w-24">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {hours.map(h => (
                                                <SelectItem key={h} value={h.toString()}>
                                                    {h.toString().padStart(2, '0')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <span className="flex items-center">:</span>
                                    <Select
                                        value={formState.mood_reminder_evening_minute.toString()}
                                        onValueChange={(val) =>
                                            setFormState(prev => ({ ...prev, mood_reminder_evening_minute: parseInt(val) }))
                                        }
                                        disabled={isLoading}
                                    >
                                        <SelectTrigger className="w-24">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {minutes.map(m => (
                                                <SelectItem key={m} value={m.toString()}>
                                                    {m.toString().padStart(2, '0')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Current: {formatTime(formState.mood_reminder_evening_hour, formState.mood_reminder_evening_minute)}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            disabled={isLoading || !isDirty}
                            className="min-w-[120px]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
