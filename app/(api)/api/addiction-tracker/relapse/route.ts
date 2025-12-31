import { NextResponse, NextRequest } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { RelapseQueries, AddictionQueries } from "@/lib/db/queries/addiction-tracker"

// List relapses for an addiction
export async function GET(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const { searchParams } = new URL(request.url)
        const addictionIdParam = searchParams.get('addictionId')

        if (!addictionIdParam) {
            return NextResponse.json(
                { error: "Missing required query parameter: addictionId" },
                { status: 400 }
            )
        }

        const addictionId = parseInt(addictionIdParam)
        if (isNaN(addictionId)) {
            return NextResponse.json(
                { error: "Invalid addiction ID" },
                { status: 400 }
            )
        }

        // Verify addiction ownership
        const addictionResult = await AddictionQueries.getById(addictionId)
        if ("error" in addictionResult) {
            return NextResponse.json(
                { error: "Addiction not found" },
                { status: 404 }
            )
        }

        if (addictionResult.entity.user_id !== userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            )
        }

        const result = await RelapseQueries.getRelapsesForAddiction(addictionId)

        if ("error" in result) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json({ relapses: result.entities })
    } catch (error) {
        console.error('Error fetching relapses:', error)
        return NextResponse.json(
            { error: "Failed to fetch relapses" },
            { status: 500 }
        )
    }
}

// Record a new relapse
export async function POST(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const body = await request.json()
        const { addictionId, comment } = body

        // Validate required fields
        if (!addictionId) {
            return NextResponse.json(
                { error: "Missing required field: addictionId" },
                { status: 400 }
            )
        }

        // Validate data types
        if (typeof addictionId !== 'number') {
            return NextResponse.json(
                { error: "addictionId must be a number" },
                { status: 400 }
            )
        }

        if (comment !== undefined && typeof comment !== 'string') {
            return NextResponse.json(
                { error: "comment must be a string" },
                { status: 400 }
            )
        }

        // Verify addiction ownership
        const addictionResult = await AddictionQueries.getById(addictionId)
        if ("error" in addictionResult) {
            return NextResponse.json(
                { error: "Addiction not found" },
                { status: 404 }
            )
        }

        if (addictionResult.entity.user_id !== userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            )
        }

        const result = await RelapseQueries.create({
            user_id: userId,
            addiction_id: addictionId,
            comment: comment || undefined,
        })

        if ("error" in result) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { relapse: result.createdEntity },
            { status: 201 }
        )
    } catch (error) {
        console.error('Error recording relapse:', error)
        return NextResponse.json(
            { error: "Failed to record relapse" },
            { status: 500 }
        )
    }
}
