import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, AlertTriangle } from "lucide-react"

export function PasswordResetFormSkeleton() {
    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="size-5" />
                    Password Management
                </CardTitle>
                <CardDescription>
                    Reset your password to generate new secure credentials. Your new password will be sent to your email address.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Warning Box */}
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                Important Security Information
                            </h4>
                            <div className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                                <p>• A new 8-digit password will be automatically generated</p>
                                <p>• Your new credentials will be sent to: <span className="inline-block h-4 w-48 mx-1 bg-accent animate-pulse rounded-md"></span></p>
                                <p>• You will be automatically logged out after the reset</p>
                                <p>• You will need to log in again with the new password</p>
                                <p>• This action cannot be undone</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Reset Button */}
                <div className="pt-4 flex justify-end">
                    <Skeleton className="h-10 w-40" />
                </div>
            </CardContent>
        </Card>
    )
}
