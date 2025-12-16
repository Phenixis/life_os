import { getUser } from "@/lib/db/queries/user/user"
import { NotificationsForm } from "@/components/big/settings/notifications-form"
import { MoodReminderForm } from "@/components/big/settings/mood-reminder-form"
import { NotificationsFormSkeleton } from "@/components/big/settings/notifications-form-skeleton"
import { Suspense } from "react"

async function NotificationsContent() {
    const user = await getUser()

    if (!user) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">
                    Unable to load user information. Please try refreshing the page.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <NotificationsForm user={user} />
            <MoodReminderForm user={user} />
        </div>
    )
}

export default function NotificationsSettingsPage() {
    return (
        <section className="page">
            <h1 className="page-title">Notifications</h1>
            <p className="page-description">
                Manage your notification preferences and reminders.
            </p>
            <div className="mt-8">
                <Suspense fallback={<NotificationsFormSkeleton />}>
                    <NotificationsContent />
                </Suspense>
            </div>
        </section>
    )
}
