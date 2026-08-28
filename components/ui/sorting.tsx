import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { ArrowUpDown, ArrowUp, ArrowDown, Check } from "lucide-react";
import { Button } from "./button";

export default function Sorting({
    orderBy,
    setOrderBy,
    orderingDirection,
    setOrderingDirection,
    orderOptions
}: Readonly<{
    orderBy: string;
    setOrderBy: (value: string) => void;
    orderingDirection: "asc" | "desc";
    setOrderingDirection: (value: "asc" | "desc") => void;
    orderOptions: { value: string; label: string }[]
}>) {
    return (
        <Popover modal={false}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    tooltip="Sort options"
                    className="h-9 px-2 gap-1"
                >
                    <ArrowUpDown className="h-4 w-4" />
                    {orderingDirection === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                    ) : (
                        <ArrowDown className="h-3 w-3" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
                <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground font-medium px-1">Order by</p>
                    <div className="flex flex-col gap-0.5">
                        {orderOptions.map((option) => (
                            <Button
                                key={option.value}
                                variant={orderBy === option.value ? "secondary" : "ghost"}
                                size="sm"
                                className="justify-start h-8 px-2"
                                onClick={() => setOrderBy(option.value)}
                            >
                                {orderBy === option.value && <Check className="h-3 w-3 mr-1" />}
                                {option.label}
                            </Button>
                        ))}
                    </div>
                    <div className="border-t pt-2 mt-1">
                        <p className="text-xs text-muted-foreground font-medium px-1 mb-1">Direction</p>
                        <div className="flex gap-1">
                            <Button
                                variant={orderingDirection === "asc" ? "secondary" : "ghost"}
                                size="sm"
                                className="flex-1 h-8 gap-1"
                                onClick={() => setOrderingDirection("asc")}
                            >
                                <ArrowUp className="h-3 w-3" />
                                Asc
                            </Button>
                            <Button
                                variant={orderingDirection === "desc" ? "secondary" : "ghost"}
                                size="sm"
                                className="flex-1 h-8 gap-1"
                                onClick={() => setOrderingDirection("desc")}
                            >
                                <ArrowDown className="h-3 w-3" />
                                Desc
                            </Button>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}