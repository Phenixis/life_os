import { getUserPreferences, updateDarkModePreferences } from "@/lib/db/queries/user/user"
import { NextRequest, NextResponse } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { DarkModeCookie } from "@/lib/flags"
import { updateDarkModeCookie } from "@/lib/cookies"

export async function GET(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const userPreferences = await getUserPreferences(verification.userId)

        if (!userPreferences) {
            return NextResponse.json({ error: "User preferences not found" }, { status: 404 })
        }

        await updateDarkModeCookie(userPreferences.darkModeCookie)

        return NextResponse.json(userPreferences)
    } catch (error) {
        console.error("Error fetching user preferences:", error)
        return NextResponse.json({ error: "Failed to fetch user preferences" }, { status: 500 })
    }
}

const putBodySchema = {
    has_jarvis_asked_dark_mode: "boolean",
    dark_mode: "boolean",
    auto_dark_mode: "boolean",
    startHour: "number",
    endHour: "number",
    startMinute: "number",
    endMinute: "number",
    override: "boolean",
}

export async function PUT(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    const body = await request.json()
    const { dark_mode, auto_dark_mode, startHour, endHour, startMinute, endMinute, override, has_jarvis_asked_dark_mode } = body

    // Validate required fields and types based on schema
    for (const [field, expectedType] of Object.entries(putBodySchema)) {
        // Check if field exists
        if (body[field] === undefined) {
            console.log(`Missing required field: ${field}. Expected type: ${expectedType}`)
            return NextResponse.json({ error: `Missing required field: ${field}. Expected type: ${expectedType}` }, { status: 400 })
        }

        // Check field type
        if (typeof body[field] !== expectedType) {
            console.log(`Invalid type for field: ${field}. Expected ${expectedType}, got ${typeof body[field]}`)
            return NextResponse.json({
                error: `Invalid type for field ${field}. Expected ${expectedType}, got ${typeof body[field]}`
            }, { status: 400 })
        }
    }

    try {
        const newCookie = {
            has_jarvis_asked_dark_mode,
            dark_mode,
            auto_dark_mode,
            startHour,
            endHour,
            startMinute,
            endMinute,
            override,
        } as DarkModeCookie

        const updatedPreferences = await updateDarkModePreferences({
            userId: verification.userId,
            darkModeCookie: newCookie,
        })

        // Update the cookie with the new preferences
        await updateDarkModeCookie(newCookie)

        return NextResponse.json(updatedPreferences)
    } catch (error) {
        console.error("Error updating user preferences:", error)
        return NextResponse.json({ error: "Failed to update user preferences" }, { status: 500 })
    }
}