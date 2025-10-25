"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

export function ConversationSkeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="group relative">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-left h-auto p-3 cursor-default"
                        disabled
                    >
                        <div className="w-full">
                            <Skeleton className="h-4 w-[85%]" />
                        </div>
                    </Button>
                </div>
            ))}
        </div>
    )
}

export function ProfileSkeleton() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
                <Button
                    key={i}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-3 cursor-default"
                    disabled
                >
                    <div className="w-full">
                        <Skeleton className="h-4 w-[70%] mb-2" />
                        <Skeleton className="h-3 w-[90%]" />
                    </div>
                </Button>
            ))}
        </div>
    )
}

export function ChatMessageSkeleton() {
    return (
        <div className="space-y-4 p-4">
            {/* User message skeleton */}
            <div className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-lg p-3 max-w-[80%]">
                    <Skeleton className="h-4 w-48 bg-blue-500" />
                </div>
            </div>
            
            {/* AI response skeleton */}
            <div className="flex justify-start">
                <div className="bg-gray-200 rounded-lg p-3 max-w-[80%]">
                    <Skeleton className="h-4 w-64 mb-2" />
                    <Skeleton className="h-4 w-56 mb-2" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
        </div>
    )
}
