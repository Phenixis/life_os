"use client"

import DarkModeButton from "@/components/big/darkMode/dark-mode-button"
import { settingsItems } from "@/components/big/settings/settings-sidebar"
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
import { FileText, Home, Loader2, LogOut, LucideIcon, Menu as MenuIcon, PanelsTopLeft, Plus, Settings as SettingsIcon, Wrench } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { ReactNode, useState, useTransition } from "react"

interface MobileBottomNavProps {
    darkModeCookie: DarkModeCookie
}

export default function MobileBottomNav({ darkModeCookie }: MobileBottomNavProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [quickActionsOpen, setQuickActionsOpen] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [loadingPath, setLoadingPath] = useState<string | null>(null)

    const handleNavigation = (path: string) => {
        setLoadingPath(path)
        startTransition(() => {
            router.push(path)
        })
    }

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
        icon: config.icon,
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
                    <Button
                        onClick={() => handleNavigation("/my")}
                        variant={pathname === "/my" ? "default" : "ghost"}
                        size='sm'
                        className="flex flex-col items-center justify-center gap-1 h-full rounded-lg transition-colors"
                    >
                        {isPending && loadingPath === "/my" ? (
                            <Loader2 size={22} className="animate-spin" />
                        ) : (
                            <Home size={22} />
                        )}
                        <span className="text-xs font-medium">Home</span>
                    </Button>

                    {/* Notes */}
                    <Button
                        onClick={() => handleNavigation("/my/notes")}
                        variant={pathname.startsWith("/my/notes") ? "default" : "ghost"}
                        size='sm'
                        className="flex flex-col items-center justify-center gap-1 h-full rounded-lg transition-colors"
                    >
                        {isPending && loadingPath === "/my/notes" ? (
                            <Loader2 size={22} className="animate-spin" />
                        ) : (
                            <FileText size={22} />
                        )}
                        <span className="text-xs font-medium">Notes</span>
                    </Button>

                    {/* Center Plus Button - Bigger */}
                    <Button
                        onClick={() => setQuickActionsOpen(true)}
                        className="flex items-center justify-center -mt-4 w-16 h-16 rounded-full bg-black lg:hover:bg-gray-800 transition-colors shadow-lg"
                    >
                        <Plus size={28} className="text-white" strokeWidth={2.5} />
                    </Button>

                    {/* Tools */}
                    <Button
                        onClick={() => handleNavigation("/my/tools")}
                        variant={pathname.startsWith("/my/tools") ? "default" : "ghost"}
                        size='sm'
                        className="flex flex-col items-center justify-center gap-1 h-full rounded-lg transition-colors"
                    >
                        {isPending && loadingPath === "/my/tools" ? (
                            <Loader2 size={22} className="animate-spin" />
                        ) : (
                            <Wrench size={22} />
                        )}
                        <span className="text-xs font-medium">Tools</span>
                    </Button>

                    {/* Menu */}
                    <Button
                        onClick={() => setMenuOpen(true)}
                        variant="ghost"
                        size='sm'
                        className="flex flex-col items-center justify-center gap-1 h-full rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    >
                        <MenuIcon size={22} />
                        <span className="text-xs font-medium">Menu</span>
                    </Button>
                </div>
            </nav>

            {/* Quick Actions Sheet */}
            <Sheet open={quickActionsOpen} onOpenChange={setQuickActionsOpen}>
                <SheetContent side="bottom" className="h-auto rounded-t-2xl">
                    <SheetHeader>
                        <SheetTitle>Quick Actions</SheetTitle>
                    </SheetHeader>
                    <div className="grid grid-cols-3 gap-2 py-4">
                        {quickActions.map((action) => (
                            <Button
                                key={action.name}
                                onClick={action.action}
                                variant="outline"
                                className="w-full text-sm flex flex-col items-center h-24"
                            >
                                {
                                    action.icon !== undefined ?
                                        <action.icon size={20} className="mb-2" /> :
                                        <Plus size={20} className="mb-2" />
                                }
                                <span className="block w-full text-wrap text-center">
                                    {action.name}
                                </span>
                            </Button>
                        ))}
                        <DarkModeButton initialCookie={darkModeCookie} className="text-sm flex flex-col items-center h-24" />
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
                                            <Button
                                                key={item.href}
                                                variant="ghost"
                                                className="w-full justify-start h-11 text-base"
                                                onClick={() => {
                                                    setMenuOpen(false)
                                                    handleNavigation(item.href)
                                                }}
                                            >
                                                {isPending && loadingPath === item.href ? (
                                                    <Loader2 size={18} className="mr-2 animate-spin" />
                                                ) : Icon ? (
                                                    item.isReactNode ? (
                                                        <span className="mr-2">{Icon as ReactNode}</span>
                                                    ) : (
                                                        (() => {
                                                            const IconComponent = Icon as LucideIcon
                                                            return <IconComponent size={18} className="mr-2" />
                                                        })()
                                                    )
                                                ) : null}
                                                <span className="truncate">
                                                    {item.name}
                                                </span>
                                            </Button>
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
