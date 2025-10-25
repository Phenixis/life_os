import { redirect } from "next/navigation"

export default async function SettingsPage() {
    // Redirect to profile settings by default
    redirect("/my/settings/profile")
}