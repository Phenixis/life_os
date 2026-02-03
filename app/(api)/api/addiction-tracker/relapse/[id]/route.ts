import { NextResponse, NextRequest } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { RelapseQueries, AddictionQueries } from "@/lib/db/queries/addiction-tracker"

// Update a relapse
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const { id } = await params
        const relapseId = parseInt(id)

        if (isNaN(relapseId)) {
            return NextResponse.json(
                { error: "Invalid relapse ID" },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { created_at } = body

        if (!created_at) {
            return NextResponse.json(
                { error: "Missing required field: created_at" },
                { status: 400 }
            )
        }

        // Verify relapse exists and user owns it
        const relapseResult = await RelapseQueries.getById(relapseId)
        if ("error" in relapseResult) {
            return NextResponse.json(
                { error: "Relapse not found" },
                { status: 404 }
            )
        }

        if (relapseResult.entity.user_id !== userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            )
        }

        // Verify user owns the addiction
        const addictionResult = await AddictionQueries.getById(relapseResult.entity.addiction_id)
        if ("error" in addictionResult || addictionResult.entity.user_id !== userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            )
        }

        // Update the relapse
        const updateResult = await RelapseQueries.update(relapseId, {
            created_at: new Date(created_at),
        })

        if ("error" in updateResult) {
            return NextResponse.json(
                { error: updateResult.error },
                { status: 500 }
            )
        }

        return NextResponse.json({ relapse: updateResult.updatedEntity })
    } catch (error) {
        console.error('Error updating relapse:', error)
        return NextResponse.json(
            { error: "Failed to update relapse" },
            { status: 500 }
        )
    }
}
