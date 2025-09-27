"use client"

import {useCallback, useEffect, useState} from "react"
import {Moon, Sun} from "lucide-react"
import {cn} from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {type DarkModeCookie} from "@/lib/flags"
import {useDarkMode} from "@/hooks/use-dark-mode"
import {useAutoDarkModeTimer} from "@/hooks/use-auto-dark-mode-timer"

export default function DarkModeToggle({
                                           className,
                                           initialCookie,
                                       }: {
    initialCookie: DarkModeCookie
    className?: string
}) {
    const [cookie, setCookie] = useState<DarkModeCookie>(initialCookie)
    const [showAutoDarkModeDialog, setShowAutoDarkModeDialog] = useState(false)

    const {darkMode, isLoading, toggleDarkMode, shouldShowAutoDarkModeDialog, updateDarkModeSettings} = useDarkMode()

    // Handle automatic dark mode timer updates
    useAutoDarkModeTimer(cookie, async (newDarkMode: boolean, newCookie: DarkModeCookie) => {
        await updateDarkModeSettings(newCookie, setCookie)
    })

    useEffect(() => {
        if (isLoading || !darkMode) return
        const darkModeActivated = document.documentElement.classList.contains("dark")

        if (darkModeActivated !== darkMode.dark_mode) {
            document.documentElement.classList.toggle("dark", darkMode.dark_mode) // Match the actual dark mode with the database state
        }

        setCookie(darkMode)
    }, [isLoading, darkMode])

    const handleKeyboardToggle = useCallback(async (e: KeyboardEvent) => {
        if (e.key === "m" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()

            // Check if we should show the auto dark mode dialog first
            if (shouldShowAutoDarkModeDialog()) {
                setShowAutoDarkModeDialog(true)
                return
            }

            // Otherwise, simply toggle dark mode
            await toggleDarkMode()
            setCookie({
                ...cookie,
                dark_mode: !cookie.dark_mode,
            })
        }
    }, [shouldShowAutoDarkModeDialog, toggleDarkMode, cookie])

    useEffect(() => {
        document.addEventListener("keydown", handleKeyboardToggle)
        return () => document.removeEventListener("keydown", handleKeyboardToggle)
    }, [handleKeyboardToggle])

    return (
        <div>
            <div
                onClick={async () => {
                    // Check if we should show the auto dark mode dialog first
                    if (shouldShowAutoDarkModeDialog()) {
                        setShowAutoDarkModeDialog(true)
                        return
                    }

                    // Otherwise, simply toggle dark mode
                    await toggleDarkMode()
                }}
                role="button"
                aria-label={cookie.dark_mode ? "Switch to light mode" : "Switch to dark mode"}
                className={cn(
                    "lg:hover:rotate-46 duration-1000 flex align-middle relative transition-all text-neutral-800 lg:hover:text-neutral-500 dark:text-neutral-200 dark:lg:hover:text-neutral-500 cursor-pointer",
                    className,
                )}
            >
                {cookie.dark_mode ? <Moon/> : <Sun/>}
            </div>

            {!cookie.has_jarvis_asked_dark_mode && (
                <Dialog open={showAutoDarkModeDialog} onOpenChange={setShowAutoDarkModeDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Hi sir, Jarvis Here</DialogTitle>
                            <DialogDescription>
                                It&apos;s getting late.
                                <br/>
                                <br/>
                                Do you want me to automatically turn on dark mode
                                between {cookie.startHour < 10 ? "0" + cookie.startHour : cookie.startHour}:{cookie.startMinute < 10 ? "0" + cookie.startMinute : cookie.startMinute} and {cookie.endHour}:
                                {cookie.endMinute < 10 && "0"}
                                {cookie.startMinute}?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="secondary"
                                size="default"
                                onClick={async () => {
                                    setShowAutoDarkModeDialog(false)
                                    const newCookie = {
                                        ...cookie,
                                        has_jarvis_asked_dark_mode: true,
                                        auto_dark_mode: false,
                                        dark_mode: false,
                                        override: false
                                    }
                                    await updateDarkModeSettings(newCookie, setCookie)
                                }}
                                className=""
                            >
                                No
                            </Button>
                            <Button
                                variant="default"
                                size="default"
                                onClick={async () => {
                                    setShowAutoDarkModeDialog(false)
                                    const newCookie = {
                                        ...cookie,
                                        has_jarvis_asked_dark_mode: true,
                                        auto_dark_mode: true,
                                        dark_mode: true,
                                        override: false
                                    }
                                    await updateDarkModeSettings(newCookie, setCookie)
                                }}
                                className=""
                            >
                                Yes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
