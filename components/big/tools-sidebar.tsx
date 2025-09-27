"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
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
        </Sidebar>
    )
}
