"use client"

import * as React from "react"
import {PanelLeft} from "lucide-react"
import {cn} from "@/lib/utils"
import {useSidebar} from "@/components/ui/sidebar"
import {useIsMobile} from "@/hooks/use-mobile"

interface MobileSidebarToggleProps {
    className?: string
}

/**
 * A half-visible round button that attaches to the sidebar for opening/closing on mobile devices.
 * When sidebar is closed: shows chevron right (half-visible from left edge)
 * When sidebar is open: shows chevron left (attached to sidebar edge)
 */
export function MobileSidebarToggle({className}: MobileSidebarToggleProps) {
    const {open, openMobile, toggleSidebar} = useSidebar()
    const isMobile = useIsMobile()

    // Don't render on desktop
    if (!isMobile) {
        return null
    }

    const isOpen = isMobile ? openMobile : open

    const handleButtonClick = () => {
        toggleSidebar()
    }

    return (
        <button
            onClick={handleButtonClick}
            className={cn(
                "fixed z-30 h-8 w-8 rounded-full",
                "bg-primary text-primary-foreground",
                "shadow-lg",
                "flex items-center justify-center",
                "hover:bg-primary/90 active:bg-primary/80",
                "transition-all duration-300 ease-in-out",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isOpen
                    ? "hidden"
                    : "bottom-4 left-4",
                className
            )}
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
            type="button"
        >
            <PanelLeft className="size-4"/>
        </button>
    )
}
