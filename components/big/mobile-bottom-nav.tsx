"use client"

import DarkModeButton from "@/components/big/darkMode/dark-mode-button"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    useAddictionCreatorModal,
    useDailyMoodModal,
    useEntryLoggerModal,
    useNoteModal,
    useRelapseRecorderModal,
    useTaskModal
} from "@/contexts/modal-commands-context"
import { DarkModeCookie } from "@/lib/flags"
import { quickActionConfigs } from "@/lib/navigation-data"
import { isToolsCategorie, tools } from "@/lib/tools-data"
import { cn } from "@/lib/utils"
import { Home, FileText, Plus, Wrench, Menu as MenuIcon, Settings as SettingsIcon, LogOut, PanelsTopLeft, LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, ReactNode } from "react"
import { settingsItems } from "@/components/big/settings/settings-sidebar"

interface MobileBottomNavProps {
    darkModeCookie: DarkModeCookie
}

export default function MobileBottomNav({ darkModeCookie }: MobileBottomNavProps) {
    const pathname = usePathname()
    const [quickActionsOpen, setQuickActionsOpen] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)

    // Modal hooks
    const modals = {
        task: useTaskModal(),
        note: useNoteModal(),
        dailyMood: useDailyMoodModal(),
        relapseRecorder: useRelapseRecorderModal(),
        addictionCreator: useAddictionCreatorModal(),
        entryLogger: useEntryLoggerModal(),
    }

    const quickActions = quickActionConfigs.map((config) => ({
        name: config.name,
        action: () => {
            setQuickActionsOpen(false)
            modals[config.modalKey].openModal()
        },
    }))

    // All menu links organized by sections
    const menuSections: Array<{
        title: string
        items: Array<{
            name: string
            href: string
            IconComponent?: LucideIcon | ReactNode
            isReactNode: boolean
        }>
    }> = [
        {
            title: "Main",
            items: [
                { name: "Home", href: "/my", IconComponent: Home, isReactNode: false },
                { name: "Notes", href: "/my/notes", IconComponent: FileText, isReactNode: false },
                { name: "Projects", href: "/my/projects", IconComponent: PanelsTopLeft, isReactNode: false },
                { name: "Tools", href: "/my/tools", IconComponent: Wrench, isReactNode: false },
            ]
        },
        {
            title: "Tools",
            items: tools.flatMap(tool => {
                if (isToolsCategorie(tool)) {
                    return tool.tools.map((t) => ({
                        name: t.name,
                        href: t.href,
                        IconComponent: t.icon,
                        isReactNode: true,
                    }))
                }
                return {
                    name: tool.name,
                    href: tool.href,
                    IconComponent: tool.icon,
                    isReactNode: true,
                }
            })
        },
        {
            title: "Settings",
            items: [
                { name: "Settings", href: "/my/settings", IconComponent: SettingsIcon, isReactNode: false },
                ...settingsItems.map(item => ({
                    name: item.name,
                    href: item.href,
                    IconComponent: item.icon,
                    isReactNode: true,
                }))
            ]
        }
    ]

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe lg:hidden">
                <div className="flex items-center justify-around h-16 px-2">
                    {/* Home */}
                    <Link
                        href="/my"
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-lg transition-colors",
                            pathname === "/my"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        )}
                    >
                        <Home size={22} />
                        <span className="text-xs font-medium">Home</span>
                    </Link>

                    {/* Notes */}
                    <Link
                        href="/my/notes"
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-lg transition-colors",
                            pathname.startsWith("/my/notes")
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        )}
                    >
                        <FileText size={22} />
                        <span className="text-xs font-medium">Notes</span>
                    </Link>

                    {/* Center Plus Button - Bigger */}
                    <button
                        onClick={() => setQuickActionsOpen(true)}
                        className="flex items-center justify-center -mt-4 w-16 h-16 rounded-full bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-lg"
                    >
                        <Plus size={28} className="text-white" strokeWidth={2.5} />
                    </button>

                    {/* Tools */}
                    <Link
                        href="/my/tools"
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-lg transition-colors",
                            pathname.startsWith("/my/tools")
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        )}
                    >
                        <Wrench size={22} />
                        <span className="text-xs font-medium">Tools</span>
                    </Link>

                    {/* Menu */}
                    <button
                        onClick={() => setMenuOpen(true)}
                        className="flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    >
                        <MenuIcon size={22} />
                        <span className="text-xs font-medium">Menu</span>
                    </button>
                </div>
            </nav>

            {/* Quick Actions Sheet */}
            <Sheet open={quickActionsOpen} onOpenChange={setQuickActionsOpen}>
                <SheetContent side="bottom" className="h-auto rounded-t-2xl">
                    <SheetHeader>
                        <SheetTitle>Quick Actions</SheetTitle>
                    </SheetHeader>
                    <div className="grid gap-2 py-4">
                        {quickActions.map((action) => (
                            <Button
                                key={action.name}
                                onClick={action.action}
                                variant="outline"
                                className="w-full justify-start h-12 text-base"
                            >
                                <Plus size={20} className="mr-2" />
                                {action.name}
                            </Button>
                        ))}
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                            <DarkModeButton initialCookie={darkModeCookie} />
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Full Menu Sheet */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
                    <SheetHeader>
                        <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-6 py-4 overflow-y-auto h-[calc(85vh-80px)]">
                        {menuSections.map((section) => (
                            <div key={section.title}>
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">
                                    {section.title}
                                </h3>
                                <div className="grid gap-1">
                                    {section.items.map((item) => {
                                        const Icon = item.IconComponent
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setMenuOpen(false)}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-start h-11 text-base"
                                                >
                                                    {Icon && (
                                                        item.isReactNode ? (
                                                            <span className="mr-2">{Icon as ReactNode}</span>
                                                        ) : (
                                                            typeof Icon === 'function' && <Icon size={18} className="mr-2" />
                                                        )
                                                    )}
                                                    <span className="truncate">
                                                        {item.name}
                                                    </span>
                                                </Button>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Logout at the bottom */}
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                            <Button
                                variant="ghost"
                                className="w-full justify-start h-12 text-base text-red-600 dark:text-red-400"
                                onClick={() => {
                                    setMenuOpen(false)
                                    window.location.href = "/api/auth/logout"
                                }}
                            >
                                <LogOut size={18} className="mr-2" />
                                Log out
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    )
}
