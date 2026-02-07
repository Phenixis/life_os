"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

// Context to share isMobile state across all sub-components
const ResponsiveModalContext = React.createContext<boolean | undefined>(undefined)

function useResponsiveModalContext() {
    const context = React.useContext(ResponsiveModalContext)
    if (context === undefined) {
        throw new Error("ResponsiveModal sub-components must be used within ResponsiveModal")
    }
    return context
}

interface ResponsiveModalProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children?: React.ReactNode
}

function ResponsiveModal({ open, onOpenChange, children }: ResponsiveModalProps) {
    const isMobile = useIsMobile()

    return (
        <ResponsiveModalContext.Provider value={isMobile}>
            {isMobile ? (
                <Sheet open={open} onOpenChange={onOpenChange}>
                    {children}
                </Sheet>
            ) : (
                <Dialog open={open} onOpenChange={onOpenChange}>
                    {children}
                </Dialog>
            )}
        </ResponsiveModalContext.Provider>
    )
}

function ResponsiveModalTrigger({ children, ...props }: React.ComponentProps<typeof DialogTrigger>) {
    const isMobile = useResponsiveModalContext()

    if (isMobile) {
        return <SheetTrigger {...props}>{children}</SheetTrigger>
    }

    return <DialogTrigger {...props}>{children}</DialogTrigger>
}

interface ResponsiveModalContentProps extends React.ComponentProps<typeof DialogContent> {
    /** Drawer position on mobile devices only. Has no effect on desktop. */
    side?: "top" | "bottom" | "left" | "right"
    /** Additional className applied only on mobile (<768px) */
    mobileClassName?: string
    /** Additional className applied only on desktop (≥768px) */
    desktopClassName?: string
}

function ResponsiveModalContent({ 
    children, 
    className,
    mobileClassName,
    desktopClassName,
    showCloseButton = true,
    maxHeight,
    side = "bottom",
    ...props 
}: ResponsiveModalContentProps) {
    const isMobile = useResponsiveModalContext()

    if (isMobile) {
        return (
            <SheetContent 
                side={side} 
                className={cn(className, mobileClassName)}
                showCloseButton={showCloseButton}
                {...props}
            >
                {children}
            </SheetContent>
        )
    }

    // maxHeight only applies to desktop Dialog
    return (
        <DialogContent 
            className={cn(className, desktopClassName)}
            showCloseButton={showCloseButton}
            maxHeight={maxHeight}
            {...props}
        >
            {children}
        </DialogContent>
    )
}

function ResponsiveModalHeader({ 
    children, 
    className, 
    mobileClassName, 
    desktopClassName, 
    ...props 
}: React.ComponentProps<typeof DialogHeader> & { 
    /** Additional className applied only on mobile (<768px) */
    mobileClassName?: string
    /** Additional className applied only on desktop (≥768px) */
    desktopClassName?: string 
}) {
    const isMobile = useResponsiveModalContext()

    if (isMobile) {
        return <SheetHeader className={cn(className, mobileClassName)} {...props}>{children}</SheetHeader>
    }

    return <DialogHeader className={cn(className, desktopClassName)} {...props}>{children}</DialogHeader>
}

function ResponsiveModalFooter({ 
    children, 
    className, 
    mobileClassName, 
    desktopClassName, 
    ...props 
}: React.ComponentProps<typeof DialogFooter> & { 
    /** Additional className applied only on mobile (<768px) */
    mobileClassName?: string
    /** Additional className applied only on desktop (≥768px) */
    desktopClassName?: string 
}) {
    const isMobile = useResponsiveModalContext()

    if (isMobile) {
        return <SheetFooter className={cn(className, mobileClassName)} {...props}>{children}</SheetFooter>
    }

    return <DialogFooter className={cn(className, desktopClassName)} {...props}>{children}</DialogFooter>
}

function ResponsiveModalTitle({ 
    children, 
    className, 
    mobileClassName, 
    desktopClassName, 
    ...props 
}: React.ComponentProps<typeof DialogTitle> & { 
    /** Additional className applied only on mobile (<768px) */
    mobileClassName?: string
    /** Additional className applied only on desktop (≥768px) */
    desktopClassName?: string 
}) {
    const isMobile = useResponsiveModalContext()

    if (isMobile) {
        return <SheetTitle className={cn(className, mobileClassName)} {...props}>{children}</SheetTitle>
    }

    return <DialogTitle className={cn(className, desktopClassName)} {...props}>{children}</DialogTitle>
}

function ResponsiveModalDescription({ 
    children, 
    className, 
    mobileClassName, 
    desktopClassName, 
    ...props 
}: React.ComponentProps<typeof DialogDescription> & { 
    /** Additional className applied only on mobile (<768px) */
    mobileClassName?: string
    /** Additional className applied only on desktop (≥768px) */
    desktopClassName?: string 
}) {
    const isMobile = useResponsiveModalContext()

    if (isMobile) {
        return <SheetDescription className={cn(className, mobileClassName)} {...props}>{children}</SheetDescription>
    }

    return <DialogDescription className={cn(className, desktopClassName)} {...props}>{children}</DialogDescription>
}

function ResponsiveModalClose({ children, ...props }: React.ComponentProps<typeof DialogClose>) {
    const isMobile = useResponsiveModalContext()

    if (isMobile) {
        return <SheetClose {...props}>{children}</SheetClose>
    }

    return <DialogClose {...props}>{children}</DialogClose>
}

export {
    ResponsiveModal,
    ResponsiveModalTrigger,
    ResponsiveModalContent,
    ResponsiveModalHeader,
    ResponsiveModalFooter,
    ResponsiveModalTitle,
    ResponsiveModalDescription,
    ResponsiveModalClose,
}
