"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Mail, ArrowLeft, Loader } from "lucide-react"
import { toast } from "sonner"

export function ForgotPasswordForm() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [identifier, setIdentifier] = useState("")

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!identifier.trim()) {
            toast.error("Please enter your email or identifier")
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ identifier: identifier.trim() })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to send reset email")
            }

            if (response.status === 207) {
                // Partial success - password reset but email failed
                toast.warning(data.error)
            } else {
                toast.success(data.message)
            }

            setIsOpen(false)
            setIdentifier("")

        } catch (error) {
            console.error("Error sending password reset:", error)
            toast.error(error instanceof Error ? error.message : "Failed to send reset email. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger className="text-sm text-gray-700 lg:text-gray-500 lg:hover:text-gray-700 underline lg:no-underline lg:hover:underline cursor-pointer">
                Forgot password?
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="size-5" />
                        Reset Password
                    </DialogTitle>
                    <DialogDescription>
                        Enter your email and we&apos;ll send you a new password.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePasswordReset}>
                    <div className="space-y-4 pb-4">
                        <div className="space-y-2">
                            <Label htmlFor="identifier">Email</Label>
                            <Input
                                id="identifier"
                                type="text"
                                placeholder="Enter your email"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                A new 8-digit password will be generated and sent to your email address.
                                You&apos;ll need to use this new password to log in.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="w-full flex sm:justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isLoading}
                        >
                            <ArrowLeft className="size-4 mr-2" />
                            Back to Login
                        </Button>
                        <Button type="submit" disabled={isLoading || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier) === false}>
                            {isLoading ? (
                                <>
                                    <Loader className="size-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Mail className="size-4 mr-2" />
                                    Send Reset Email
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
