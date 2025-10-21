"use server";

import {ActionState} from '@/middleware';
import {redirect} from 'next/navigation'
import {removeSession, setSession} from '@/lib/auth/session';
import {db} from "@/lib/db/drizzle"
import {eq} from "drizzle-orm"
import {verifyPassword} from "@/lib/utils/password"
import {createUser} from "@/lib/db/queries/user/user"
import {createPasswordResetRequest} from "@/lib/db/queries/user/password-reset-request"
import {User} from "@/lib/db/schema"
import {sendPasswordSetupEmail} from "@/components/utils/send_email"
import {updateDarkModeCookie} from "@/lib/cookies"
import {DarkModeCookie} from "@/lib/flags"
import {createCheckoutSession} from '../services/payments/stripe';


export async function signUp(prevState: ActionState, formData: FormData) {
    const firstName = formData.get("first_name")
    const lastName = formData.get("last_name")
    const email = formData.get("email")
    const redirectTo = formData.get("redirect")
    const priceId = formData.get('priceId') as string;

    if (!email || !firstName || !lastName || typeof email !== "string" || typeof firstName !== "string" || typeof lastName !== "string") {
        return {error: "Missing required fields"}
    }

    let user: User.User.Select

    try {
        user = await createUser(email, firstName, lastName)
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        return {error: errorMessage}
    }

    // Create a password reset request for initial password setup
    let resetRequest
    try {
        resetRequest = await createPasswordResetRequest(user.id, true)
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        return {error: `Failed to create password setup request: ${errorMessage}`}
    }

    // Send email with password setup link
    try {
        await sendPasswordSetupEmail(user, resetRequest.id)
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        return {error: errorMessage}
    }

    await updateDarkModeCookie({
        dark_mode: user.dark_mode_activated,
        auto_dark_mode: user.auto_dark_mode_enabled,
        startHour: user.dark_mode_start_hour,
        startMinute: user.dark_mode_start_minute,
        endHour: user.dark_mode_end_hour,
        endMinute: user.dark_mode_end_minute,
        override: user.dark_mode_override,
        has_jarvis_asked_dark_mode: user.has_jarvis_asked_dark_mode,
    } as DarkModeCookie)

    if (redirectTo && redirectTo === 'checkout' && priceId) {
        await createCheckoutSession({priceId, userId: user.id.toString()});
    }

    return {success: true}
}

export async function login(prevState: ActionState, formData: FormData) {
    const result = await verifyCredentials(prevState, formData)

    if (formData.get("redirectTo")) {
        if (formData.get("redirectTo") === 'checkout') {
            const priceId = formData.get('priceId') as string;
            console.log("Creating checkout session with priceId:", priceId);
            return createCheckoutSession({priceId});
        }
    }
    return result
}

export async function logout() {
    "use server"

    await removeSession();

    redirect('/login');
}

/**
 * Verify user credentials
 * @returns The user if credentials are valid, null otherwise
 * @param prevState
 * @param formData
 */
export async function verifyCredentials(prevState: ActionState, formData: FormData) {
    const id = formData.get("identifier")
    const password = formData.get("password")

    if (!id || !password || typeof id !== "string" || typeof password !== "string") {
        return {error: "Missing required fields"}
    }

    const userInfos = await db.select().from(User.User.table).where(eq(User.User.table.id, id))

    if (!userInfos || userInfos.length === 0) {
        return {error: "User not found"}
    }

    const isValid = await verifyPassword(password, userInfos[0].password)

    if (!isValid) {
        return {error: "Invalid credentials"}
    }

    const userData = userInfos[0]

    await setSession({
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        userId: userData.id
    })

    await updateDarkModeCookie({
        dark_mode: userData.dark_mode_activated,
        auto_dark_mode: userData.auto_dark_mode_enabled,
        startHour: userData.dark_mode_start_hour,
        startMinute: userData.dark_mode_start_minute,
        endHour: userData.dark_mode_end_hour,
        endMinute: userData.dark_mode_end_minute,
        override: userData.dark_mode_override,
        has_jarvis_asked_dark_mode: userData.has_jarvis_asked_dark_mode,
    } as DarkModeCookie)

    const redirectTo = formData.get("redirectTo");
    return {success: true, redirectTo: redirectTo ? redirectTo.toString() : '/my'};
} 