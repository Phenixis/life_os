"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useActionState, useEffect, useState, useRef, startTransition } from "react"
import type { ActionState } from "@/middleware"
import { Loader } from "lucide-react"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import {
    REGEXP_ONLY_DIGITS
} from "input-otp"
import Link from "next/link"
import { toast } from "sonner"
import { ForgotPasswordForm } from "@/components/big/auth/forgot-password-form"
import { useSearchParams } from "next/navigation"
import { login } from "@/lib/auth/actions"

export default function Login() {
    const searchParams = useSearchParams()
    const [identifier, setIdentifier] = useState("")
    const [password, setPassword] = useState("")

    const formRef = useRef<HTMLFormElement>(null)
    const identifierRef = useRef<HTMLInputElement>(null)
    const passwordRef = useRef<HTMLInputElement>(null)

    const [state, formAction, pending] = useActionState<ActionState, FormData>(async (prevState, formData) => {
        const result = await login(prevState, formData)
        if (result) {
            if (result.error) {
                toast.error(result.error)
            } else if (result.success) {
                toast.success("Login successful")
            }
            return result
        }
        return null
    }, { error: "" })

    useEffect(() => {
        toast.dismiss("logout")
    }, [])

    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key === "Enter") {
                startTransition(() => {
                    if (formRef.current) {
                        formAction(new FormData(formRef.current))
                    }
                })
            }
        }

        document.addEventListener("keydown", handleKeyPress)

        return () => {
            document.removeEventListener("keydown", handleKeyPress)
        }
    }, [formAction])

    useEffect(() => {
        if (state?.success) {
            window.location.href = state.redirectTo;
        }
    }, [state]);

    useEffect(() => {
        if (identifier.length === 8) {
            passwordRef.current?.focus()
        }
    }, [identifier])

    return (
        <form
            action={formAction}
            ref={formRef}
            className="w-full min-h-screen flex flex-col space-y-4 items-center justify-center"
        >
            <Card>
                <CardHeader>
                    <CardTitle>Hello</CardTitle>
                </CardHeader>
                <CardContent>
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
                    <input type="hidden" name="identifier" value={identifier} />
                    <input type="hidden" name="password" value={password} />
                    <Label required>Enter your identifier</Label>
                    <InputOTP
                        maxLength={8}
                        value={identifier}
                        onChange={(value) => setIdentifier(value)}
                        pattern={REGEXP_ONLY_DIGITS}
                        ref={identifierRef}
                        autoFocus
                    >
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                            <InputOTPSlot index={6} />
                            <InputOTPSlot index={7} />
                        </InputOTPGroup>
                    </InputOTP>
                    <Label required>Enter your password</Label>
                    <Input
                        type="password"
                        value={password}
                        ref={passwordRef}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={pending}
                        required
                        className="text-center"
                    />
                </CardContent>
                <CardFooter className={`${pending || state?.error ? "flex justify-between" : "flex justify-end"}`}>
                    {
                        pending ? (
                            <Loader className="animate-spin size-4" />
                        ) : (
                            state?.error && <p className="text-red-500">{state.error}</p>
                        )
                    }
                    <Button
                        type="submit"
                        disabled={pending}
                    >Login</Button>
                </CardFooter>
            </Card>
            <Link href={{
                pathname: "/sign-up",
                query: Object.fromEntries(searchParams.entries()),
            }} className="text-sm text-gray-700 lg:text-gray-500 lg:hover:text-gray-700 underline lg:no-underline lg:hover:underline">Don&apos;t have an account?</Link>
            <ForgotPasswordForm />
        </form>
    )
}

