import { NextRequest, NextResponse } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { updateUserProfile, getUser } from "@/lib/db/queries/user"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db/drizzle"
import * as Schema from "@/lib/db/schema"

export async function GET(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const user = await getUser(verification.userId)

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Return user profile data (excluding sensitive information)
        const profileData = {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
        }

        return NextResponse.json(profileData)
    } catch (error) {
        console.error("Error fetching user profile:", error)
        return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
    }
}

const putBodySchema = {
    first_name: "string",
    last_name: "string",
    email: "string",
}

export async function PUT(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const body = await request.json()

        // Validate request body
        for (const [field, expectedType] of Object.entries(putBodySchema)) {
            if (!(field in body)) {
                return NextResponse.json({
                    error: `Missing required field: ${field}`
                }, { status: 400 })
            }

            if (typeof body[field] !== expectedType) {
                return NextResponse.json({
                    error: `Invalid type for field ${field}. Expected ${expectedType}, got ${typeof body[field]}`
                }, { status: 400 })
            }
        }

        const { first_name, last_name, email } = body

        // Validate input data
        if (!first_name.trim()) {
            return NextResponse.json({
                error: "First name cannot be empty"
            }, { status: 400 })
        }

        if (!last_name.trim()) {
            return NextResponse.json({
                error: "Last name cannot be empty"
            }, { status: 400 })
        }

        if (!email.trim()) {
            return NextResponse.json({
                error: "Email cannot be empty"
            }, { status: 400 })
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json({
                error: "Please enter a valid email address"
            }, { status: 400 })
        }

        // Check if email is already taken by another user
        if (email !== (await getUser(verification.userId))?.email) {
            const existingUser = await db.select()
                .from(Schema.User.User.table)
                .where(eq(Schema.User.User.table.email, email))
                .limit(1)

            if (existingUser.length > 0) {
                return NextResponse.json({
                    error: "Email address is already in use"
                }, { status: 409 })
            }
        }

        // Update user profile
        const updatedUser = await updateUserProfile({
            userId: verification.userId,
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            email: email.trim(),
        })

        if (!updatedUser.success) {
            return NextResponse.json({
                error: updatedUser.error || "Failed to update profile"
            }, { status: 500 })
        }

        // Return updated profile data (excluding sensitive information)
        const user = await getUser(verification.userId)
        const profileData = {
            id: user!.id,
            email: user!.email,
            first_name: user!.first_name,
            last_name: user!.last_name,
        }

        return NextResponse.json(profileData)
    } catch (error) {
        console.error("Error updating user profile:", error)
        return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
    }
}
