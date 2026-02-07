"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
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
    side?: "top" | "bottom" | "left" | "right"
}

function ResponsiveModalContent({ 
    children, 
    className,
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
                className={className}
                showCloseButton={showCloseButton}
                {...props}
            >
                {children}
            </SheetContent>
        )
    }

    return (
        <DialogContent 
            className={className}
            showCloseButton={showCloseButton}
            maxHeight={maxHeight}
            {...props}
        >
            {children}
        </DialogContent>
    )
}

function ResponsiveModalHeader({ children, className, ...props }: React.ComponentProps<typeof DialogHeader>) {
    const isMobile = useResponsiveModalContext()

    if (isMobile) {
        return <SheetHeader className={className} {...props}>{children}</SheetHeader>
    }

    return <DialogHeader className={className} {...props}>{children}</DialogHeader>
}

function ResponsiveModalFooter({ children, className, ...props }: React.ComponentProps<typeof DialogFooter>) {
    const isMobile = useResponsiveModalContext()

    if (isMobile) {
        return <SheetFooter className={className} {...props}>{children}</SheetFooter>
    }

    return <DialogFooter className={className} {...props}>{children}</DialogFooter>
}

function ResponsiveModalTitle({ children, className, ...props }: React.ComponentProps<typeof DialogTitle>) {
    const isMobile = useResponsiveModalContext()

    if (isMobile) {
        return <SheetTitle className={className} {...props}>{children}</SheetTitle>
    }

    return <DialogTitle className={className} {...props}>{children}</DialogTitle>
}

function ResponsiveModalDescription({ children, className, ...props }: React.ComponentProps<typeof DialogDescription>) {
    const isMobile = useResponsiveModalContext()

    if (isMobile) {
        return <SheetDescription className={className} {...props}>{children}</SheetDescription>
    }

    return <DialogDescription className={className} {...props}>{children}</DialogDescription>
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
