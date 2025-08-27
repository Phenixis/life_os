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
    SidebarTrigger,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { User, Palette, Shield, CircleDollarSign } from "lucide-react"
import { usePathname } from "next/navigation"

const settingsItems = [
    {
        name: "Profile",
        href: "/my/settings/profile",
        icon: <User className="size-4" />,
        description: "Manage your personal information"
    },
    {
        name: "Appearance",
        href: "/my/settings/appearance",
        icon: <Palette className="size-4" />,
        description: "Dark mode and UI preferences"
    },
    {
        name: "Security",
        href: "/my/settings/security",
        icon: <Shield className="size-4" />,
        description: "Password and security settings"
    },
    {
        name: "Subscription",
        href: "/my/settings/subscription",
        icon: <CircleDollarSign className="size-4" />,
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
                                        className={`flex items-center space-x-2 text-wrap ${pathname === item.href ? "bg-gray-200/70" : ""}`}
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
            <SidebarFooter className="flex-row md:hidden items-center justify-center">
                <SidebarTrigger />
                <div className="font-semibold">
                    Close Sidebar
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}
