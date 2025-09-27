"use client"

import {SidebarProvider} from "@/components/ui/sidebar"
import {ToolsSidebar} from '@/components/big/tools-sidebar'
import {MobileSidebarToggle} from "@/components/ui/mobile-sidebar-toggle"

function ToolsLayoutContent({children}: { children: React.ReactNode }) {
    return (
        <>
            <ToolsSidebar/>
            <main className="w-full">
                {children}
            </main>
            <MobileSidebarToggle/>
        </>
    )
}

export default function ToolsLayout({children}: { children: React.ReactNode }) {
    return (
        <SidebarProvider defaultOpen={false}>
            <ToolsLayoutContent>{children}</ToolsLayoutContent>
        </SidebarProvider>
    )
}