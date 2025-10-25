import { NextRequest, NextResponse } from "next/server"
import { getUserByEmail } from "@/lib/db/queries/user/user"
import { createPasswordResetRequest, invalidateUserPasswordResetRequests } from "@/lib/db/queries/user/password-reset-request"
import { sendPasswordResetEmail } from "@/components/utils/send_email"

/**
 * Forgot password - creates a password reset request and sends email with reset link
 * Accepts only email as identifier
 */
export async function POST(request: NextRequest) {
    try {
        const { identifier } = await request.json()

        if (!identifier || typeof identifier !== 'string') {
            return NextResponse.json({
                error: "Email is required"
            }, { status: 400 })
        }

        const trimmedIdentifier = identifier.trim()

        // Try to find user by email only
        let user = null
        
        // Check if it's an email (contains @)
        if (trimmedIdentifier.includes('@')) {
            user = await getUserByEmail(trimmedIdentifier)
        }

        if (!user) {
            // Don't reveal whether the email exists for security reasons
            return NextResponse.json({
                message: "If the email exists in our system, you will receive a password reset email shortly."
            })
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
            message: "If the email exists in our system, you will receive a password reset email shortly."
        })

    } catch (error) {
        console.error("Error in forgot password:", error)
        return NextResponse.json({ 
            error: "Failed to process request. Please try again." 
        }, { status: 500 })
    }
}
