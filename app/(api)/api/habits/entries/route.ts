import { verifyRequest } from "@/lib/auth/api"
import * as HabitEntryQueries from "@/lib/db/queries/habit/entry"
import { NextRequest, NextResponse } from "next/server"

// Get all user habit entries for a date range
export async function GET(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const { searchParams } = new URL(request.url)
        const startDateParam = searchParams.get('startDate')
        const endDateParam = searchParams.get('endDate')

        let startDate: Date | undefined
        let endDate: Date | undefined

        if (startDateParam) {
            startDate = new Date(startDateParam)
            if (isNaN(startDate.getTime())) {
                return NextResponse.json(
                    { error: "Invalid start date format" },
                    { status: 400 }
                )
            }
        }

        if (endDateParam) {
            endDate = new Date(endDateParam)
            if (isNaN(endDate.getTime())) {
                return NextResponse.json(
                    { error: "Invalid end date format" },
                    { status: 400 }
                )
            }
        }

        const entries = await HabitEntryQueries.getUserHabitEntries(
            userId,
            startDate,
            endDate
        )

        return NextResponse.json({ entries })
    } catch (error) {
        console.error('Error fetching user habit entries:', error)
        return NextResponse.json(
            { error: "Failed to fetch user habit entries" },
            { status: 500 }
        )
    }
}
