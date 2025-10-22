"use client"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandShortcut,
} from "@/components/ui/command"
import {MenuIcon} from "lucide-react"
import {useCallback, useEffect, useState} from "react"
import {Button} from "@/components/ui/button"
import {useRouter} from "next/navigation"
import {useDarkMode} from "@/hooks/use-dark-mode"
import {useDailyMoodModal, useNoteModal, useTaskModal} from "@/contexts/modal-commands-context"
import {tools} from "@/lib/tools-data"
import {toast} from "sonner"
import {settingsItems} from "@/components/big/settings/settings-sidebar"

interface MenuItem {
    name: string
    href: string
    alternativeNames?: string[]
}

const items: Record<string, MenuItem[]> = {
    "Suggestions": [
        {name: "Dashboard", href: "/my", alternativeNames: ["home", "overview"]},
        {name: "Notes", href: "/my/notes", alternativeNames: ["note", "write", "notebook"]},
        {name: "Tasks", href: "/my/tasks", alternativeNames: ["task", "todo", "to-do", "todos"]},
    ],
    "Tools": tools.map(tool => ({
        name: tool.name,
        href: tool.href,
        alternativeNames: tool.alternativeNames,
    })),
    "Settings": [
        {
            name: "Settings",
            href: "/settings",
            alternativeNames: ["preferences", "configuration", "options"],
        },
        ...settingsItems.map(item => ({
            name: item.name,
            href: item.href,
            alternativeNames: item.alternativeNames,
        }))
    ],
}

export default function Menu() {
    const router = useRouter()
    const [open, setOpen] = useState(false)

    const {toggleDarkMode} = useDarkMode()
    const taskModal = useTaskModal()
    const noteModal = useNoteModal()
    const dailyMoodModal = useDailyMoodModal()

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const runCommand = useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    return (
        <>
            <Button onClick={() => setOpen(true)} variant="outline" size="icon"
                    className="whitespace-nowrap transition-transform duration-300" tooltip="Open menu (Ctrl/⌘+K)">
                <MenuIcon size={24}/>
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen} showCloseButton={false}>
                <CommandInput placeholder="Type a command or search..."/>
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    {
                        Object.entries(items).map(([groupName, groupItems]) => (
                            <CommandGroup key={groupName} heading={groupName}>
                                {groupItems.map((item) => (
                                    <CommandItem
                                        key={item.name}
                                        onSelect={() => runCommand(() => router.push(item.href))}
                                        keywords={item.alternativeNames}
                                    >
                                        {item.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))
                    }
                    <CommandGroup heading="Commands">
                        <CommandItem
                            onSelect={() => runCommand(() => toggleDarkMode())}
                            keywords={["theme", "appearance", "light", "dark"]}
                        >
                            Toggle Dark Mode
                            <CommandShortcut>Ctrl/⌘ + M</CommandShortcut>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => taskModal.openModal())}
                            keywords={["new task", "add task", "task", "todo"]}
                        >
                            Create a task
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => noteModal.openModal())}
                            keywords={["new note", "add note", "note", "write"]}
                        >
                            Create a note
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => dailyMoodModal.openModal())}
                            keywords={["mood", "feeling", "emotion", "daily"]}
                        >
                            Enter my mood
                        </CommandItem>
                        <CommandItem
                            onSelect={() => {
                                toast.loading("Logging out...", {
                                    id: "logout"
                                })
                                setOpen(false)
                                window.location.href = "/api/auth/logout"
                            }}
                            keywords={["sign out", "exit", "logout"]}
                        >
                            Log out
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    )
}