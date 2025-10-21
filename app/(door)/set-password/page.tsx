"use client"

import {useEffect, useState} from "react"
import {useRouter, useSearchParams} from "next/navigation"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,} from "@/components/ui/card"
import {InputOTP, InputOTPGroup, InputOTPSlot,} from "@/components/ui/input-otp"
import {REGEXP_ONLY_DIGITS} from "input-otp"
import {Check, Eye, EyeOff, Loader, X} from "lucide-react"
import {toast} from "sonner"

export default function SetPassword() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get("token")

    const [isValidating, setIsValidating] = useState(true)
    const [isValid, setIsValid] = useState(false)
    const [isInitialSetup, setIsInitialSetup] = useState(false)
    const [userEmail, setUserEmail] = useState("")

    const [identifier, setIdentifier] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [passwordValidation, setPasswordValidation] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        digit: false,
        special: false,
    })

    useEffect(() => {
        if (!token) {
            setIsValidating(false)
            return
        }

        // Validate the token
        fetch(`/api/auth/set-password?token=${token}`)
            .then(res => res.json())
            .then(data => {
                setIsValidating(false)
                if (data.isValid) {
                    setIsValid(true)
                    setIsInitialSetup(data.isInitialSetup)
                    setUserEmail(data.userEmail || "")
                }
            })
            .catch(error => {
                console.error("Error validating token:", error)
                setIsValidating(false)
            })
    }, [token])

    useEffect(() => {
        // Validate password as user types
        setPasswordValidation({
            length: password.length >= 8 && password.length <= 25,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            digit: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password),
        })
    }, [password])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!token) {
            toast.error("Invalid token")
            return
        }

        if (!identifier || identifier.trim().length !== 8) {
            toast.error("Please enter your 8-digit identifier")
            return
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match")
            return
        }

        if (!Object.values(passwordValidation).every(v => v)) {
            toast.error("Password does not meet all requirements")
            return
        }

        setIsSubmitting(true)

        try {
            const response = await fetch("/api/auth/set-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token,
                    identifier: identifier.trim(),
                    password,
                    confirmPassword
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to set password")
            }

            toast.success(data.message)

            // Redirect to login after a short delay
            setTimeout(() => {
                router.push("/login")
            }, 2000)

        } catch (error) {
            console.error("Error setting password:", error)
            toast.error(error instanceof Error ? error.message : "Failed to set password. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isValidating) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-2 md:pt-4 xl:pt-6 flex flex-col items-center gap-4">
                        <Loader className="animate-spin size-8"/>
                        <p className="text-sm text-muted-foreground">Validating your request...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!isValid) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-500 text-center">Invalid Request</CardTitle>
                        {/*<CardDescription>{validationError}</CardDescription>*/}
                    </CardHeader>
                    <CardFooter>
                        <Button onClick={() => router.push("/login")} variant="outline" className="w-full">
                            Return to Login
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="w-full min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>
                        {isInitialSetup ? "Welcome! Set Your Password" : "Reset Your Password"}
                    </CardTitle>
                    <CardDescription>
                        {isInitialSetup
                            ? "Create a secure password to complete your account setup"
                            : "Create a new password for your account"
                        }
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {userEmail && (
                            <div
                                className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Setting password for: <strong>{userEmail}</strong>
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label required>Enter your identifier</Label>
                            <div className={"w-fit mx-auto"}>
                                <InputOTP
                                    maxLength={8}
                                    value={identifier}
                                    onChange={(value) => setIdentifier(value)}
                                    pattern={REGEXP_ONLY_DIGITS}
                                    disabled={isSubmitting}
                                    className=""
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0}/>
                                        <InputOTPSlot index={1}/>
                                        <InputOTPSlot index={2}/>
                                        <InputOTPSlot index={3}/>
                                        <InputOTPSlot index={4}/>
                                        <InputOTPSlot index={5}/>
                                        <InputOTPSlot index={6}/>
                                        <InputOTPSlot index={7}/>
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Enter your 8-digit user identifier for security verification
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" required>New Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isSubmitting}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="size-4"/> : <Eye className="size-4"/>}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" required>Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isSubmitting}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirmPassword ? <EyeOff className="size-4"/> : <Eye className="size-4"/>}
                                </button>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-4 space-y-2">
                            <p className="text-sm font-medium">Password Requirements:</p>
                            <div className="space-y-1">
                                <PasswordRequirement
                                    met={passwordValidation.length}
                                    text="8-25 characters"
                                />
                                <PasswordRequirement
                                    met={passwordValidation.uppercase}
                                    text="At least one uppercase letter"
                                />
                                <PasswordRequirement
                                    met={passwordValidation.lowercase}
                                    text="At least one lowercase letter"
                                />
                                <PasswordRequirement
                                    met={passwordValidation.digit}
                                    text="At least one digit"
                                />
                                <PasswordRequirement
                                    met={passwordValidation.special}
                                    text="At least one special character"
                                />
                            </div>
                        </div>

                        {password && confirmPassword && password !== confirmPassword && (
                            <p className="text-sm text-red-500">Passwords do not match</p>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            disabled={
                                isSubmitting ||
                                !identifier ||
                                identifier.length !== 8 ||
                                !password ||
                                !confirmPassword ||
                                password !== confirmPassword ||
                                !Object.values(passwordValidation).every(v => v)
                            }
                            className="w-full"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader className="size-4 mr-2 animate-spin"/>
                                    Setting Password...
                                </>
                            ) : (
                                isInitialSetup ? "Set Password & Continue" : "Reset Password"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}

function PasswordRequirement({met, text}: { met: boolean; text: string }) {
    return (
        <div className="flex items-center gap-2 text-sm">
            {met ? (
                <Check className="size-4 text-green-500 flex-shrink-0"/>
            ) : (
                <X className="size-4 text-gray-400 flex-shrink-0"/>
            )}
            <span className={met ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}>
                {text}
            </span>
        </div>
    )
}
