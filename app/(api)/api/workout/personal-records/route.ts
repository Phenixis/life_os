import { NextResponse, NextRequest } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import * as PersonalRecordsQueries from "@/lib/db/queries/workout/personal-records"

// Get personal records (best set by weight for each exercise)
export async function GET(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const personalRecords = await PersonalRecordsQueries.getPersonalRecords(userId)

        return NextResponse.json({ personalRecords })
    } catch (error) {
        console.error('Error fetching personal records:', error)
        return NextResponse.json(
            { error: "Failed to fetch personal records" },
            { status: 500 }
        )
    }
}
