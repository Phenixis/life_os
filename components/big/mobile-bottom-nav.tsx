"use client"

import { Plus, Menu as MenuIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    useTaskModal,
    useNoteModal,
    useDailyMoodModal,
    useRelapseRecorderModal,
    useAddictionCreatorModal,
    useEntryLoggerModal
} from "@/contexts/modal-commands-context"
import DarkModeToggle from "@/components/big/darkMode/dark-mode-toggle"
import DarkModeButton from "@/components/big/darkMode/dark-mode-button"
import { DarkModeCookie } from "@/lib/flags"
import { primaryNavItems, quickActionConfigs } from "@/lib/navigation-data"

interface MobileBottomNavProps {
    darkModeCookie: DarkModeCookie
}

export default function MobileBottomNav({ darkModeCookie }: MobileBottomNavProps) {
    const pathname = usePathname()
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
            setMenuOpen(false)
            modals[config.modalKey].openModal()
        },
    }))

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe lg:hidden">
                <div className="flex items-center justify-around h-16 px-2">
                    {primaryNavItems.map((item) => {
                        const Icon = item.icon
                        const isActive = item.href === "/my"
                            ? pathname === "/my"
                            : pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-lg transition-colors",
                                    isActive
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                )}
                            >
                                <Icon size={24} />
                                <span className="text-xs font-medium">{item.name}</span>
                            </Link>
                        )
                    })}

                    {/* Quick Action Button */}
                    <button
                        onClick={() => setMenuOpen(true)}
                        className="flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    >
                        <div className="relative">
                            <MenuIcon size={24} />
                        </div>
                        <span className="text-xs font-medium">More</span>
                    </button>
                </div>
            </nav>

            {/* Quick Actions Sheet */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
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
                        <DarkModeButton initialCookie={darkModeCookie} />
                        <Link href="/my/settings" onClick={() => setMenuOpen(false)}>
                            <Button
                                variant="ghost"
                                className="w-full justify-start h-12 text-base"
                            >
                                Settings
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            className="w-full justify-start h-12 text-base text-red-600 dark:text-red-400"
                            onClick={() => {
                                setMenuOpen(false)
                                window.location.href = "/api/auth/logout"
                            }}
                        >
                            Log out
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    )
}
