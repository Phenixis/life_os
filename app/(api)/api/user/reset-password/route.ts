import { NextRequest, NextResponse } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { getUser, generateUserPassword, updateUserPassword } from "@/lib/db/queries/user/user"
import { sendPasswordResetEmail } from "@/components/utils/send_email"

/**
 * Reset user password - generates new password and sends email notification
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

        // Generate new password
        const newPassword = await generateUserPassword()

        // Update user password in database
        const updateResult = await updateUserPassword({
            userId: verification.userId,
            newPassword: newPassword
        })

        if (!updateResult.success) {
            return NextResponse.json({
                error: updateResult.error || "Failed to reset password"
            }, { status: 500 })
        }

        // Send email notification with new password
        try {
            await sendPasswordResetEmail(user, newPassword)
        } catch (emailError) {
            console.error("Failed to send password reset email:", emailError)
            // Password was updated successfully, but email failed
            return NextResponse.json({
                error: "Password was reset successfully, but failed to send email notification. Please send an email to max@maximeduhamel.com to get your new password."
            }, { status: 207 }) // 207 Multi-Status - partial success
        }

        return NextResponse.json({
            success: true,
            message: "Password has been reset successfully. Check your email for the new credentials."
        })

    } catch (error) {
        console.error("Error resetting password:", error)
        return NextResponse.json({ 
            error: "Failed to reset password. Please try again." 
        }, { status: 500 })
    }
}
