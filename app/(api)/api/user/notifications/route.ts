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
            mood_reminder_morning_enabled: user.mood_reminder_morning_enabled,
            mood_reminder_morning_hour: user.mood_reminder_morning_hour,
            mood_reminder_morning_minute: user.mood_reminder_morning_minute,
            mood_reminder_evening_enabled: user.mood_reminder_evening_enabled,
            mood_reminder_evening_hour: user.mood_reminder_evening_hour,
            mood_reminder_evening_minute: user.mood_reminder_evening_minute,
        }

        return NextResponse.json(notificationData)
    } catch (error) {
        console.error("Error fetching notification preferences:", error)
        return NextResponse.json({ error: "Failed to fetch notification preferences" }, { status: 500 })
    }
}

const putBodySchema = {
    daily_recap_email_enabled: "boolean",
    mood_reminder_morning_enabled: "boolean",
    mood_reminder_morning_hour: "number",
    mood_reminder_morning_minute: "number",
    mood_reminder_evening_enabled: "boolean",
    mood_reminder_evening_hour: "number",
    mood_reminder_evening_minute: "number",
}

export async function PUT(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const body = await request.json()

        // Validate request body - only validate fields that are present
        const validFields: Record<string, any> = {}
        for (const [field, expectedType] of Object.entries(putBodySchema)) {
            if (field in body) {
                if (typeof body[field] !== expectedType) {
                    return NextResponse.json({
                        error: `Invalid type for field ${field}. Expected ${expectedType}, got ${typeof body[field]}`
                    }, { status: 400 })
                }
                validFields[field] = body[field]
            }
        }

        if (Object.keys(validFields).length === 0) {
            return NextResponse.json({
                error: "No valid fields provided"
            }, { status: 400 })
        }

        // Update notification preferences
        await db
            .update(Schema.User.User.table)
            .set({
                ...validFields,
                updated_at: new Date(),
            })
            .where(eq(Schema.User.User.table.id, verification.userId))

        // Return updated notification data
        const user = await getUser(verification.userId)
        const notificationData = {
            daily_recap_email_enabled: user!.daily_recap_email_enabled,
            mood_reminder_morning_enabled: user!.mood_reminder_morning_enabled,
            mood_reminder_morning_hour: user!.mood_reminder_morning_hour,
            mood_reminder_morning_minute: user!.mood_reminder_morning_minute,
            mood_reminder_evening_enabled: user!.mood_reminder_evening_enabled,
            mood_reminder_evening_hour: user!.mood_reminder_evening_hour,
            mood_reminder_evening_minute: user!.mood_reminder_evening_minute,
        }

        return NextResponse.json(notificationData)
    } catch (error) {
        console.error("Error updating notification preferences:", error)
        return NextResponse.json({ error: "Failed to update notification preferences" }, { status: 500 })
    }
}
