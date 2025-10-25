import { db } from "@/lib/db/drizzle"
import * as Schema from "@/lib/db/schema"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const importance = await db.select().from(Schema.Task.Importance.table)
        return NextResponse.json(importance)
    } catch (error) {
        console.error("Error fetching importance:", error);
        return NextResponse.json({ error: "Failed to fetch importance" }, { status: 500 })
    }
}