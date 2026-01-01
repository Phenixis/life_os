"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { Skeleton } from "./skeleton";

export function HorizontalList({
    itemsName,
    onClick,
    activeItemName,
    className
}: {
    itemsName: string[];
    onClick: (itemName: string) => void;
    activeItemName: string;
    className?: string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;

        const handleWheelNative = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();

            // Convert vertical scrolling to horizontal
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                element.scrollBy({
                    left: e.deltaY,
                    behavior: "smooth",
                });
            } else {
                element.scrollBy({
                    left: e.deltaX,
                    behavior: "smooth",
                });
            }
        };

        element.addEventListener('wheel', handleWheelNative, { passive: false });
        return () => element.removeEventListener('wheel', handleWheelNative);
    }, []);

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;

        // Prevent default scrolling behavior and stop propagation
        e.preventDefault();
        e.stopPropagation();

        // Convert vertical scrolling to horizontal
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            containerRef.current.scrollBy({
                left: e.deltaY,
                behavior: "smooth",
            });
        } else {
            // Handle horizontal scrolling normally
            containerRef.current.scrollBy({
                left: e.deltaX,
                behavior: "smooth",
            });
        }
    };


    return (
        <div
            ref={containerRef}
            onWheel={handleWheel}
            className={cn("py-4 px-2 flex gap-2 w-full overflow-x-auto overflow-y-hidden scrollbar-hide sticky top-0 bg-background z-10", className)}
            style={{ scrollBehavior: "smooth" }}
        >
            {itemsName.map((name, index) => (
                <div
                    key={`horizontal-list-item-${index}`}
                    className={cn(
                        "text-sm cursor-pointer flex items-center px-2 py-1 rounded-md border shrink-0",
                        name === activeItemName && "border-border bg-primary/10"
                    )}
                    onClick={() => onClick(name)}
                >
                    {name}
                </div>
            ))}
        </div>
    )
}

export function HorizontalListSkeleton({ className, itemCount = 5 }: { className?: string, itemCount?: number }) {
    return (
        <div
            className={cn("py-4 px-2 flex gap-2 w-full overflow-x-auto overflow-y-hidden scrollbar-hide sticky top-0 bg-background z-10", className)}
        >
            {Array.from({ length: itemCount }).map((_, index) => (
                <Skeleton
                    key={`horizontal-list-skeleton-${index}`}
                    className="h-8 w-20 rounded-md shrink-0"
                />
            ))}
        </div>
    )
}