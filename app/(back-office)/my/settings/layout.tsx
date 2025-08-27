"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { SettingsSidebar } from '@/components/big/settings/settings-sidebar'
import { MobileSidebarSwipeGesture } from "@/components/ui/mobile-sidebar-swipe-gesture"
import { MobileSidebarToggle } from "@/components/ui/mobile-sidebar-toggle"

function SettingsLayoutContent({ children }: { children: React.ReactNode }) {
    return (
        <>
            <SettingsSidebar />
            <main className="flex-1 flex justify-center p-4">
                <div className="w-full max-w-4xl">
                    {children}
                </div>
            </main>
            <MobileSidebarSwipeGesture />
            <MobileSidebarToggle />
        </>
    )
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider defaultOpen={false}>
            <SettingsLayoutContent>{children}</SettingsLayoutContent>
        </SidebarProvider>
    )
}
