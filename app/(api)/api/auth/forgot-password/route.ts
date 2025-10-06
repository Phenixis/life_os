import { NextRequest, NextResponse } from "next/server"
import { getUserByEmail, generateUserPassword, updateUserPassword } from "@/lib/db/queries/user/user"
import { sendPasswordResetEmail } from "@/components/utils/send_email"

/**
 * Forgot password - generates new password and sends email notification
 * Accepts only email as identifier
 */
export async function POST(request: NextRequest) {
    try {
        const { identifier } = await request.json()

        if (!identifier || typeof identifier !== 'string') {
            return NextResponse.json({
                error: "Identifier is required"
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

        // Generate new password
        const newPassword = await generateUserPassword()

        // Update user password in database
        const updateResult = await updateUserPassword({
            userId: user.id,
            newPassword: newPassword
        })

        if (!updateResult.success) {
            console.error("Failed to update password:", updateResult.error)
            return NextResponse.json({
                error: "Failed to reset password. Please try again."
            }, { status: 500 })
        }

        // Send email notification with new password
        try {
            await sendPasswordResetEmail(user, newPassword)
        } catch (emailError) {
            console.error("Failed to send password reset email:", emailError)
            // Password was updated successfully, but email failed
            return NextResponse.json({
                error: "Password was reset successfully, but failed to send email notification. Please contact support to get your new password."
            }, { status: 207 }) // 207 Multi-Status - partial success
        }

        return NextResponse.json({
            success: true,
            message: "If the email or identifier exists in our system, you will receive a password reset email shortly."
        })

    } catch (error) {
        console.error("Error in forgot password:", error)
        return NextResponse.json({ 
            error: "Failed to process request. Please try again." 
        }, { status: 500 })
    }
}
