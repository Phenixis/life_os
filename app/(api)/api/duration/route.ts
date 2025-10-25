import { db } from "@/lib/db/drizzle"
import * as Schema from "@/lib/db/schema"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const durations = await db.select().from(Schema.Task.Duration.table)
        return NextResponse.json(durations)
    } catch (error) {
        console.error("Error fetching durations:", error);
        return NextResponse.json({ error: "Failed to fetch durations" }, { status: 500 })
    }
}