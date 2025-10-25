"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface AutoExpandingTextareaProps
    extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "rows"> {
    minRows?: number
    maxRows?: number
}

const AutoExpandingTextarea = React.forwardRef<
    HTMLTextAreaElement,
    AutoExpandingTextareaProps
>(({ className, minRows = 1, maxRows = 5, value, onChange, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    const [rows, setRows] = React.useState(minRows)

    React.useImperativeHandle(ref, () => textareaRef.current!)

    const adjustHeight = React.useCallback(() => {
        const textarea = textareaRef.current
        if (!textarea) return

        // Reset height to auto to get the actual scroll height
        textarea.style.height = 'auto'
        
        // Calculate the number of lines based on scroll height and line height
        const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight)
        const paddingTop = parseInt(window.getComputedStyle(textarea).paddingTop)
        const paddingBottom = parseInt(window.getComputedStyle(textarea).paddingBottom)
        
        const contentHeight = textarea.scrollHeight - paddingTop - paddingBottom
        const newRows = Math.max(minRows, Math.min(maxRows, Math.ceil(contentHeight / lineHeight)))
        
        setRows(newRows)
        
        // Set the height explicitly to prevent jumping
        textarea.style.height = `${textarea.scrollHeight}px`
    }, [minRows, maxRows])

    React.useEffect(() => {
        adjustHeight()
    }, [value, adjustHeight])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange?.(e)
        // Delay height adjustment to next tick to ensure value is updated
        setTimeout(adjustHeight, 0)
    }

    return (
        <textarea
            className={cn(
                "flex min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden transition-all duration-200",
                className
            )}
            ref={textareaRef}
            rows={rows}
            value={value}
            onChange={handleChange}
            {...props}
        />
    )
})

AutoExpandingTextarea.displayName = "AutoExpandingTextarea"

export { AutoExpandingTextarea }
