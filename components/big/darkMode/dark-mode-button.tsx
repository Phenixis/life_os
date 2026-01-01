"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDarkMode } from "@/hooks/use-dark-mode"
import { DarkModeCookie } from "@/lib/flags"
import { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useAutoDarkModeTimer } from "@/hooks/use-auto-dark-mode-timer"

interface DarkModeButtonProps {
    initialCookie: DarkModeCookie
    className?: string
    variant?: "outline" | "ghost" | "default"
}

export default function DarkModeButton({ 
    initialCookie, 
    className = "w-full justify-start h-12 text-base",
    variant = "outline"
}: DarkModeButtonProps) {
    const [cookie, setCookie] = useState<DarkModeCookie>(initialCookie)
    const [showAutoDarkModeDialog, setShowAutoDarkModeDialog] = useState(false)

    const { darkMode, isLoading, toggleDarkMode, shouldShowAutoDarkModeDialog, updateDarkModeSettings } = useDarkMode()

    // Handle automatic dark mode timer updates
    useAutoDarkModeTimer(cookie, async (newDarkMode: boolean, newCookie: DarkModeCookie) => {
        await updateDarkModeSettings(newCookie, setCookie)
    })

    useEffect(() => {
        if (isLoading || !darkMode) return
        const darkModeActivated = document.documentElement.classList.contains("dark")

        if (darkModeActivated !== darkMode.dark_mode) {
            document.documentElement.classList.toggle("dark", darkMode.dark_mode)
        }

        setCookie(darkMode)
    }, [isLoading, darkMode])

    const handleToggle = async () => {
        // Check if we should show the auto dark mode dialog first
        if (shouldShowAutoDarkModeDialog()) {
            setShowAutoDarkModeDialog(true)
            return
        }

        // Otherwise, simply toggle dark mode
        await toggleDarkMode()
    }

    return (
        <>
            <Button
                variant={variant}
                className={className}
                onClick={handleToggle}
            >
                {cookie.dark_mode ? <Moon size={20} className="mr-2" /> : <Sun size={20} className="mr-2" />}
                <span>Dark Mode</span>
            </Button>

            {!cookie.has_jarvis_asked_dark_mode && (
                <Dialog open={showAutoDarkModeDialog} onOpenChange={setShowAutoDarkModeDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Hi sir, Jarvis Here</DialogTitle>
                            <DialogDescription>
                                It&apos;s getting late. Would you like me to automatically switch to dark mode during certain hours?
                                This can help reduce eye strain in the evening.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                onClick={async () => {
                                    setShowAutoDarkModeDialog(false)
                                    await updateDarkModeSettings(
                                        {
                                            ...cookie,
                                            has_jarvis_asked_dark_mode: true,
                                        },
                                        setCookie
                                    )
                                }}
                            >
                                No thanks
                            </Button>
                            <Button
                                onClick={async () => {
                                    setShowAutoDarkModeDialog(false)
                                    await updateDarkModeSettings(
                                        {
                                            dark_mode: true,
                                            auto_dark_mode: true,
                                            has_jarvis_asked_dark_mode: true,
                                            startHour: 22,
                                            startMinute: 0,
                                            endHour: 8,
                                            endMinute: 0,
                                            override: false
                                        },
                                        setCookie
                                    )
                                }}
                            >
                                Enable Auto Dark Mode
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    )
}
