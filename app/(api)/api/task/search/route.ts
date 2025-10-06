import {
    TaskQueries
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
    const excludeIdsParam = searchParams.get("excludeIds")

    const excludeIds = excludeIdsParam
        ? excludeIdsParam.split(",").map((id) => Number.parseInt(id))
        : []
    

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
        const tasks = await TaskQueries.Task.searchTasksByTitle(verification.userId, query, limit)

        // Filter out tasks with excluded IDs
        const filteredTasks = tasks.filter((task) => !excludeIds.includes(task.id))

        // If no tasks are found, return an empty array
        if (filteredTasks.length === 0) {
            return NextResponse.json([])
        }

        return NextResponse.json(filteredTasks)
    } catch (error) {
        console.error("Error fetching tasks:", error)
        return NextResponse.json({
            error: "Failed to fetch tasks"
        }, {
            status: 500
        })
    }
}