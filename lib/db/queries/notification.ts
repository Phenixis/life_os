import * as lib from "./lib"

export async function createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    scheduledFor?: Date | null,
    metadata?: string
): Promise<lib.Schema.Notification.Select> {
    const notification = await lib.db
        .insert(lib.Schema.Notification.table)
        .values({
            user_id: userId,
            type,
            title,
            message,
            scheduled_for: scheduledFor,
            metadata,
        })
        .returning()

    return notification[0];
}

export async function getNotifications(
    userId: string,
    includeRead: boolean = false,
    includeDismissed: boolean = false
): Promise<lib.Schema.Notification.Select[]> {
    const conditions = [
        lib.eq(lib.Schema.Notification.table.user_id, userId),
        lib.isNull(lib.Schema.Notification.table.deleted_at),
    ];

    if (!includeRead) {
        conditions.push(lib.eq(lib.Schema.Notification.table.read, false));
    }

    if (!includeDismissed) {
        conditions.push(lib.eq(lib.Schema.Notification.table.dismissed, false));
    }

    const notifications = await lib.db
        .select()
        .from(lib.Schema.Notification.table)
        .where(lib.and(...conditions))
        .orderBy(lib.desc(lib.Schema.Notification.table.created_at));

    return notifications;
}

export async function getNotification(
    notificationId: number,
    userId: string
): Promise<lib.Schema.Notification.Select | null> {
    const notification = await lib.db
        .select()
        .from(lib.Schema.Notification.table)
        .where(
            lib.and(
                lib.eq(lib.Schema.Notification.table.id, notificationId),
                lib.eq(lib.Schema.Notification.table.user_id, userId),
                lib.isNull(lib.Schema.Notification.table.deleted_at)
            )
        )
        .limit(1);

    return notification[0] || null;
}

export async function markNotificationAsRead(
    notificationId: number,
    userId: string
): Promise<lib.Schema.Notification.Select> {
    const notification = await lib.db
        .update(lib.Schema.Notification.table)
        .set({
            read: true,
            updated_at: new Date(),
        })
        .where(
            lib.and(
                lib.eq(lib.Schema.Notification.table.id, notificationId),
                lib.eq(lib.Schema.Notification.table.user_id, userId),
                lib.isNull(lib.Schema.Notification.table.deleted_at)
            )
        )
        .returning();

    return notification[0];
}

export async function markNotificationAsDismissed(
    notificationId: number,
    userId: string
): Promise<lib.Schema.Notification.Select> {
    const notification = await lib.db
        .update(lib.Schema.Notification.table)
        .set({
            dismissed: true,
            updated_at: new Date(),
        })
        .where(
            lib.and(
                lib.eq(lib.Schema.Notification.table.id, notificationId),
                lib.eq(lib.Schema.Notification.table.user_id, userId),
                lib.isNull(lib.Schema.Notification.table.deleted_at)
            )
        )
        .returning();

    return notification[0];
}

export async function markAllNotificationsAsRead(
    userId: string
): Promise<void> {
    await lib.db
        .update(lib.Schema.Notification.table)
        .set({
            read: true,
            updated_at: new Date(),
        })
        .where(
            lib.and(
                lib.eq(lib.Schema.Notification.table.user_id, userId),
                lib.eq(lib.Schema.Notification.table.read, false),
                lib.isNull(lib.Schema.Notification.table.deleted_at)
            )
        );
}

export async function deleteNotification(
    notificationId: number,
    userId: string
): Promise<lib.Schema.Notification.Select> {
    const notification = await lib.db
        .update(lib.Schema.Notification.table)
        .set({
            deleted_at: new Date(),
        })
        .where(
            lib.and(
                lib.eq(lib.Schema.Notification.table.id, notificationId),
                lib.eq(lib.Schema.Notification.table.user_id, userId),
                lib.isNull(lib.Schema.Notification.table.deleted_at)
            )
        )
        .returning();

    return notification[0];
}
