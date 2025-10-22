import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function NotificationsFormSkeleton() {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>
                    Choose which email notifications you would like to receive.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="flex items-center justify-between space-x-4">
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-[180px]" />
                            <Skeleton className="h-4 w-full max-w-md" />
                        </div>
                        <Skeleton className="h-6 w-11 rounded-full" />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Skeleton className="h-10 w-[120px]" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
