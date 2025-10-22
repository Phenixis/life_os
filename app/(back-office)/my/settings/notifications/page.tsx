import { getUser } from "@/lib/db/queries/user/user"
import { NotificationsForm } from "@/components/big/settings/notifications-form"
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

    return <NotificationsForm user={user} />
}

export default function NotificationsSettingsPage() {
    return (
        <section className="page">
            <h1 className="page-title">Notifications</h1>
            <p className="page-description">
                Manage your email notification preferences and stay informed about your tasks.
            </p>
            <div className="mt-8">
                <Suspense fallback={<NotificationsFormSkeleton />}>
                    <NotificationsContent />
                </Suspense>
            </div>
        </section>
    )
}
