import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
    return (
        <section className="page">
            <div className="space-y-6">
                {/* Title skeleton */}
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-96" />
                </div>
                
                {/* Form content skeleton */}
                <div className="space-y-6 mt-8">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                    
                    {/* Action buttons skeleton */}
                    <div className="flex gap-3 pt-4">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
            </div>
        </section>
    )
}
