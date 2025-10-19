import { getUser } from "@/lib/db/queries/user/user"
import { ProfileForm } from "@/components/big/settings/profile-form"
import { ProfileFormSkeleton } from "@/components/big/settings/profile-form-skeleton"
import { Suspense } from "react"

async function ProfileContent() {
    const user = await getUser()

    if (!user) {
        throw new Error("User not found")
    }

    return <ProfileForm user={user} />
}

export default function ProfileSettingsPage() {
    return (
        <section className="page">
            <h1 className="page-title">Profile Settings</h1>
            <p className="page-description">
                Manage your personal information and account details.
            </p>
            <div className="mt-8">
                <Suspense fallback={<ProfileFormSkeleton />}>
                    <ProfileContent />
                </Suspense>
            </div>
        </section>
    )
}
