import { TaskQueries } from "@/lib/db/queries"
import { type NextRequest, NextResponse } from "next/server"
import { verifyRequest } from "@/lib/auth/api"

// POST - Recover a deleted task
export async function POST(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const body = await request.json()
        const { id } = body

        if (!id) {
            return NextResponse.json({ error: "Missing task ID" }, { status: 400 })
        }

        const taskId = await TaskQueries.Task.recoverTaskById(verification.userId, Number(id))

        if (!taskId) {
            return NextResponse.json({ error: "Task not found or already recovered" }, { status: 404 })
        }

        return NextResponse.json({ id: taskId })
    } catch (error) {
        console.error("Error recovering task:", error)
        return NextResponse.json({ error: "Failed to recover task" }, { status: 500 })
    }
}

// GET - Get deleted tasks
export async function GET(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const searchParams = request.nextUrl.searchParams
        const limitParam = searchParams.get("limit")
        const limit = limitParam ? Number.parseInt(limitParam) : 50

        const tasks = await TaskQueries.Task.getDeletedTasks(verification.userId, "deleted_at", "desc", limit)

        return NextResponse.json(tasks)
    } catch (error) {
        console.error("Error fetching deleted tasks:", error)
        return NextResponse.json({ error: "Failed to fetch deleted tasks" }, { status: 500 })
    }
}

// DELETE - Permanently delete a task
export async function DELETE(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const url = new URL(request.url)
        const idParam = url.searchParams.get("id")

        if (!idParam) {
            return NextResponse.json({ error: "Missing task ID" }, { status: 400 })
        }

        const id = Number(idParam)

        // Delete any task dependency relationships before permanent deletion
        await TaskQueries.Task.deleteTaskToDoAfterByTodoId(id)
        await TaskQueries.Task.deleteTaskToDoAfterByAfterId(id)

        const taskId = await TaskQueries.Task.permanentlyDeleteTaskById(verification.userId, id)

        if (!taskId) {
            return NextResponse.json({ error: "Task not found or not in trash" }, { status: 404 })
        }

        return NextResponse.json({ id: taskId })
    } catch (error) {
        console.error("Error permanently deleting task:", error)
        return NextResponse.json({ error: "Failed to permanently delete task" }, { status: 500 })
    }
}
