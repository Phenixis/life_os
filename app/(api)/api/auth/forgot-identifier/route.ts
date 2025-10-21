import { NextRequest, NextResponse } from "next/server"
import { getUserByEmail } from "@/lib/db/queries/user/user"
import { sendIdentifierEmail } from "@/components/utils/send_email"

/**
 * Forgot identifier - sends email with user's identifier
 * Accepts only email as identifier
 */
export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json()

        if (!email || typeof email !== 'string') {
            return NextResponse.json({
                error: "Email is required"
            }, { status: 400 })
        }

        const trimmedEmail = email.trim()

        // Validate email format
        if (!trimmedEmail.includes('@')) {
            return NextResponse.json({
                error: "Please provide a valid email address"
            }, { status: 400 })
        }

        // Try to find user by email
        const user = await getUserByEmail(trimmedEmail)

        if (!user) {
            // Don't reveal whether the email exists for security reasons
            return NextResponse.json({
                message: "If the email exists in our system, you will receive an email with your identifier shortly."
            })
        }

        // Send email with identifier
        try {
            await sendIdentifierEmail(user)
        } catch (emailError) {
            console.error("Failed to send identifier email:", emailError)
            return NextResponse.json({
                error: "Failed to send email. Please try again."
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: "If the email exists in our system, you will receive an email with your identifier shortly."
        })

    } catch (error) {
        console.error("Error in forgot identifier:", error)
        return NextResponse.json({ 
            error: "Failed to process request. Please try again." 
        }, { status: 500 })
    }
}
