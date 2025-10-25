"use server"

import * as lib from "../lib"
import {hashPassword} from "@/lib/utils/password"
import {getClientSession} from "@/lib/auth/session"
import {DarkModeCookie} from "@/lib/flags"

const table = lib.Schema.User.User.table
type Existing = lib.Schema.User.User.Select

/**
 * Generates a unique 8-digit number ID for users
 * @returns A promise that resolves to a unique 8-digit number
 */
export async function generateUniqueUserId(): Promise<string> {
    while (true) {
        // Generate a random 8-digit number
        let id = (Math.floor(10000000 + Math.random() * 90000000)).toString()

        while (id.length < 8) {
            id = "0" + id
        }

        // Check if the ID already exists
        const existingUser = await lib.db.select({
            id: table.id
        })
            .from(table)
            .where(lib.eq(table.id, id));

        if (!existingUser || existingUser.length === 0) {
            return id
        }
    }
}

/**
 * Generates a random 8-digit number for a user's password
 * @returns A random 8-digit number
 */
export async function generateUserPassword(): Promise<string> {
    // Generate a random 8-digit number
    let password = (Math.floor(10000000 + Math.random() * 90000000)).toString()

    while (password.length < 8) {
        password = "0" + password
    }

    return password
}

/**
 * Generates an API key for users
 * @returns A promise that resolves to a unique API key starting with "md_"
 */
export async function generateUniqueApiKey(): Promise<string> {
    while (true) {
        // Generate a random alphanumeric string of length 20
        const randomPart = Math.random().toString(36).substring(2, 12) +
            Math.random().toString(36).substring(2, 12)

        const apiKey = `md_${randomPart}`

        const existingUser = await lib.db.select({
            api_key: table.api_key
        }).from(table).where(lib.eq(table.api_key, apiKey))

        if (!existingUser || existingUser.length === 0) {
            return apiKey
        }
    }
}

/**
 * Create a new user with a placeholder password (will be set via reset request)
 * @returns The created user
 * @param email
 * @param first_name
 * @param last_name
 */
export async function createUser(
    email: string,
    first_name: string,
    last_name: string,
) {
    const existingUser = await lib.db.select().from(table).where(lib.eq(table.email, email))

    if (existingUser && existingUser.length > 0) {
        throw new Error("User already exists")
    }

    // Generate a temporary strong password that will be replaced when user sets their own
    const tempPassword = await generateUserPassword()
    const hashedPassword = await hashPassword(tempPassword)
    const apiKey = await generateUniqueApiKey()
    const id = await generateUniqueUserId()

    const insertedUser = await lib.db.insert(table).values({
        email: email,
        first_name: first_name,
        last_name: last_name,
        password: hashedPassword,
        api_key: apiKey,
        id: id
    }).returning()

    if (!insertedUser || insertedUser.length === 0) {
        throw new Error("Failed to create user")
    }

    return insertedUser[0]
}

export async function getUserId() {
    const session = await getClientSession();

    if (!session) {
        return null;
    }

    if (new Date(session.expires) < new Date()) {
        return null;
    }

    return session.userId;

}

export async function getUser(id?: string): Promise<Existing | null> {
    const userId = id || await getUserId();

    if (!userId) {
        return null
    }

    const user = await lib.db.select()
        .from(table)
        .where(lib.eq(table.id, userId))
        .limit(1)

    if (!user || user.length === 0) {
        throw new Error("User not found")
    }

    return user[0]
}

export async function getUserByEmail(email: string) {
    const user = await lib.db.select()
        .from(table)
        .where(lib.eq(table.email, email))
        .limit(1)

    return user.length > 0 ? user[0] : null
}

export async function getUserByApiKey(apiKey: string) {
    const user = await lib.db.select()
        .from(table)
        .where(lib.eq(table.api_key, apiKey))
        .limit(1)

    return user.length > 0 ? user[0] : null
}

export async function getUserPreferences(id?: string) {
    const userId = id || await getUserId();

    if (!userId) {
        return null
    }

    const user = await lib.db.select({
        has_jarvis_asked_dark_mode: table.has_jarvis_asked_dark_mode,
        dark_mode: table.dark_mode_activated,
        auto_dark_mode: table.auto_dark_mode_enabled,
        startHour: table.dark_mode_start_hour,
        endHour: table.dark_mode_end_hour,
        startMinute: table.dark_mode_start_minute,
        endMinute: table.dark_mode_end_minute,
        override: table.dark_mode_override
    }).from(table)
        .where(lib.eq(table.id, userId))
        .limit(1)

    if (!user || user.length === 0) {
        return null
    }

    return {
        userId,
        darkModeCookie: user[0] as DarkModeCookie
    }
}

