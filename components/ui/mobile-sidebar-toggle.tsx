"use client"

import * as React from "react"
import {PanelLeft} from "lucide-react"
import {cn} from "@/lib/utils"
import {useSidebar} from "@/components/ui/sidebar"
import {useIsMobile} from "@/hooks/use-mobile"
import {Button} from "@/components/ui/button"
import {useSwipeToOpen} from "@/hooks/use-swipe-to-open"

interface MobileSidebarToggleProps {
    className?: string
}

/**
 * A half-visible round button that attaches to the sidebar for opening/closing on mobile devices.
 * When sidebar is closed: shows chevron right (half-visible from left edge)
 * When sidebar is open: shows chevron left (attached to sidebar edge)
 */
export function MobileSidebarToggle({className}: MobileSidebarToggleProps) {
    const {open, openMobile, toggleSidebar, setOpenMobile} = useSidebar()
    const isMobile = useIsMobile()

    const isOpen = isMobile ? openMobile : open

    // Swipe gesture detection for opening sidebar
    useSwipeToOpen({
        isOpen: openMobile,
        onOpen: () => setOpenMobile(true),
        isEnabled: isMobile,
    })

    // Don't render on desktop
    if (!isMobile) {
        return null
    }

    const handleButtonClick = () => {
        toggleSidebar()
    }

    return (
        <Button
            onClick={handleButtonClick}
            size="sm"
            variant="outline"
            className={cn(
                "fixed z-30 shadow-md bg-background/95 backdrop-blur",
                isOpen
                    ? "hidden"
                    : "bottom-20 left-4",
                className
            )}
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
            <PanelLeft className="size-4"/>
        </Button>
    )
}
