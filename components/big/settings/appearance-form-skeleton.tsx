import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export function UpdateAutoDarkModeSkeleton() {
    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>Dark Mode Settings</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Customize the appearance of your interface. Configure automatic dark mode scheduling to match your preferences.
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Current Mode */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Current Mode</Label>
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-20" />
                        <span className="text-sm text-muted-foreground">Currently using</span>
                        <Skeleton className="h-5 w-16" />
                        <span className="text-sm text-muted-foreground">mode</span>
                    </div>
                </div>

                {/* Auto Dark Mode Toggle */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label className="text-base font-medium">Automatic Dark Mode</Label>
                            <p className="text-sm text-muted-foreground">
                                Automatically switch between light and dark mode based on your schedule
                            </p>
                        </div>
                        <Skeleton className="h-6 w-11 rounded-full" />
                    </div>
                </div>

                {/* Schedule Settings */}
                <div className="space-y-4 pl-4 border-l-2 border-muted">
                    <Label className="text-base font-medium">Schedule</Label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_time">Dark Mode Start Time</Label>
                            <Skeleton className="h-10 w-full" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="end_time">Dark Mode End Time</Label>
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
