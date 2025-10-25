import { NextRequest, NextResponse } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { getUser } from "@/lib/db/queries/user/user"
import { createPasswordResetRequest, invalidateUserPasswordResetRequests } from "@/lib/db/queries/user/password-reset-request"
import { sendPasswordResetEmail } from "@/components/utils/send_email"

/**
 * Reset user password - creates a password reset request and sends email with reset link
 * @deprecated This endpoint now uses the new password reset flow with tokens
 */
export async function POST(request: NextRequest) {
    try {
        // Verify API key
        const verification = await verifyRequest(request)
        if ('error' in verification) {
            return verification.error
        }

        // Get user information
        const user = await getUser(verification.userId)
        if (!user) {
            return NextResponse.json({
                error: "User not found"
            }, { status: 404 })
        }

        // Invalidate any existing pending reset requests for this user
        await invalidateUserPasswordResetRequests(user.id)

        // Create new password reset request
        let resetRequest
        try {
            resetRequest = await createPasswordResetRequest(user.id, false)
        } catch (error) {
            console.error("Failed to create password reset request:", error)
            return NextResponse.json({
                error: "Failed to create password reset request. Please try again."
            }, { status: 500 })
        }

        // Send email notification with reset link
        try {
            await sendPasswordResetEmail(user, resetRequest.id)
        } catch (emailError) {
            console.error("Failed to send password reset email:", emailError)
            return NextResponse.json({
                error: "Failed to send password reset email. Please try again."
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: "Password reset email has been sent. Please check your email to set a new password."
        })

    } catch (error) {
        console.error("Error resetting password:", error)
        return NextResponse.json({ 
            error: "Failed to reset password. Please try again." 
        }, { status: 500 })
    }
}
