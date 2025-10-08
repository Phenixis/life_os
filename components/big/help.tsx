import {cn} from "@/lib/utils";
import {Tooltip, TooltipContent, TooltipTrigger,} from "@/components/ui/tooltip"
import {HelpCircle} from "lucide-react";

export default function Help({
                                 size = "base",
                                 className = "",
                                 children
                             }: {
    size?: "xs" | "sm" | "base" | "lg" | "xl";
    className?: string;
    children?: React.ReactNode;
}) {
    const sizeClass = {
        xs: "w-3 h-3",
        sm: "w-4 h-4",
        base: "w-5 h-5",
        lg: "w-6 h-6",
        xl: "w-7 h-7",
    }[size];

    return (
        <Tooltip>
            <TooltipTrigger>
                <HelpCircle className={cn("cursor-pointer", sizeClass, className)}/>
            </TooltipTrigger>
            <TooltipContent>
                {children}
            </TooltipContent>
        </Tooltip>
    )
}