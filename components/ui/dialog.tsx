"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Maximize2, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const DEFAULT_CONTENT_MAX_WIDTH =
  "max-w-[calc(100%-2rem)] sm:max-w-lg lg:max-w-3xl"

const MAC_WINDOW_BUTTON_BASE =
  "ring-offset-background focus-visible:ring-ring focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 flex h-4 w-4 items-center justify-center rounded-full border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_1px_2px_rgba(15,23,42,0.35)] opacity-90 transition-opacity duration-200 hover:opacity-100 disabled:pointer-events-none"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  const toggleExpanded = React.useCallback(() => {
    setIsExpanded((previous) => !previous)
  }, [])

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-expanded={isExpanded ? "true" : undefined}
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 flex w-full h-fit translate-x-[-50%] translate-y-[-50%] rounded-lg border p-6 shadow-lg duration-500",
          isExpanded
            ? "h-full max-h-[95vh] max-w-[95vw]"
            : DEFAULT_CONTENT_MAX_WIDTH,
          className
        )}
        {...props}
      >
        <div className="relative flex w-full flex-col">
          <div className="pointer-events-auto absolute right-0 top-0 flex items-center gap-2">
            {showCloseButton && (
              <>
                <button
                  type="button"
                  onClick={toggleExpanded}
                  aria-pressed={isExpanded}
                  aria-label={isExpanded ? "Restore dialog size" : "Expand dialog"}
                  title={isExpanded ? "Restore" : "Expand"}
                  className={cn(
                    MAC_WINDOW_BUTTON_BASE,
                    "bg-[#2ecc71] hover:bg-[#29c36a] focus-visible:ring-emerald-400 group",
                    isExpanded && "bg-[#27ae60]"
                  )}
                >
                  <Maximize2 className="text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 size-2.5" />
                  <span className="sr-only">
                    {isExpanded ? "Restore dialog size" : "Expand dialog"}
                  </span>
                </button>
                <DialogPrimitive.Close
                  data-slot="dialog-close"
                  className={cn(
                    MAC_WINDOW_BUTTON_BASE,
                    "bg-[#ff5f57] hover:bg-[#ff4941] focus-visible:ring-red-400 group"
                  )}
                >
                  <XIcon className="text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 size-2.5" />
                  <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
              </>
            )}
          </div>
          <div
            className={cn(
              "mx-auto grid w-full h-full gap-4",
              DEFAULT_CONTENT_MAX_WIDTH
            )}
          >
            {children}
          </div>
        </div>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
