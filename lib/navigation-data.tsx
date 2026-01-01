import { Home, FileText, Wrench, type LucideIcon } from "lucide-react"

export interface NavItem {
    name: string
    href: string
    icon: LucideIcon
    alternativeNames?: string[]
}

export interface QuickActionConfig {
    name: string
    modalKey: "task" | "note" | "dailyMood" | "relapseRecorder" | "addictionCreator" | "entryLogger"
    alternativeNames?: string[]
}

// Primary navigation items for mobile bottom nav
export const primaryNavItems: NavItem[] = [
    {
        name: "Home",
        href: "/my",
        icon: Home,
        alternativeNames: ["dashboard", "home"],
    },
    {
        name: "Notes",
        href: "/my/notes",
        icon: FileText,
        alternativeNames: ["note"],
    },
    {
        name: "Tools",
        href: "/my/tools",
        icon: Wrench,
        alternativeNames: ["tool"],
    },
]

// Quick actions available in both menu and mobile nav
export const quickActionConfigs: QuickActionConfig[] = [
    {
        name: "Create Task",
        modalKey: "task",
        alternativeNames: ["new task", "add task"],
    },
    {
        name: "Create Note",
        modalKey: "note",
        alternativeNames: ["new note", "add note"],
    },
    {
        name: "Log Mood",
        modalKey: "dailyMood",
        alternativeNames: ["mood", "daily mood", "enter mood"],
    },
    {
        name: "Record Relapse",
        modalKey: "relapseRecorder",
        alternativeNames: ["relapse", "addiction", "record relapse"],
    },
    {
        name: "Create Addiction",
        modalKey: "addictionCreator",
        alternativeNames: ["addiction", "create addiction", "new addiction", "add addiction"],
    },
    {
        name: "Log Journal Entry",
        modalKey: "entryLogger",
        alternativeNames: ["journal", "entry", "log entry", "addiction journal"],
    },
]
