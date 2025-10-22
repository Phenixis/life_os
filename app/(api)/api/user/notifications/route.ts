import { NextRequest, NextResponse } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { getUser } from "@/lib/db/queries/user/user"
import { db } from "@/lib/db/drizzle"
import * as Schema from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const user = await getUser(verification.userId)

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Return notification preferences
        const notificationData = {
            daily_recap_email_enabled: user.daily_recap_email_enabled,
        }

        return NextResponse.json(notificationData)
    } catch (error) {
        console.error("Error fetching notification preferences:", error)
        return NextResponse.json({ error: "Failed to fetch notification preferences" }, { status: 500 })
    }
}

const putBodySchema = {
    daily_recap_email_enabled: "boolean",
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

        const { daily_recap_email_enabled } = body

        // Update notification preferences
        await db
            .update(Schema.User.User.table)
            .set({
                daily_recap_email_enabled,
                updated_at: new Date(),
            })
            .where(eq(Schema.User.User.table.id, verification.userId))

        // Return updated notification data
        const user = await getUser(verification.userId)
        const notificationData = {
            daily_recap_email_enabled: user!.daily_recap_email_enabled,
        }

        return NextResponse.json(notificationData)
    } catch (error) {
        console.error("Error updating notification preferences:", error)
        return NextResponse.json({ error: "Failed to update notification preferences" }, { status: 500 })
    }
}
