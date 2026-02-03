import * as React from "react"
import {Slot} from "@radix-ui/react-slot"
import {cva, type VariantProps} from "class-variance-authority"

import {cn} from "@/lib/utils"

import {Tooltip, TooltipContent, TooltipTrigger,} from "@/components/ui/tooltip"
import {Loader2, Check, X} from "lucide-react"

const buttonVariants = cva(
    "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground lg:hover:bg-primary/70",
                destructive:
                    "bg-destructive text-destructive-foreground lg:hover:bg-destructive/90",
                outline:
                    "border border-input bg-background lg:hover:bg-accent lg:hover:text-accent-foreground",
                secondary:
                    "bg-secondary text-secondary-foreground lg:hover:bg-secondary/80",
                ghost: "lg:hover:bg-accent lg:hover:text-accent-foreground",
                link: "text-primary underline-offset-4 lg:hover:underline",
                "ghost-destructive":
                    "lg:hover:bg-destructive/20 lg:hover:text-destructive-foreground"
            },
            size: {
                default: "h-10 px-4 py-2 text-sm",
                sm: "h-9 rounded-md px-3 text-xs",
                lg: "h-11 rounded-md px-8 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean,
    tooltip?: string,
    loading?: boolean,
    success?: boolean,
    error?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({className, variant, size, asChild = false, tooltip, loading, success, error, children, disabled, ...props}, ref) => {
        const Comp = asChild ? Slot : "button"
        
        const getContent = () => {
            if (loading) {
                return <Loader2 className="h-4 w-4 animate-spin" />
            }
            if (success) {
                return <Check className="h-4 w-4" />
            }
            if (error) {
                return <X className="h-4 w-4" />
            }
            return children
        }
        
        const isDisabled = disabled || loading || success
        
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Comp
                        className={cn(
                            buttonVariants({variant, size, className}),
                            success && "bg-green-600 hover:bg-green-600",
                            error && "bg-destructive hover:bg-destructive",
                            !disabled && "disabled:opacity-100"
                        )}
                        ref={ref}
                        disabled={isDisabled}
                        {...props}
                    >
                        {getContent()}
                    </Comp>
                </TooltipTrigger>
                {
                    tooltip && (
                        <TooltipContent>
                            {tooltip}
                        </TooltipContent>
                    )
                }
            </Tooltip>
        )
    }
)
Button.displayName = "Button"

export {Button, buttonVariants}
