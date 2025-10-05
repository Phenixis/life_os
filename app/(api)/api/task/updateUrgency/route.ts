import {
    TaskQueries
} from "@/lib/db/queries"
import { type NextRequest, NextResponse } from "next/server"
import { verifyRequest } from "@/lib/auth/api"

export async function GET(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const tasks = await TaskQueries.Task.getUncompletedTasks(verification.userId);

        for (const task of tasks) {
            const result = await TaskQueries.Task.updateTaskUrgency(verification.userId, task.id);

            if (!result) {
                throw new Error(`Task ${task.id} urgency update failed`);
            }
        }

        return NextResponse.json({ message: "Tasks urgency updated" }, { status: 200 });
    } catch (error) {
        console.error("Error updating tasks urgency:", error);
        return NextResponse.json({ error: "Failed to update tasks" }, { status: 500 })
    }
}