export async function getUserDraftNote(id?: string) {
    const userId = id || await getUserId();

    if (!userId) {
        return null
    }

    const draftNote = await lib.db.select({
        note_title: table.note_draft_title,
        note_content: table.note_draft_content,
        note_project_title: table.note_draft_project_title,
    })
        .from(table)
        .where(lib.eq(table.id, userId))
        .limit(1)

    if (!draftNote || draftNote.length === 0) {
        return null
    }

    return draftNote[0]
}

export async function getAllUsers() {
    const users = await lib.db.select().from(table)

    return users
}

export async function updateDarkModePreferences({
                                                    userId,
                                                    darkModeCookie
                                                }: {
    userId: string
    darkModeCookie: DarkModeCookie
}) {
    try {
        await lib.db
            .update(table)
            .set({
                has_jarvis_asked_dark_mode: darkModeCookie.has_jarvis_asked_dark_mode,
                dark_mode_activated: darkModeCookie.dark_mode,
                auto_dark_mode_enabled: darkModeCookie.auto_dark_mode,
                dark_mode_start_hour: darkModeCookie.startHour,
                dark_mode_end_hour: darkModeCookie.endHour,
                dark_mode_start_minute: darkModeCookie.startMinute,
                dark_mode_end_minute: darkModeCookie.endMinute,
                dark_mode_override: darkModeCookie.override
            })
            .where(lib.eq(table.id, userId))

        // Revalidate the flags to update the theme
        lib.revalidateTag("flags")

        return {success: true}
    } catch (error) {
        console.error("Failed to update dark mode preferences:", error)
        return {success: false, error: "Failed to update preferences"}
    }
}

export async function updateUserDraftNote({
                                              userId,
                                              note_title,
                                              note_content,
                                              note_project_title
                                          }: {
    userId: string
    note_title: string
    note_content: string
    note_project_title: string
}) {
    try {
        await lib.db
            .update(table)
            .set({
                note_draft_title: note_title,
                note_draft_content: note_content,
                note_draft_project_title: note_project_title
            })
            .where(lib.eq(table.id, userId))

        return {success: true}
    } catch (error) {
        console.error("Failed to update draft note:", error)
        return {success: false, error: "Failed to update draft"}
    }
}

export async function updateUserProfile({
                                            userId,
                                            first_name,
                                            last_name,
                                            email
                                        }: {
    userId: string
    first_name: string
    last_name: string
    email: string
}) {
    try {
        await lib.db
            .update(table)
            .set({
                first_name: first_name,
                last_name: last_name,
                email: email,
                updated_at: new Date(),
            })
            .where(lib.eq(table.id, userId))

        return {success: true}
    } catch (error) {
        console.error("Failed to update user profile:", error)
        return {success: false, error: "Failed to update profile"}
    }
}

export async function updateUserPassword({
                                             userId,
                                             newPassword
                                         }: {
    userId: string
    newPassword: string
}) {
    try {
        const hashedPassword = await hashPassword(newPassword)

        await lib.db
            .update(table)
            .set({
                password: hashedPassword,
                updated_at: new Date(),
            })
            .where(lib.eq(table.id, userId))

        return {success: true}
    } catch (error) {
        console.error("Failed to update user password:", error)
        return {success: false, error: "Failed to update password"}
    }
}

/**
 * Updates a user's Stripe customer ID
 * @param userId - The user's ID
 * @param stripeCustomerId - The Stripe customer ID
 * @returns A promise that resolves to the update result
 */
export async function updateUserStripeCustomerId(userId: string, stripeCustomerId: string) {
    try {
        await lib.db
            .update(table)
            .set({
                stripe_customer_id: stripeCustomerId,
                updated_at: new Date()
            })
            .where(lib.eq(table.id, userId))

        lib.revalidateTag(`user-${userId}`)

        return {success: true}
    } catch (error) {
        console.error("Error updating user Stripe customer ID:", error)
        return {
            success: false,
            error: "Failed to update Stripe customer ID"
        }
    }
}