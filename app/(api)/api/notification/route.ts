import { NextRequest, NextResponse } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { NotificationQueries } from "@/lib/db/queries"

export async function GET(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const { searchParams } = new URL(request.url)
        const includeRead = searchParams.get('includeRead') === 'true'
        const includeDismissed = searchParams.get('includeDismissed') === 'true'

        const notifications = await NotificationQueries.getNotifications(
            verification.userId,
            includeRead,
            includeDismissed
        )

        return NextResponse.json(notifications)
    } catch (error) {
        console.error("Error fetching notifications:", error)
        return NextResponse.json(
            { error: "Failed to fetch notifications" },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const body = await request.json()
        const { type, title, message, scheduled_for, metadata } = body

        if (!type || !title || !message) {
            return NextResponse.json(
                { error: "Missing required fields: type, title, message" },
                { status: 400 }
            )
        }

        const notification = await NotificationQueries.createNotification(
            verification.userId,
            type,
            title,
            message,
            scheduled_for ? new Date(scheduled_for) : null,
            metadata
        )

        return NextResponse.json(notification, { status: 201 })
    } catch (error) {
        console.error("Error creating notification:", error)
        return NextResponse.json(
            { error: "Failed to create notification" },
            { status: 500 }
        )
    }
}
