"use client"

import {useRef, useState, useEffect, forwardRef} from "react"
import {Button, ButtonProps} from "@/components/ui/button"
import {Loader2, Check, X} from "lucide-react"
import {cn} from "@/lib/utils"
import {toast} from "sonner"

type ActionState = "idle" | "loading" | "success" | "error"

export interface ActionButtonProps extends Omit<ButtonProps, "onClick"> {
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => Promise<string | void> | string | void
    successDuration?: number
    errorDuration?: number
    successText?: string
    errorText?: string
}

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
    (
        {
            children,
            onClick,
            disabled = false,
            successDuration = 2000,
            errorDuration = 3000,
            successText,
            errorText,
            className,
            ...props
        },
        ref
    ) => {
        const [state, setState] = useState<ActionState>("idle")
        const timeoutRef = useRef<NodeJS.Timeout | null>(null)

        useEffect(() => {
            return () => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current)
                }
            }
        }, [])

        const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
            if (state === "loading" || disabled) return

            setState("loading")

            try {
                const result = await onClick?.(event)
                setState("success")
                
                const message = result || successText || (typeof children === "string" ? children : "Success")
                toast.success(message)

                timeoutRef.current = setTimeout(() => {
                    setState("idle")
                }, successDuration)
            } catch (error) {
                setState("error")
                
                const message = error instanceof Error ? error.message : errorText || (typeof children === "string" ? children : "Error")
                toast.error(message)

                timeoutRef.current = setTimeout(() => {
                    setState("idle")
                }, errorDuration)
            }
        }

        const isDisabled = disabled || state === "loading" || state === "success"

        const getContent = () => {
            switch (state) {
                case "loading":
                    return (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                        </>
                    )
                case "success":
                    return (
                        <>
                            <Check className="h-4 w-4" />
                        </>
                    )
                case "error":
                    return (
                        <>
                            <X className="h-4 w-4" />
                        </>
                    )
                default:
                    return children
            }
        }

        return (
            <Button
                ref={ref}
                onClick={handleClick}
                disabled={isDisabled}
                className={cn(
                    state === "success" && "bg-green-600 hover:bg-green-600",
                    state === "error" && "bg-destructive hover:bg-destructive",
                    !disabled && "disabled:opacity-100",
                    className
                )}
                {...props}
            >
                {getContent()}
            </Button>
        )
    }
)

ActionButton.displayName = "ActionButton"