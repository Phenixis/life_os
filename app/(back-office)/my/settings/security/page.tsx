import { getUser } from "@/lib/db/queries/user/user"
import { PasswordResetForm } from "@/components/big/settings/password-reset-form"
import { PasswordResetFormSkeleton } from "@/components/big/settings/password-reset-form-skeleton"
import { Suspense } from "react"

async function SecurityContent() {
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

    return <PasswordResetForm user={user} />
}

export default function SecuritySettingsPage() {
    return (
        <section className="page">
            <h1 className="page-title">Security</h1>
            <p className="page-description">
                Manage your password and security settings to keep your account safe.
            </p>
            <div className="mt-8">
                <Suspense fallback={<PasswordResetFormSkeleton />}>
                    <SecurityContent />
                </Suspense>
            </div>
        </section>
    )
}
