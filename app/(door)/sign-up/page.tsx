"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { signUp } from "@/lib/auth/actions"
import { useActionState, useState, useRef, useEffect } from "react"
import type { ActionState } from "@/proxy"
import { Loader } from "lucide-react"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useSearchParams } from "next/navigation"

export default function SignUp() {
    const searchParams = useSearchParams()
    const firstNameRef = useRef<HTMLInputElement>(null)
    const lastNameRef = useRef<HTMLInputElement>(null)
    const emailRef = useRef<HTMLInputElement>(null)
    const [state, formAction, pending] = useActionState<ActionState, FormData>(signUp, { error: "" })
    const [formFilled, setFormFilled] = useState(false)
    const [showDialog, setShowDialog] = useState(false)
    const [redirectTo, setRedirectTo] = useState("/my")

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const redirectParam = params.get("redirectTo")
        if (redirectParam) {
            setRedirectTo(redirectParam)
        }
    }, [])

    useEffect(() => {
        if (state?.success) {
            setShowDialog(true)
        }
    }, [state])

    const verifyFormFilled = () => {
        const isFormFilled = Boolean(
            firstNameRef.current?.value &&
            lastNameRef.current?.value &&
            emailRef.current?.value
        )
        setFormFilled(isFormFilled)
    }

    const verifyEmail = () => {
        const email = emailRef.current?.value || ""
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    return (
        <form
            action={formAction}
            className="w-full min-h-screen flex flex-col space-y-4 items-center justify-center"
        >
            <Card className="w-fit">
                <CardHeader>
                    <CardTitle>Welcome</CardTitle>
                </CardHeader>
                <CardContent className="w-full">
                    {
                        Array.from(searchParams.entries()).map(([key, value]) => (
                            <input
                                key={key}
                                type="hidden"
                                name={key}
                                value={value}
                            />
                        ))
                    }
                    <div className="flex space-x-4">
                        <div>
                            <Label required>First Name</Label>
                            <Input
                                type="text"
                                name="first_name"
                                className="text-center"
                                ref={firstNameRef}
                                autoFocus
                                onChange={verifyFormFilled}
                            />
                        </div>
                        <div>
                            <Label required>Last Name</Label>
                            <Input
                                type="text"
                                name="last_name"
                                className="text-center"
                                ref={lastNameRef}
                                onChange={verifyFormFilled}
                            />
                        </div>
                    </div>
                    <Label required>Email</Label>
                    <Input
                        type="text"
                        name="email"
                        className="text-center"
                        ref={emailRef}
                        onChange={() => {
                            if (verifyEmail()) {
                                verifyFormFilled()
                            }
                        }}
                    />
                </CardContent>
                <CardFooter className={`flex ${pending || state?.error ? "justify-between" : "justify-end"} items-end`}>
                    {
                        pending ? (
                            <Loader className="animate-spin size-4" />
                        ) : (
                            state?.error && <p className="text-red-500 max-w-64">{state.error}</p>
                        )
                    }
                    <Button
                        type="submit"
                        disabled={pending || !formFilled}
                    >Request an account</Button>
                </CardFooter>
            </Card>
            {/* Preserve all search params when linking to login */}
            <Link
                href={{
                    pathname: "/login",
                    query: Object.fromEntries(searchParams.entries()),
                }}
                className="text-sm text-gray-700 lg:text-gray-500 lg:hover:text-gray-700 underline lg:no-underline lg:hover:underline"
            >
                Already have an account?
            </Link>

            {showDialog && (
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent maxHeight="max-h-64">
                        <DialogHeader>
                            <DialogTitle>Account created</DialogTitle>
                        </DialogHeader>
                        <p>Your account has been created !</p>
                        <DialogDescription>
                            You should have received an email with a link to set up your password. Please check your inbox and follow the instructions to complete your account setup.
                        </DialogDescription>
                        <DialogFooter>
                            <Button onClick={() => {
                                const loginUrl = redirectTo !== "/my" ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/login"
                                redirect(loginUrl)
                            }}>Login</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </form>
    )
}

