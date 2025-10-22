"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
import { User } from "@/lib/db/schema"
import { useSWRConfig } from "swr"
import { Loader2 } from "lucide-react"

interface NotificationsFormProps {
    user: User.User.Select
}

export function NotificationsForm({ user }: NotificationsFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [dailyRecapEnabled, setDailyRecapEnabled] = useState(user.daily_recap_email_enabled)
    const [lastSavedValue, setLastSavedValue] = useState(user.daily_recap_email_enabled)
    const { mutate } = useSWRConfig()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Check if anything has changed
        if (dailyRecapEnabled === lastSavedValue) {
            toast.info("No changes detected - your notification preferences are already up to date.")
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
                body: JSON.stringify({ daily_recap_email_enabled: dailyRecapEnabled }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to update notification preferences")
            }

            const updatedUser = await response.json()
            
            // Update the last saved value
            setLastSavedValue(updatedUser.daily_recap_email_enabled)
            
            // Update the user data in the global state
            mutate("/api/user")
            
            toast.success("Notification preferences updated successfully!")

        } catch (error) {
            console.error("Error updating notification preferences:", error)
            toast.error(error instanceof Error ? error.message : "Failed to update notification preferences. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>
                    Choose which email notifications you would like to receive.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center justify-between space-x-4">
                        <div className="flex-1 space-y-1">
                            <Label htmlFor="daily-recap" className="text-base font-medium">
                                Daily Recap Email
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Receive a morning email with your completed tasks from yesterday and upcoming tasks for today.
                            </p>
                        </div>
                        <Switch
                            id="daily-recap"
                            checked={dailyRecapEnabled}
                            onCheckedChange={setDailyRecapEnabled}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button 
                            type="submit" 
                            disabled={isLoading}
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
