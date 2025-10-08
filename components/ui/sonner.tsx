"use client";

import {useTheme} from "next-themes"
import {Toaster as Sonner} from "sonner"
import {useDarkMode} from "@/hooks/use-dark-mode";

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({...props}: ToasterProps) => {
    const {theme = "system"} = useTheme()
    const {darkMode} = useDarkMode()

    return (
        <Sonner
            theme={(darkMode ? (darkMode.dark_mode ? "dark" : "light") : theme) as ToasterProps["theme"]}
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton:
                        "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton:
                        "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                },
            }}
            {...props}
        />
    )
}

export {Toaster}
