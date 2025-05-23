import { verifyRequest } from "@/lib/auth/api"
import { getDailyMoods } from "@/lib/db/queries/dailyMood"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")

    if (!startDateParam || !endDateParam) {
        const missingParams = [];
        if (!startDateParam) missingParams.push('startDate');
        if (!endDateParam) missingParams.push('endDate');
        return NextResponse.json({ error: `Missing required parameter(s): ${missingParams.join(', ')}` }, { status: 400 })
    }

    try {
        const startDate = new Date(startDateParam);
        const endDate = new Date(endDateParam);
        const result = await getDailyMoods(verification.userId, startDate, endDate)
        return NextResponse.json(result)
    } catch (error) {
        if (error instanceof Error && error.message.includes("No mood found")) {
            return new Response(null, { status: 204 })
        }
        console.error("Error fetching mood:", error)
        return NextResponse.json({ error: "Failed to fetch mood" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const body = await request.json()
        const { mood, date } = body

        if (mood === undefined || date === undefined) {
            return NextResponse.json({ error: "Missing required fields: mood and date" }, { status: 400 })
        }

        // Here you would typically save the mood to the database
        // For example:
        // await saveDailyMood(verification.userId, mood, new Date(date))
        throw new Error(`This is a mock error to simulate saving mood.`)

        return NextResponse.json({ message: "Mood saved successfully" }, { status: 201 })
    } catch (error: any) {
        return NextResponse.json({ error: `Failed to save mood: ${error.message}` }, { status: 500 })
    }
}