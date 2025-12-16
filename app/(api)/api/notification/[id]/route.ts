import { NextRequest, NextResponse } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { NotificationQueries } from "@/lib/db/queries"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const { id } = await params
        const notificationId = parseInt(id)

        if (isNaN(notificationId)) {
            return NextResponse.json(
                { error: "Invalid notification ID" },
                { status: 400 }
            )
        }

        const notification = await NotificationQueries.getNotification(
            notificationId,
            verification.userId
        )

        if (!notification) {
            return NextResponse.json(
                { error: "Notification not found" },
                { status: 404 }
            )
        }

        return NextResponse.json(notification)
    } catch (error) {
        console.error("Error fetching notification:", error)
        return NextResponse.json(
            { error: "Failed to fetch notification" },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const { id } = await params
        const notificationId = parseInt(id)

        if (isNaN(notificationId)) {
            return NextResponse.json(
                { error: "Invalid notification ID" },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { read, dismissed } = body

        let notification
        if (read !== undefined) {
            notification = await NotificationQueries.markNotificationAsRead(
                notificationId,
                verification.userId
            )
        }
        if (dismissed !== undefined) {
            notification = await NotificationQueries.markNotificationAsDismissed(
                notificationId,
                verification.userId
            )
        }

        if (!notification) {
            return NextResponse.json(
                { error: "No update performed" },
                { status: 400 }
            )
        }

        return NextResponse.json(notification)
    } catch (error) {
        console.error("Error updating notification:", error)
        return NextResponse.json(
            { error: "Failed to update notification" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const { id } = await params
        const notificationId = parseInt(id)

        if (isNaN(notificationId)) {
            return NextResponse.json(
                { error: "Invalid notification ID" },
                { status: 400 }
            )
        }

        const notification = await NotificationQueries.deleteNotification(
            notificationId,
            verification.userId
        )

        return NextResponse.json(notification)
    } catch (error) {
        console.error("Error deleting notification:", error)
        return NextResponse.json(
            { error: "Failed to delete notification" },
            { status: 500 }
        )
    }
}
