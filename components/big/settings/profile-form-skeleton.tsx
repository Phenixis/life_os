import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export function ProfileFormSkeleton() {
    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                    Update your personal details and contact information.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">First Name</Label>
                            <Skeleton className="h-10 w-full" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="last_name">Last Name</Label>
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Skeleton className="h-10 w-full" />
                    </div>

                    <div className="flex justify-end">
                        <Skeleton className="h-10 w-[120px]" />
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
