"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import {CircleDollarSign, Palette, Shield, User} from "lucide-react"
import {usePathname} from "next/navigation"

const settingsItems = [
    {
        name: "Profile",
        href: "/my/settings/profile",
        icon: <User className="size-4"/>,
        description: "Manage your personal information"
    },
    {
        name: "Appearance",
        href: "/my/settings/appearance",
        icon: <Palette className="size-4"/>,
        description: "Dark mode and UI preferences"
    },
    {
        name: "Security",
        href: "/my/settings/security",
        icon: <Shield className="size-4"/>,
        description: "Password and security settings"
    },
    {
        name: "Subscription",
        href: "/my/settings/subscription",
        icon: <CircleDollarSign className="size-4"/>,
        description: "Manage your subscription plan"
    }
]

export function SettingsSidebar() {
    const pathname = usePathname()

    return (
        <Sidebar collapsible="icon" variant="floating" className="rounded-full">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Settings</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {settingsItems.map((item) => (
                                <SidebarMenuItem key={item.name}>
                                    <SidebarMenuButton
                                        className={`flex items-center space-x-2 text-wrap ${pathname === item.href ? "bg-gray-200/70 dark:bg-gray-800/70" : ""}`}
                                        asChild
                                        tooltip={item.name + ": " + item.description}
                                    >
                                        <Link href={item.href}>
                                            {item.icon}
                                            <span>{item.name}</span>
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
