import { verifyRequest } from "@/lib/auth/api"
import { getDailyMoods, createDailyMood, updateDailyMood, deleteDailyMood } from "@/lib/db/queries/daily-mood"
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
        const { mood, date, comment = "" } = body

        if (mood === undefined || date === undefined) {
            return NextResponse.json({ error: "Missing required fields: mood and date" }, { status: 400 })
        }

        const result = await createDailyMood(verification.userId, mood, new Date(date), comment)

        return NextResponse.json({ message: "Mood saved successfully", mood: result }, { status: 201 })
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        return NextResponse.json({ error: `Failed to save mood: ${errorMessage}` }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const body = await request.json()
        const { mood, date, comment = "" } = body

        if (mood === undefined || date === undefined) {
            return NextResponse.json({ error: "Missing required fields: mood and date" }, { status: 400 })
        }

        const result = await updateDailyMood(verification.userId, mood, new Date(date), comment)

        return NextResponse.json({ message: "Mood updated successfully", mood: result }, { status: 200 })
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        return NextResponse.json({ error: `Failed to update mood: ${errorMessage}` }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    const body = await request.json()
    const { date: dateParam } = body

    if (!dateParam) {
        return NextResponse.json({ error: "Missing required parameter: date" }, { status: 400 })
    }

    try {
        const date = new Date(dateParam)
        await deleteDailyMood(verification.userId, date)
        return NextResponse.json({ message: "Mood deleted successfully" }, { status: 200 })
    } catch (error) {
        console.error("Error deleting mood:", error)
        return NextResponse.json({ error: "Failed to delete mood" }, { status: 500 })
    }
}