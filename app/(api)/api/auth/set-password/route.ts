import { NextRequest, NextResponse } from "next/server"
import { validatePasswordResetRequest, markPasswordResetRequestAsResolved } from "@/lib/db/queries/user/password-reset-request"
import { getUser, updateUserPassword } from "@/lib/db/queries/user/user"
import { validatePassword } from "@/lib/utils/password"

/**
 * Set/Reset password using a password reset request token
 */
export async function POST(request: NextRequest) {
    try {
        const { token, password, confirmPassword } = await request.json()

        if (!token || typeof token !== 'string') {
            return NextResponse.json({
                error: "Token is required"
            }, { status: 400 })
        }

        if (!password || typeof password !== 'string') {
            return NextResponse.json({
                error: "Password is required"
            }, { status: 400 })
        }

        if (!confirmPassword || typeof confirmPassword !== 'string') {
            return NextResponse.json({
                error: "Password confirmation is required"
            }, { status: 400 })
        }

        if (password !== confirmPassword) {
            return NextResponse.json({
                error: "Passwords do not match"
            }, { status: 400 })
        }

        // Validate password strength
        const passwordValidation = validatePassword(password)
        if (!passwordValidation.isValid) {
            return NextResponse.json({
                error: passwordValidation.errors.join(', ')
            }, { status: 400 })
        }

        // Validate the reset request token
        const validation = await validatePasswordResetRequest(token)
        if (!validation.isValid || !validation.request) {
            return NextResponse.json({
                error: validation.reason || "Invalid or expired token"
            }, { status: 400 })
        }

        // Get user
        const user = await getUser(validation.request.user_id)
        if (!user) {
            return NextResponse.json({
                error: "User not found"
            }, { status: 404 })
        }

        // Update user password
        const updateResult = await updateUserPassword({
            userId: user.id,
            newPassword: password
        })

        if (!updateResult.success) {
            return NextResponse.json({
                error: updateResult.error || "Failed to update password"
            }, { status: 500 })
        }

        // Mark the reset request as resolved
        const markResult = await markPasswordResetRequestAsResolved(token)
        if (!markResult.success) {
            console.error("Failed to mark reset request as resolved:", markResult.error)
            // Don't fail the request since password was updated successfully
        }

        return NextResponse.json({
            success: true,
            message: "Password has been set successfully. You can now log in with your new password.",
            isInitialSetup: validation.request.is_initial_setup
        })

    } catch (error) {
        console.error("Error setting password:", error)
        return NextResponse.json({ 
            error: "Failed to set password. Please try again." 
        }, { status: 500 })
    }
}

/**
 * Validate a password reset token
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const token = searchParams.get('token')

        if (!token) {
            return NextResponse.json({
                error: "Token is required"
            }, { status: 400 })
        }

        const validation = await validatePasswordResetRequest(token)
        
        if (!validation.isValid || !validation.request) {
            return NextResponse.json({
                isValid: false,
                reason: validation.reason
            })
        }

        // Get user info for display
        const user = await getUser(validation.request.user_id)
        
        return NextResponse.json({
            isValid: true,
            isInitialSetup: validation.request.is_initial_setup,
            userEmail: user?.email
        })

    } catch (error) {
        console.error("Error validating token:", error)
        return NextResponse.json({ 
            error: "Failed to validate token. Please try again." 
        }, { status: 500 })
    }
}
