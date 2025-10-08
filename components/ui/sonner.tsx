"use client";

import {useEffect, useState} from "react"
import {Toaster as Sonner} from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({...props}: ToasterProps) => {
    const [isDark, setIsDark] = useState<boolean>(false)

    useEffect(() => {
        // Initialize based on the current html class
        const html = document.documentElement
        const update = () => setIsDark(html.classList.contains("dark"))
        update()

        // Watch for changes to the html class list
        const observer = new MutationObserver(update)
        observer.observe(html, {attributes: true, attributeFilter: ["class"]})
        return () => observer.disconnect()
    }, [])

    return (
        <Sonner
            // Theme strictly follows the html.dark class
            theme={isDark ? "dark" : "light"}
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