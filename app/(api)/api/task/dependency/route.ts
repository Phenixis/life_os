import {
    TaskQueries
} from "@/lib/db/queries"
import { type NextRequest, NextResponse } from "next/server"
import { verifyRequest } from "@/lib/auth/api"

// DELETE - Supprimer un taskToDoAfter
export async function DELETE(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    const url = new URL(request.url)
    const id1Param = url.searchParams.get("id1")
    const id2Param = url.searchParams.get("id2")

    if (!id1Param || !id2Param) {
        return NextResponse.json({ error: "Missing id1 or id2" }, { status: 400 })
    }

    const id1 = parseInt(id1Param)
    const id2 = parseInt(id2Param)
    
    try {
        let taskToDoAfter = await TaskQueries.getTaskToDoAfterById1AndId2(id1, id2)

        if (!taskToDoAfter || taskToDoAfter.length === 0) {
            taskToDoAfter = await TaskQueries.getTaskToDoAfterById1AndId2(id2, id1)
        }

        if (!taskToDoAfter || taskToDoAfter.length === 0) {
            console.error("Dependency not found between tasks:", id1, id2)
            return NextResponse.json({ error: "Dependency not found" }, { status: 404 })
        }

        const filteredDependencies = taskToDoAfter.filter((dependency) => {
            return dependency.deleted_at === null
        })

        if (filteredDependencies.length === 0) {
            console.error("No active dependencies found between tasks:", id1, id2)
            return NextResponse.json({ error: "No active dependencies found" }, { status: 404 })
        }

        // Because there can be only one active dependency between two tasks at a time, we can safely use the first element
        const dependencyId = await TaskQueries.deleteTaskToDoAfterById(filteredDependencies[0].id)

        if (!dependencyId) {
            return NextResponse.json({ error: "Failed to delete dependency" }, { status: 500 })
        }

        return NextResponse.json({ id: dependencyId })
    } catch (error) {
        console.error("Error deleting taskToDoAfter:", error)
        return NextResponse.json({ error: "Failed to delete taskToDoAfter" }, { status: 500 })
    }
}