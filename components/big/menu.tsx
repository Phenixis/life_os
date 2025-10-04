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
import { MenuIcon } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useDarkMode } from "@/hooks/use-dark-mode"
import { useTaskModal, useNoteModal, useDailyMoodModal } from "@/contexts/modal-commands-context"
import { tools } from "@/lib/tools-data"
import { toast } from "sonner"

const items = {
    "Suggestions": [
        { name: "Dashboard", href: "/my" },
        { name: "Notes", href: "/my/notes" },
        { name: "Tasks", href: "/my/tasks" },
    ],
    "Tools": tools.map(tool => ({
        name: tool.name,
        href: tool.href,
    })),
    "Settings": [
        { name: "Settings", href: "/my/settings" },
        { name: "Profile", href: "/my/settings/profile" },
        { name: "Appearance", href: "/my/settings/appearance" },
        { name: "Security", href: "/my/settings/security" },
    ],
}

export default function Menu() {
    const router = useRouter()
    const [open, setOpen] = useState(false)

    const { toggleDarkMode } = useDarkMode()
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
            <Button onClick={() => setOpen(true)} variant="outline" size="icon" className="whitespace-nowrap transition-transform duration-300" tooltip="Open menu (Ctrl/⌘+K)">
                <MenuIcon size={24} />
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen} showCloseButton={false} >
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    {
                        Object.entries(items).map(([groupName, groupItems]) => (
                            <CommandGroup key={groupName} heading={groupName}>
                                {groupItems.map((item) => (
                                    <CommandItem
                                        key={item.name}
                                        onSelect={() => runCommand(() => router.push(item.href))}
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
                        >
                            Toggle Dark Mode
                            <CommandShortcut>Ctrl/⌘ + M</CommandShortcut>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => taskModal.openModal())}
                        >
                            Create a task
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => noteModal.openModal())}
                        >
                            Create a note
                        </CommandItem>
                        <CommandItem
                            onSelect={() => runCommand(() => dailyMoodModal.openModal())}
                        >
                            Enter my mood
                        </CommandItem>
                        <CommandItem
                            onSelect={() => {
                                toast.loading("Logging out...", {
                                    id: "logout"
                                })
                                runCommand(() => router.push("/api/auth/logout"))
                            }}
                        >
                            Log out
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog >
        </>
    )
}