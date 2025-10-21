"use server"

import * as lib from "../lib"
import { nanoid } from 'nanoid'

const table = lib.Schema.User.PasswordResetRequest.table
type Existing = lib.Schema.User.PasswordResetRequest.Select

/**
 * Creates a password reset request for a user
 * @param userId - The user's ID
 * @param isInitialSetup - Whether this is for initial password setup (true) or password reset (false)
 * @returns The created password reset request
 */
export async function createPasswordResetRequest(userId: string, isInitialSetup: boolean = false): Promise<Existing> {
    // Set expiration to 24 hours from now
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const id = nanoid(36)

    const insertedRequest = await lib.db.insert(table).values({
        id,
        user_id: userId,
        is_initial_setup: isInitialSetup,
        expires_at: expiresAt
    }).returning()

    if (!insertedRequest || insertedRequest.length === 0) {
        throw new Error("Failed to create password reset request")
    }

    return insertedRequest[0]
}

/**
 * Gets a password reset request by its ID
 * @param requestId - The request ID
 * @returns The password reset request or null if not found
 */
export async function getPasswordResetRequest(requestId: string): Promise<Existing | null> {
    const request = await lib.db.select()
        .from(table)
        .where(lib.eq(table.id, requestId))
        .limit(1)

    return request.length > 0 ? request[0] : null
}

/**
 * Validates if a password reset request is valid (exists, not resolved, not expired)
 * @param requestId - The request ID
 * @returns Object with validation status and the request if valid
 */
export async function validatePasswordResetRequest(requestId: string): Promise<{
    isValid: boolean
    reason?: string
    request?: Existing
}> {
    const request = await getPasswordResetRequest(requestId)

    if (!request) {
        return { isValid: false, reason: 'Request not found' }
    }

    if (request.is_resolved) {
        return { isValid: false, reason: 'Request has already been used' }
    }

    if (new Date() > new Date(request.expires_at)) {
        return { isValid: false, reason: 'Request has expired' }
    }

    return { isValid: true, request }
}

/**
 * Marks a password reset request as resolved
 * @param requestId - The request ID
 * @returns Success status
 */
export async function markPasswordResetRequestAsResolved(requestId: string): Promise<{ success: boolean, error?: string }> {
    try {
        await lib.db
            .update(table)
            .set({
                is_resolved: true,
                resolved_at: new Date()
            })
            .where(lib.eq(table.id, requestId))

        return { success: true }
    } catch (error) {
        console.error("Failed to mark password reset request as resolved:", error)
        return { success: false, error: "Failed to mark request as resolved" }
    }
}

/**
 * Invalidates all pending password reset requests for a user
 * @param userId - The user's ID
 * @returns Success status
 */
export async function invalidateUserPasswordResetRequests(userId: string): Promise<{ success: boolean, error?: string }> {
    try {
        await lib.db
            .update(table)
            .set({
                is_resolved: true,
                resolved_at: new Date()
            })
            .where(
                lib.and(
                    lib.eq(table.user_id, userId),
                    lib.eq(table.is_resolved, false)
                )
            )

        return { success: true }
    } catch (error) {
        console.error("Failed to invalidate password reset requests:", error)
        return { success: false, error: "Failed to invalidate requests" }
    }
}
