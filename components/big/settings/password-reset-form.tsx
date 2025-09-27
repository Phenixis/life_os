"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Shield, Mail, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { User } from "@/lib/db/schema"
import { logout } from "@/lib/auth/actions"

interface PasswordResetFormProps {
    user: User.User.Select
}

export function PasswordResetForm({ user }: PasswordResetFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [showSecondConfirm, setShowSecondConfirm] = useState(false)

    const handlePasswordReset = async () => {
        setIsLoading(true)

        try {
            const response = await fetch("/api/user/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.api_key}`
                }
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to reset password")
            }

            if (response.status === 207) {
                // Partial success - password reset but email failed
                toast.warning(data.error)
            } else {
                toast.success(data.message)
            }

            setShowSecondConfirm(false)

            // Log out the user after successful password reset
            setTimeout(async () => {
                try {
                    toast.info("Logging you out due to password change...")
                    await logout()
                } catch (error) {
                    if (error instanceof Error && error.message !== "NEXT_REDIRECT") {
                        console.error("Logout failed:", error)
                        toast.error("Password was reset but logout failed. Please manually log out and log back in with your new credentials.")
                    }
                    // NEXT_REDIRECT errors are expected from the logout function
                }
            }, 2000) // Give user time to see the success message

        } catch (error) {
            console.error("Error resetting password:", error)
            toast.error(error instanceof Error ? error.message : "Failed to reset password. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="">
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
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                Important Security Information
                            </h4>
                            <div className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                                <p>• A new 8-digit password will be automatically generated</p>
                                <p>• Your new credentials will be sent to: <strong>{user.email}</strong></p>
                                <p>• You will be automatically logged out after the reset</p>
                                <p>• You will need to log in again with the new password</p>
                                <p>• This action cannot be undone</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <AlertDialog open={showSecondConfirm} onOpenChange={setShowSecondConfirm}>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full sm:w-auto">
                                    <Shield className="size-4 mr-2" />
                                    Reset Password
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                        <AlertTriangle className="size-5 text-amber-500" />
                                        Confirm Password Reset
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="space-y-2">
                                        <span className="block">Are you sure you want to reset your password?</span>
                                        <span className="block bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mt-3">
                                            <span className="flex items-center gap-2 mb-2">
                                                <Mail className="size-4 text-blue-500" />
                                                <span className="text-sm font-medium">Email notification will be sent to:</span>
                                            </span>
                                            <span className="block text-sm font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                                                {user.email}
                                            </span>
                                        </span>
                                        <span className="block text-sm text-muted-foreground mt-2">
                                            This will generate a new password and email it to you. You will be automatically logged out afterwards and need to log in with your new credentials.
                                        </span>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => setShowSecondConfirm(true)}
                                        className="bg-red-500 hover:bg-red-600"
                                    >
                                        Continue
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="size-5 text-red-500" />
                                    Final Confirmation
                                </AlertDialogTitle>
                                <AlertDialogDescription className="space-y-2">
                                    <span className="block font-medium text-red-600 dark:text-red-400">
                                        This is your final confirmation. Your password will be permanently changed.
                                    </span>
                                    <span className="block">
                                        A new 8-digit password will be generated and sent to <strong>{user.email}</strong>. 
                                        Make sure you have access to this email address.
                                    </span>
                                    <span className="block text-sm text-muted-foreground">
                                        Click &quot;Reset Now&quot; to proceed with the password reset.
                                    </span>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setShowSecondConfirm(false)}>
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handlePasswordReset}
                                    disabled={isLoading}
                                    className="bg-red-500 hover:bg-red-600"
                                >
                                    {isLoading ? "Resetting..." : "Reset Now"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    )
}
