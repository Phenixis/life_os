import UpdateAutoDarkMode from "@/components/big/darkMode/updateAutoDarkMode"
import { UpdateAutoDarkModeSkeleton } from "@/components/big/settings/appearance-form-skeleton"
import { getDarkModeCookie } from "@/lib/cookies"
import { Suspense } from "react"

async function AppearanceContent() {
    const darkModeCookie = await getDarkModeCookie()
    return <UpdateAutoDarkMode darkModeCookie={darkModeCookie} />
}

export default function AppearanceSettingsPage() {
    return (
        <section className="page">
            <h1 className="page-title">Appearance</h1>
            <p className="page-description">
                Customize the look and feel of your interface. Adjust dark mode settings to match your preferences.
            </p>
            <div className="mt-8">
                <Suspense fallback={<UpdateAutoDarkModeSkeleton />}>
                    <AppearanceContent />
                </Suspense>
            </div>
        </section>
    )
}
