"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger
} from "@/components/ui/sidebar"
import Link from "next/link"
import {tools} from "@/lib/tools-data"
import {usePathname} from "next/navigation"

export function ToolsSidebar() {
    const pathname = usePathname()

    return (
        <Sidebar collapsible="icon" variant="floating" className="rounded-full">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Tools</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {tools.map((tool) => (
                                <SidebarMenuItem key={tool.name}>
                                    <SidebarMenuButton
                                        className={`flex items-center space-x-2 text-wrap ${pathname === tool.href ? "bg-gray-200/70 dark:bg-gray-800/70" : ""}`}
                                        asChild
                                        tooltip={tool.name + ": " + tool.description}
                                    >
                                        <Link href={tool.href}>
                                            {tool.icon}
                                            <span>{tool.name}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="flex-row md:hidden items-center justify-center">
                <SidebarTrigger/>
                <div className="font-semibold">
                    Close Sidebar
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}
