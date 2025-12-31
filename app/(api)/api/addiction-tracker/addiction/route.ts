import { NextResponse, NextRequest } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { AddictionQueries } from "@/lib/db/queries/addiction-tracker"

// List all addictions for the authenticated user
export async function GET(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const result = await AddictionQueries.getAllForUser(userId)

        if ("error" in result) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            )
        }

        return NextResponse.json({ addictions: result.entities })
    } catch (error) {
        console.error('Error fetching addictions:', error)
        return NextResponse.json(
            { error: "Failed to fetch addictions" },
            { status: 500 }
        )
    }
}

// Create a new addiction
export async function POST(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const body = await request.json()
        const { title, description } = body

        // Validate required fields
        if (!title) {
            return NextResponse.json(
                { error: "Missing required field: title" },
                { status: 400 }
            )
        }

        // Validate data types
        if (typeof title !== 'string') {
            return NextResponse.json(
                { error: "Title must be a string" },
                { status: 400 }
            )
        }

        if (description !== undefined && typeof description !== 'string') {
            return NextResponse.json(
                { error: "Description must be a string" },
                { status: 400 }
            )
        }

        // Validate title length
        if (title.length > 255) {
            return NextResponse.json(
                { error: "Title must be 255 characters or less" },
                { status: 400 }
            )
        }

        // Validate description length
        if (description && description.length > 1000) {
            return NextResponse.json(
                { error: "Description must be 1000 characters or less" },
                { status: 400 }
            )
        }

        const result = await AddictionQueries.create({
            user_id: userId,
            title,
            description: description || null,
        })

        if ("error" in result) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            )
        }

        // Fetch the created addiction with relapse stats
        const addictionResult = await AddictionQueries.getByIds([result.createdEntity.id])

        if ("error" in addictionResult) {
            return NextResponse.json(
                { addiction: result.createdEntity },
                { status: 201 }
            )
        }

        return NextResponse.json(
            { addiction: addictionResult.entities[0] },
            { status: 201 }
        )
    } catch (error) {
        console.error('Error creating addiction:', error)
        return NextResponse.json(
            { error: "Failed to create addiction" },
            { status: 500 }
        )
    }
}
