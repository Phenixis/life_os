import { db } from "@/lib/db/drizzle"
import { eq } from "drizzle-orm"
import * as Schema from "@/lib/db/schema"
import { NextRequest, NextResponse } from "next/server"

export async function verifyApiKey(apiKey: string | null) {
    if (!apiKey) {
        return { isValid: false, error: 'Missing API key' }
    }

    if (apiKey === process.env.CRON_SECRET) {
        return { isValid: true, userId: "cron" }
    }

    const user = await db.select().from(Schema.User.User.table).where(eq(Schema.User.User.table.api_key, apiKey))
    
    if (!user || user.length === 0) {
        return { isValid: false, error: 'Invalid API key' }
    }

    return { isValid: true, userId: user[0].id }
} 

// Helper function to verify API key and get user ID
export async function verifyRequest(request: NextRequest) {
	const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '')
	if (!apiKey) {
		return { error: NextResponse.json({ error: "Missing API key"}, { status: 401 }), userId: "-1"}
	}
	const verification = await verifyApiKey(apiKey)
	
	if (!verification.isValid || !verification.userId) {
		return { error: NextResponse.json({ error: verification.error}, { status: 401 }), userId: "-1" }
	}

	return { userId: verification.userId }
}