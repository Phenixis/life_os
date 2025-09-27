import { verifyRequest } from "@/lib/auth/api"
import { TaskQueries } from "@/lib/db/queries"
import { NextRequest, NextResponse } from "next/server"

// GET - Récupérer les count de tasks
export async function GET(request: NextRequest) {
	const verification = await verifyRequest(request)
	if ('error' in verification) return verification.error

	const searchParams = request.nextUrl.searchParams
	const projectTitles = searchParams.get("projectTitles")
		? searchParams.get("projectTitles")?.split(",")
		: undefined
	const excludedProjectTitles = searchParams.get("excludedProjectTitles")
		? searchParams.get("excludedProjectTitles")?.split(",")
		: undefined
	const dueAfter = searchParams.get("dueAfter")
		? new Date(searchParams.get("dueAfter") as string)
		: undefined
	const dueBefore = searchParams.get("dueBefore")
		? new Date(searchParams.get("dueBefore") as string)
		: undefined

	try {
		if (dueAfter) {
			dueAfter.setHours(0, 0, 0, 0)
		}
		if (dueBefore) {
			dueBefore.setHours(23, 59, 59, 999)
		}

		const result = await TaskQueries.getNumberOfTasks(verification.userId, projectTitles, excludedProjectTitles, dueAfter, dueBefore)
		
		return NextResponse.json(result.map((task) => ({
			...task,
			dueDate: task.due ? new Date(task.due).toISOString() : null,
		})))
	} catch (error) {
		console.error("Error fetching tasks:", error)
		return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
	}
}