import {
    ProjectQueries
} from "@/lib/db/queries"
import {
    type NextRequest,
    NextResponse
} from "next/server"
import { verifyRequest } from "@/lib/auth/api"

export async function GET(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query")

    if (!query) {
        return NextResponse.json({
            error: "Missing 'query' parameter"
        }, {
            status: 400
        })
    }

    const limitParam = searchParams.get("limit")
    const limit = limitParam ? Number.parseInt(limitParam) : undefined

    try {
        const projects = await ProjectQueries.searchProjects(verification.userId, query, limit)
        return NextResponse.json(projects)
    } catch (error) {
        console.error("Error fetching projects:", error)
        return NextResponse.json({
            error: "Failed to fetch projects"
        }, {
            status: 500
        })
    }
}