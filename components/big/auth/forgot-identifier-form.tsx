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

export function ForgotIdentifierForm() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")

    const handleIdentifierRecovery = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email.trim()) {
            toast.error("Please enter your email")
            return
        }

        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            toast.error("Please enter a valid email address")
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch("/api/auth/forgot-identifier", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email: email.trim() })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to send identifier email")
            }

            toast.success(data.message)
            setIsOpen(false)
            setEmail("")

        } catch (error) {
            console.error("Error sending identifier recovery email:", error)
            toast.error(error instanceof Error ? error.message : "Failed to send recovery email. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger className="text-sm text-gray-700 lg:text-gray-500 lg:hover:text-gray-700 underline lg:no-underline lg:hover:underline cursor-pointer">
                Forgot identifier?
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="size-5" />
                        Recover Your Identifier
                    </DialogTitle>
                    <DialogDescription>
                        Enter your email and we&apos;ll send you your identifier.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleIdentifierRecovery}>
                    <div className="space-y-4 pb-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Your 8-digit identifier will be sent to your email address.
                                You can use it to log in to your account.
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
                        <Button type="submit" disabled={isLoading || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) === false}>
                            {isLoading ? (
                                <>
                                    <Loader className="size-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Mail className="size-4 mr-2" />
                                    Send Identifier
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
