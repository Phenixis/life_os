"use server"

import {
	desc,
	asc,
	eq,
	isNull,
	isNotNull,
	sql,
	and,
	or,
	lte,
	gte,
	inArray,
	not,
} from "drizzle-orm"
import { db } from "./drizzle"
import * as Schema from "./schema"
import { revalidatePath } from "next/cache"
import { calculateUrgency } from "@/lib/utils/task"
import { alias } from "drizzle-orm/pg-core"

const taskToDoAfterAlias = alias(Schema.taskToDoAfter, 'taskToDoAfter');
const taskToDoBeforeAlias = alias(Schema.taskToDoAfter, 'taskToDoBefore');

// # TASK

// ## Create
export async function createTask(title: string, importance: number, dueDate: Date, duration: number, project?: string, userId?: string) {
	const urgency = calculateUrgency(dueDate)

	const result = await db
		.insert(Schema.task)
		.values({
			title: title,
			importance: importance,
			urgency: urgency,
			duration: duration,
			score: importance * urgency - duration,
			due: dueDate,
			project_title: project,
			user_id: userId,
		} as Schema.NewTask)
		.returning({ id: Schema.task.id })

	// Revalidate all pages that might show todos
	revalidatePath("/my", 'layout')

	return result[0].id
}

// ## Read
export async function getTaskById(id: number, recursive: boolean = false) {
	const dbresult = await db
		.select({
			id: Schema.task.id,
			title: Schema.task.title,
			importance: Schema.task.importance,
			duration: Schema.task.duration,
			urgency: Schema.task.urgency,
			score: Schema.task.score,
			due: Schema.task.due,
			project_title: Schema.task.project_title,
			completed_at: Schema.task.completed_at,
			created_at: Schema.task.created_at,
			updated_at: Schema.task.updated_at,
			deleted_at: Schema.task.deleted_at,
			user_id: Schema.task.user_id,
			project: {
				title: Schema.project.title,
				description: Schema.project.description,
				completed: Schema.project.completed,
				created_at: Schema.project.created_at,
				updated_at: Schema.project.updated_at,
				deleted_at: Schema.project.deleted_at,
				user_id: Schema.project.user_id,
			},
			importanceDetails: {
				level: Schema.importance.level,
				name: Schema.importance.name,
			},
			durationDetails: {
				level: Schema.duration.level,
				name: Schema.duration.name,
			},
			tasksToDoAfter: {
				id: taskToDoAfterAlias.id,
				task_id: taskToDoAfterAlias.task_id,
				after_task_id: taskToDoAfterAlias.after_task_id,
				created_at: taskToDoAfterAlias.created_at,
				updated_at: taskToDoAfterAlias.updated_at,
				deleted_at: taskToDoAfterAlias.deleted_at,
			},
			tasksToDoBefore: {
				id: taskToDoBeforeAlias.id,
				task_id: taskToDoBeforeAlias.task_id,
				after_task_id: taskToDoBeforeAlias.after_task_id,
				created_at: taskToDoBeforeAlias.created_at,
				updated_at: taskToDoBeforeAlias.updated_at,
				deleted_at: taskToDoBeforeAlias.deleted_at,
			},
		})
		.from(Schema.task)
		.leftJoin(Schema.project, eq(Schema.task.project_title, Schema.project.title))
		.leftJoin(Schema.importance, eq(Schema.task.importance, Schema.importance.level))
		.leftJoin(Schema.duration, eq(Schema.task.duration, Schema.duration.level))
		.leftJoin(taskToDoAfterAlias, eq(Schema.task.id, taskToDoAfterAlias.task_id)) // tasks to do after this task
		.leftJoin(taskToDoBeforeAlias, eq(Schema.task.id, taskToDoBeforeAlias.after_task_id)) // tasks to do before this task
		.where(and(
			eq(Schema.task.id, id),
		))

	if (recursive) {
		const result: any = {
			...dbresult[0],
			tasksToDoAfter: [],
			tasksToDoBefore: [],
			importanceDetails: dbresult[0].importanceDetails!,
			durationDetails: dbresult[0].durationDetails!,
			recursive: true,
		}

		for (const row of dbresult) {
			const taskId = row.id;

			if (row.tasksToDoAfter?.after_task_id) {
				const afterTaskId = row.tasksToDoAfter.after_task_id;
				if (dbresult[taskId].tasksToDoAfter && dbresult[taskId].tasksToDoAfter.deleted_at === null && !(dbresult[taskId].tasksToDoAfter.id === afterTaskId)) {
					const fullTask = await getTaskById(afterTaskId);
					if (fullTask) result.tasksToDoAfter.push(fullTask);
				}
			}

			if (row.tasksToDoBefore?.task_id) {
				const beforeTaskId = row.tasksToDoBefore.task_id;
				if (dbresult[taskId].tasksToDoBefore && dbresult[taskId].tasksToDoBefore.deleted_at === null && !(dbresult[taskId].tasksToDoBefore.id === beforeTaskId)) {
					const fullTask = await getTaskById(beforeTaskId);
					if (fullTask) result.tasksToDoBefore.push(fullTask);
				}
			}
		}

		return result as Schema.TaskWithRelations;
	} else {
		return dbresult[0] ? { ...dbresult[0], recursive: false } as Schema.TaskWithNonRecursiveRelations : null;
	}

}

export async function getNumberOfTasks(userId: string, projectTitles?: string[], excludedProjectTitles?: string[], dueAfter?: Date, dueBefore?: Date) {
	const dbresult = await db
		.select({
			completed_count: sql<number>`COUNT(CASE WHEN ${Schema.task.completed_at} IS NOT NULL THEN 1 END)`.as("completed_count"),
			uncompleted_count: sql<number>`COUNT(CASE WHEN ${Schema.task.completed_at} IS NULL THEN 1 END)`.as("uncompleted_count"),
			due: Schema.task.due,
		})
		.from(Schema.task)
		.where(and(
			isNull(Schema.task.deleted_at),
			eq(Schema.task.user_id, userId),
			projectTitles
				? or(
					inArray(Schema.task.project_title, projectTitles),
					sql`${isNull(Schema.task.project_title)} AND ${projectTitles.includes("No project")}`,
				)
				: sql`1 = 1`,
			excludedProjectTitles && excludedProjectTitles.length > 0
				? and(
					or(
						isNull(Schema.task.project_title),
						not(inArray(
							Schema.task.project_title,
							excludedProjectTitles.filter(p => p !== "No project")
						))
					),
					excludedProjectTitles.includes("No project")
						? isNotNull(Schema.task.project_title)
						: sql`1 = 1`
				)
				: sql`1 = 1`,
			dueAfter ? gte(Schema.task.due, dueAfter) : sql`1 = 1`,
			dueBefore ? lte(Schema.task.due, dueBefore) : sql`1 = 1`
		))
		.groupBy(Schema.task.due)

	return dbresult;
}

export async function getTasks(
	userId: string,
	orderBy: keyof Schema.Task = "score",
	orderingDirection?: "asc" | "desc",
	limit = 50,
	projectTitles?: string[],
	excludedProjectTitles?: string[],
	dueBefore?: Date,
	dueAfter?: Date,
	completed?: boolean,
	completed_after?: Date,
	completed_before?: Date,
) {
	// Step 1: First query to get distinct tasks with limit applied
	const distinctTasks = await db
		.select({
			id: Schema.task.id,
			title: Schema.task.title,
			importance: Schema.task.importance,
			urgency: Schema.task.urgency,
			duration: Schema.task.duration,
			due: Schema.task.due,
			score: Schema.task.score,
			completed_at: Schema.task.completed_at,
			created_at: Schema.task.created_at,
			updated_at: Schema.task.updated_at,
			deleted_at: Schema.task.deleted_at,
			project_title: Schema.task.project_title,
			user_id: Schema.task.user_id,
		})
		.from(Schema.task)
		.where(
			and(
				isNull(Schema.task.deleted_at),
				// Filter by user ID if provided
				eq(Schema.task.user_id, userId),
				// Include specific projects if provided
				projectTitles
					? or(
						inArray(Schema.task.project_title, projectTitles),
						sql`${isNull(Schema.task.project_title)} AND ${projectTitles.includes("No project")}`,
					)
					: sql`1 = 1`,
				// Exclude specific projects if provided
				excludedProjectTitles && excludedProjectTitles.length > 0
					? and(
						// For tasks with project titles
						or(
							isNull(Schema.task.project_title),
							not(inArray(
								Schema.task.project_title,
								excludedProjectTitles.filter(p => p !== "No project")
							))
						),
						// For tasks with null project title ("No project")
						excludedProjectTitles.includes("No project")
							? isNotNull(Schema.task.project_title)
							: sql`1 = 1`
					)
					: sql`1 = 1`,
				dueBefore ? lte(Schema.task.due, dueBefore) : sql`1 = 1`,
				dueAfter ? gte(Schema.task.due, dueAfter) : sql`1 = 1`,
				completed !== undefined
					? completed
						? isNotNull(Schema.task.completed_at)
						: isNull(Schema.task.completed_at)
					: sql`1 = 1`,
				completed_after ? gte(Schema.task.completed_at, completed_after) : sql`1 = 1`,
				completed_before ? lte(Schema.task.completed_at, completed_before) : sql`1 = 1`,
			),
		)
		.orderBy(
			orderingDirection === "asc" ? asc(Schema.task[orderBy]) : desc(Schema.task[orderBy]),
			orderingDirection === "asc" ? asc(Schema.task.title) : desc(Schema.task.title),
		)
		.limit(limit === -1 ? Number.MAX_SAFE_INTEGER : limit)

	if (distinctTasks.length === 0) return []

	// Get the IDs of the distinct tasks
	const taskIds = distinctTasks.map((task) => task.id)

	// Step 2: Now fetch all related data for these specific tasks
	const rows = await db
		.select({
			id: Schema.task.id,
			title: Schema.task.title,
			importance: Schema.task.importance,
			urgency: Schema.task.urgency,
			duration: Schema.task.duration,
			due: Schema.task.due,
			score: Schema.task.score,
			completed_at: Schema.task.completed_at,
			created_at: Schema.task.created_at,
			updated_at: Schema.task.updated_at,
			deleted_at: Schema.task.deleted_at,
			project_title: Schema.task.project_title,
			user_id: Schema.task.user_id,
			project: {
				title: Schema.project.title,
				description: Schema.project.description,
				completed: Schema.project.completed,
				created_at: Schema.project.created_at,
				updated_at: Schema.project.updated_at,
				deleted_at: Schema.project.deleted_at,
				user_id: Schema.project.user_id,
			},
			importanceDetails: {
				level: Schema.importance.level,
				name: Schema.importance.name,
			},
			durationDetails: {
				level: Schema.duration.level,
				name: Schema.duration.name,
			},
			tasksToDoAfter: {
				id: taskToDoAfterAlias.id,
				task_id: taskToDoAfterAlias.task_id,
				after_task_id: taskToDoAfterAlias.after_task_id,
				created_at: taskToDoAfterAlias.created_at,
				updated_at: taskToDoAfterAlias.updated_at,
				deleted_at: taskToDoAfterAlias.deleted_at,
			},
			tasksToDoBefore: {
				id: taskToDoBeforeAlias.id,
				task_id: taskToDoBeforeAlias.task_id,
				after_task_id: taskToDoBeforeAlias.after_task_id,
				created_at: taskToDoBeforeAlias.created_at,
				updated_at: taskToDoBeforeAlias.updated_at,
				deleted_at: taskToDoBeforeAlias.deleted_at,
			},
		})
		.from(Schema.task)
		.leftJoin(Schema.project, eq(Schema.task.project_title, Schema.project.title))
		.leftJoin(Schema.importance, eq(Schema.task.importance, Schema.importance.level))
		.leftJoin(Schema.duration, eq(Schema.task.duration, Schema.duration.level))
		.leftJoin(taskToDoAfterAlias, eq(Schema.task.id, taskToDoAfterAlias.task_id))
		.leftJoin(taskToDoBeforeAlias, eq(Schema.task.id, taskToDoBeforeAlias.after_task_id))
		.where(inArray(Schema.task.id, taskIds))

	const groupedTasks: Record<string, Schema.TaskWithRelations> = {}

	for (const row of rows) {
		const taskId = row.id

		if (!groupedTasks[taskId]) {
			groupedTasks[taskId] = {
				...row,
				tasksToDoAfter: [],
				tasksToDoBefore: [],
				importanceDetails: row.importanceDetails!,
				durationDetails: row.durationDetails!,
				recursive: true,
			}
		}

		// For after tasks
		if (row.tasksToDoAfter?.after_task_id) {
			const afterTaskId = row.tasksToDoAfter.after_task_id
			if (
				groupedTasks[taskId].tasksToDoAfter &&
				row.tasksToDoAfter.deleted_at === null &&
				!groupedTasks[taskId].tasksToDoAfter.some((t) => t.id === afterTaskId && t.deleted_at === null)
			) {
				const fullTask = await getTaskById(afterTaskId)
				if (fullTask && fullTask.recursive === false) {
					groupedTasks[taskId].tasksToDoAfter.push(fullTask)
				}
			}
		}

		// For before tasks
		if (row.tasksToDoBefore?.task_id) {
			const beforeTaskId = row.tasksToDoBefore.task_id
			if (
				groupedTasks[taskId].tasksToDoBefore &&
				row.tasksToDoBefore.deleted_at === null &&
				!groupedTasks[taskId].tasksToDoBefore.some((t) => t.id === beforeTaskId)
			) {
				const fullTask = await getTaskById(beforeTaskId)
				if (fullTask && fullTask.recursive === false) {
					groupedTasks[taskId].tasksToDoBefore.push(fullTask)
				}
			}
		}
	}

	// Preserve the original ordering from distinctTasks
	const result = taskIds.map((id) => groupedTasks[id]).filter(Boolean).sort((a, b) => b.score - a.score || (a.title || "").localeCompare(b.title))

	return result as Schema.TaskWithRelations[]
}

export async function getCompletedTasks(userId: string, orderBy: keyof Schema.Task = "completed_at", orderingDirection?: "asc" | "desc", limit = 50, projectTitles?: string[], excludedProjectTitles?: string[], dueBefore?: Date, dueAfter?: Date) {
	return getTasks(userId, orderBy, orderingDirection, limit, projectTitles, excludedProjectTitles, dueBefore, dueAfter, true);
}

export async function getUncompletedTasks(userId: string, orderBy: keyof Schema.Task = "score", orderingDirection?: "asc" | "desc", limit = 50, projectTitles?: string[], excludedProjectTitles?: string[], dueBefore?: Date, dueAfter?: Date) {
	return getTasks(userId, orderBy, orderingDirection, limit, projectTitles, excludedProjectTitles, dueBefore, dueAfter, false);
}

export async function searchTasksByTitle(userId: string, title: string, limit = 50) {
	return await db
		.select()
		.from(Schema.task)
		.where(and(
			sql`LOWER(${Schema.task.title}) LIKE LOWER(${`%${title}%`})`,
			eq(Schema.task.user_id, userId),
			isNull(Schema.task.deleted_at),
			isNull(Schema.task.completed_at),
		))
		.limit(limit === -1 ? Number.MAX_SAFE_INTEGER : limit) as Schema.Task[]
}

export async function getUncompletedAndDueInTheNextThreeDaysOrLessTasks(userId: string, orderBy: keyof Schema.Task = "score", orderingDirection?: "asc" | "desc") {
	const today = new Date()
	const threeDaysFromNow = new Date(today)
	threeDaysFromNow.setDate(today.getDate() + 3)

	return getTasks(userId, orderBy, orderingDirection, -1, undefined, undefined, threeDaysFromNow, undefined, false);
}

export async function getTasksCompletedTheDayBefore(userId: string, orderBy: keyof Schema.Task = "completed_at", orderingDirection: "asc" | "desc" = "asc") {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const yesterday = new Date(today)
	yesterday.setDate(today.getDate() - 1)

	return getTasks(userId, orderBy, orderingDirection, -1, undefined, undefined, undefined, undefined, true, yesterday, today);
}

// ## Update
export async function updateTask(userId: string, id: number, title: string, importance: number, dueDate: Date, duration: number, projectTitle?: string) {
	const urgency = calculateUrgency(dueDate)

	const result = await db
		.update(Schema.task)
		.set({
			title: title,
			importance: importance,
			urgency: urgency,
			duration: duration,
			due: dueDate,
			score: importance * urgency - duration,
			project_title: projectTitle,
			updated_at: sql`CURRENT_TIMESTAMP`,
		})
		.where(and(
			eq(Schema.task.id, id),
			eq(Schema.task.user_id, userId),
		))
		.returning({ id: Schema.task.id })

	// Revalidate all pages that might show todos
	revalidatePath("/my", 'layout')

	if (!result) {
		return null
	}

	return result[0].id
}

export async function updateTaskUrgency(userId: string, id: number) {
	const todoData = await getTaskById(id)
	if (!todoData) {
		return null
	}

	const urgency = calculateUrgency(todoData.due)

	const result = await db
		.update(Schema.task)
		.set({
			urgency: urgency,
			score: todoData.importance * urgency - todoData.duration,
			updated_at: sql`CURRENT_TIMESTAMP`,
		})
		.where(and(
			eq(Schema.task.id, id),
			eq(Schema.task.user_id, userId),
		))
		.returning({ id: Schema.task.id })

	// Revalidate all pages that might show todos
	revalidatePath("/my", 'layout')

	if (!result) {
		return null
	}

	return result[0].id
}

export async function markTaskAsDone(userId: string, id: number) {
	const result = await db
		.update(Schema.task)
		.set({
			completed_at: sql`CURRENT_TIMESTAMP`,
			updated_at: sql`CURRENT_TIMESTAMP`,
		})
		.where(and(
			eq(Schema.task.id, id),
			eq(Schema.task.user_id, userId),
		))
		.returning({ id: Schema.task.id })

	// Revalidate all pages that might show todos
	revalidatePath("/my", 'layout')

	if (!result) {
		return null
	}

	return result[0].id
}

export async function markTaskAsUndone(userId: string, id: number) {
	const result = await db
		.update(Schema.task)
		.set({
			completed_at: null,
			updated_at: sql`CURRENT_TIMESTAMP`,
		})
		.where(and(
			eq(Schema.task.id, id),
			eq(Schema.task.user_id, userId),
		))
		.returning({ id: Schema.task.id })

	// Revalidate all pages that might show todos
	revalidatePath("/my", 'layout')

	return result[0].id
}

export async function toggleTask(userId: string, id: number, currentState: boolean) {
	return currentState ? await markTaskAsUndone(userId, id) : await markTaskAsDone(userId, id);
}

// ## Delete
export async function deleteTaskById(userId: string, id: number) {
	const result = await db.update(Schema.task)
		.set({ deleted_at: sql`CURRENT_TIMESTAMP`, updated_at: sql`CURRENT_TIMESTAMP` })
		.where(and(
			eq(Schema.task.id, id),
			eq(Schema.task.user_id, userId),
		))
		.returning({ id: Schema.task.id })

	// Revalidate all pages that might show todos
	revalidatePath("/my", 'layout')

	if (result && result.length > 0) {
		return result[0].id
	}

	return null
}

// # Meteo

// ## Create

export async function createMeteo(userId: string, dayOrMeteo: string | Schema.NewMeteo, temperature?: number, summary?: string, icon?: string, latitude?: string, longitude?: string) {
	let newMeteo: Schema.NewMeteo;

	if (typeof dayOrMeteo === "string") {
		newMeteo = {
			day: dayOrMeteo,
			latitude: latitude!,
			longitude: longitude!,
			temperature: temperature!,
			summary: summary!,
			icon: icon!,
		};
	} else {
		newMeteo = dayOrMeteo;
	}

	newMeteo.latitude = (newMeteo.latitude || "-1").slice(0, 10);
	newMeteo.longitude = (newMeteo.longitude || "-1").slice(0, 10);

	const result = await db
		.insert(Schema.meteo)
		.values({
			...newMeteo,
			user_id: userId,
		})
		.returning({ day: Schema.meteo.day });

	// Revalidate all pages that might show meteo
	revalidatePath("/my", 'layout');

	return result[0].day;
}

// ## Read

export async function getMeteoByDay(userId: string, day: string) {
	console.log("Getting meteo for user:", userId, "and day:", day);
	return await db
		.select()
		.from(Schema.meteo)
		.where(and(
			eq(Schema.meteo.day, day),
			eq(Schema.meteo.user_id, userId),
		)) as Schema.Meteo[]
}

export async function getMeteo(userId: string) {
	return await db
		.select()
		.from(Schema.meteo)
		.where(eq(Schema.meteo.user_id, userId)) as Schema.Meteo[]
};

// ## Update

export async function updateMeteo(userId: string, dayOrMeteo: string | Schema.NewMeteo, temperature?: number, summary?: string, icon?: string, latitude?: string, longitude?: string) {
	let updatedMeteo: Partial<Schema.NewMeteo>;

	if (typeof dayOrMeteo === "string") {
		updatedMeteo = {
			day: dayOrMeteo,
			latitude: latitude!,
			longitude: longitude!,
			temperature: temperature!,
			summary: summary!,
			icon: icon!,
			updated_at: new Date(),
		};
	} else {
		updatedMeteo = {
			...dayOrMeteo,
			updated_at: new Date(),
		};
	}

	const result = await db
		.update(Schema.meteo)
		.set(updatedMeteo)
		.where(and(
			eq(Schema.meteo.day, typeof dayOrMeteo === "string" ? dayOrMeteo : dayOrMeteo.day),
			eq(Schema.meteo.user_id, userId),
		))
		.returning({ day: Schema.meteo.day });

	// Revalidate all pages that might show meteo
	revalidatePath("/my", 'layout');

	if (!result) {
		return null;
	}

	return result[0].day;
}

// ## Delete

export async function deleteMeteoByDay(userId: string, day: string) {
	const result = await db.update(Schema.meteo)
		.set({ deleted_at: sql`CURRENT_TIMESTAMP` })
		.where(and(
			eq(Schema.meteo.day, day),
			eq(Schema.meteo.user_id, userId),
		))
		.returning({ day: Schema.meteo.day })

	// Revalidate all pages that might show meteo
	revalidatePath("/my", 'layout')

	if (result && result.length > 0) {
		return result[0].day
	}

	return null
}

// # Project

// ## Create

export async function createProject(userId: string, title: string, description?: string) {
	const result = await db
		.insert(Schema.project)
		.values({
			title: title,
			description: description,
			user_id: userId,
		} as Schema.NewProject)
		.returning({ id: Schema.project.title })

	// Revalidate all pages that might show projects
	revalidatePath("/my", 'layout')

	return result[0].id
}

// ## Read

export async function searchProjects(userId: string, title: string, limit = 50) {
	return await db
		.select()
		.from(Schema.project)
		.where(and(
			sql`LOWER(${Schema.project.title}) LIKE LOWER(${`%${title}%`})`,
			isNull(Schema.project.deleted_at),
			eq(Schema.project.user_id, userId),
		))
		.orderBy(asc(Schema.project.title))
		.limit(limit === -1 ? Number.MAX_SAFE_INTEGER : limit) as Schema.Project[]
}

export async function getProject(userId: string, title: string) {
	const dbresult = await db
		.select()
		.from(Schema.project)
		.where(and(
			eq(Schema.project.title, title),
			isNull(Schema.project.deleted_at),
			eq(Schema.project.user_id, userId),
		)) as Schema.Project[]

	if (!dbresult) {
		throw new Error("Project not found")
	}

	return dbresult[0];
}

export async function getProjects(userId: string, limit = 50, completed?: boolean, taskDeleted?: boolean, taskDueDate?: Date, taskCompleted: boolean = false) {
	const dbresult = await db
		.select({
			title: Schema.project.title,
			description: Schema.project.description,
			completed: Schema.project.completed,
			created_at: Schema.project.created_at,
			updated_at: Schema.project.updated_at,
			deleted_at: Schema.project.deleted_at,
		})
		.from(Schema.project)
		.leftJoin(Schema.task, eq(Schema.project.title, Schema.task.project_title))
		.where(and(
			isNull(Schema.project.deleted_at),
			eq(Schema.project.user_id, userId),
			completed !== undefined ? eq(Schema.project.completed, completed) : sql`1 = 1`,
			taskDeleted !== undefined ? (taskDeleted ? isNotNull(Schema.task.deleted_at) : isNull(Schema.task.deleted_at)) : sql`1 = 1`,
			taskCompleted !== undefined ? (taskCompleted ? isNotNull(Schema.task.completed_at) : isNull(Schema.task.completed_at)) : sql`1 = 1`,
			taskDueDate ? lte(Schema.task.due, taskDueDate) : sql`1 = 1`,
		))
		.groupBy(Schema.project.title)
		.limit(limit === -1 ? Number.MAX_SAFE_INTEGER : limit) as Schema.Project[]

	const tasksWithoutProject = await db
		.select()
		.from(Schema.task)
		.where(
			and(
				isNull(Schema.task.project_title),
				isNull(Schema.task.deleted_at),
				taskDueDate ? lte(Schema.task.due, taskDueDate) : sql`1 = 1`,
				taskCompleted !== undefined
					? taskCompleted
						? isNotNull(Schema.task.completed_at)
						: isNull(Schema.task.completed_at)
					: sql`1 = 1`,
			)
		);

	if (tasksWithoutProject.length > 0) {
		dbresult.push(
			{
				title: "No project",
				description: null,
				completed: false,
				created_at: new Date(0),
				updated_at: new Date(0),
				deleted_at: null,
				user_id: userId,
			}
		);
	}

	return dbresult;
}

export async function getCompletedProjects(userId: string, limit = 50, taskDeleted?: boolean, taskDueDate?: Date, taskCompleted: boolean = false) {
	return getProjects(userId, limit, true, taskDeleted, taskDueDate, taskCompleted);
}

export async function getUncompletedProjects(userId: string, limit = 50, taskDeleted?: boolean, taskDueDate?: Date, taskCompleted: boolean = false) {
	return getProjects(userId, limit, false, taskDeleted, taskDueDate, taskCompleted);
}

export async function getProjectsWithNotes(
	userId: string,
	limit = 50,
	noteLimit?: number,
	noteOrderBy?: keyof Schema.Note,
	noteOrderingDirection?: "asc" | "desc",
	noteProjectTitle?: string,
) {
	// First get projects with notes
	const projectsWithNotes = await db
		.select({
			title: Schema.project.title,
			description: Schema.project.description,
			completed: Schema.project.completed,
			created_at: Schema.project.created_at,
			updated_at: Schema.project.updated_at,
			deleted_at: Schema.project.deleted_at,
			user_id: Schema.project.user_id,
		})
		.from(Schema.project)
		.innerJoin(Schema.note, eq(Schema.project.title, Schema.note.project_title))
		.where(and(
			isNull(Schema.project.deleted_at),
			eq(Schema.project.user_id, userId),
			isNull(Schema.note.deleted_at),
			noteProjectTitle && noteProjectTitle !== "No project" ? eq(Schema.note.project_title, noteProjectTitle) : sql`1 = 1`,
		))
		.groupBy(Schema.project.title)
		.limit(limit === -1 ? Number.MAX_SAFE_INTEGER : limit) as Schema.Project[]

	// Check if there are any notes without a project
	const hasNotesWithoutProject = await db
		.select({ count: sql<number>`count(*)` })
		.from(Schema.note)
		.where(and(
			isNull(Schema.note.project_title),
			isNull(Schema.note.deleted_at),
			eq(Schema.note.user_id, userId),
		))
		.then(result => result[0].count > 0)

	// If there are notes without a project and we're not filtering by a specific project
	// or if we're specifically looking for notes without a project
	if (hasNotesWithoutProject && (!noteProjectTitle || noteProjectTitle === "No project")) {
		projectsWithNotes.push({
			title: "No project",
			description: null,
			completed: false,
			created_at: new Date(0),
			updated_at: new Date(0),
			deleted_at: null,
			user_id: userId,
		})
	}

	return projectsWithNotes
}

// ## Update

export async function updateProject(userId: string, title: string, new_title?: string, description?: string) {
	const result = await db
		.update(Schema.project)
		.set({
			title: new_title ? new_title : title,
			description: description,
			updated_at: sql`CURRENT_TIMESTAMP`,
		})
		.where(and(
			eq(Schema.project.title, title),
			eq(Schema.project.user_id, userId),
		))
		.returning({ title: Schema.project.title })

	// Revalidate all pages that might show projects
	revalidatePath("/my", 'layout')

	if (!result) {
		return null
	}

	return result[0].title
}

export async function completeProject(userId: string, title: string) {
	const result = await db
		.update(Schema.project)
		.set({
			completed: true,
			updated_at: sql`CURRENT_TIMESTAMP`,
		})
		.where(and(
			eq(Schema.project.title, title),
			eq(Schema.project.user_id, userId),
		))
		.returning({ title: Schema.project.title })

	// Revalidate all pages that might show projects
	revalidatePath("/my", 'layout')

	if (!result) {
		return null
	}

	return result[0].title
}

export async function uncompleteProject(userId: string, title: string) {
	const result = await db
		.update(Schema.project)
		.set({
			completed: false,
			updated_at: sql`CURRENT_TIMESTAMP`,
		})
		.where(and(
			eq(Schema.project.title, title),
			eq(Schema.project.user_id, userId),
		))
		.returning({ title: Schema.project.title })

	// Revalidate all pages that might show projects
	revalidatePath("/my", 'layout')

	if (!result) {
		return null
	}

	return result[0].title
}

// ## Delete

export async function deleteProject(userId: string, title: string) {
	const result = await db.update(Schema.project)
		.set({
			deleted_at: sql`CURRENT_TIMESTAMP`,
			updated_at: sql`CURRENT_TIMESTAMP`
		})
		.where(and(
			eq(Schema.project.title, title),
			eq(Schema.project.user_id, userId),
		))
		.returning({ title: Schema.project.title })

	// Revalidate all pages that might show projects
	revalidatePath("/my", 'layout')

	if (result && result.length > 0) {
		return result[0].title
	}

	return null
}



//=============================================================================
// # Exercice
//=============================================================================

// ## Create

export async function createExercice(userId: string, nameOrExercice: string | Schema.NewExercice) {
	let newExercice: Schema.NewExercice

	if (typeof nameOrExercice === "string") {
		newExercice = {
			name: nameOrExercice,
			user_id: userId,
		}
	} else {
		newExercice = nameOrExercice
	}

	const result = await db.insert(Schema.exercice).values(newExercice).returning({ id: Schema.exercice.id })

	// Revalidate all pages that might show exercices
	revalidatePath("/my", "layout")

	return result[0].id
}

// ## Read

export async function getExerciceById(userId: string, id: number) {
	return (await db.select().from(Schema.exercice).where(and(
		eq(Schema.exercice.id, id),
		eq(Schema.exercice.user_id, userId),
	))) as Schema.Exercice[]
}

export async function getExercices(userId: string) {
	return (await db.select().from(Schema.exercice).where(and(
		isNull(Schema.exercice.deleted_at),
		eq(Schema.exercice.user_id, userId),
	))) as Schema.Exercice[]
}

// ## Update

export async function updateExercice(userId: string, idOrExercice: number | Schema.NewExercice, name?: string) {
	let updatedExercice: Partial<Schema.NewExercice>

	if (typeof idOrExercice === "number") {
		updatedExercice = {
			name: name!,
			updated_at: new Date(),
		}
	} else {
		updatedExercice = {
			...idOrExercice,
			updated_at: new Date(),
		}
	}

	const result = await db
		.update(Schema.exercice)
		.set(updatedExercice)
		.where(and(
			eq(Schema.exercice.id, typeof idOrExercice === "number" ? idOrExercice : idOrExercice.id!),
			eq(Schema.exercice.user_id, userId),
		))
		.returning({ id: Schema.exercice.id })

	// Revalidate all pages that might show exercices
	revalidatePath("/my", "layout")

	if (!result) {
		return null
	}

	return result[0].id
}

// ## Delete

export async function deleteExerciceById(userId: string, id: number) {
	const result = await db
		.update(Schema.exercice)
		.set({ deleted_at: sql`CURRENT_TIMESTAMP` })
		.where(and(
			eq(Schema.exercice.id, id),
			eq(Schema.exercice.user_id, userId),
		))
		.returning({ id: Schema.exercice.id })

	// Revalidate all pages that might show exercices
	revalidatePath("/my", "layout")

	if (result && result.length > 0) {
		return result[0].id
	}

	return null
}

//=============================================================================
// # Seance
//=============================================================================

// ## Create

export async function createSeance(userId: string, nameOrSeance: string | Schema.NewSeance) {
	let newSeance: Schema.NewSeance

	if (typeof nameOrSeance === "string") {
		newSeance = {
			name: nameOrSeance,
			user_id: userId,
		}
	} else {
		newSeance = nameOrSeance
	}

	const result = await db.insert(Schema.seance).values(newSeance).returning({ id: Schema.seance.id })

	// Revalidate all pages that might show seances
	revalidatePath("/my", "layout")

	return result[0].id
}

// ## Read

export async function getSeanceById(userId: string, id: number) {
	return (await db.select().from(Schema.seance).where(and(
		eq(Schema.seance.id, id),
		eq(Schema.seance.user_id, userId),
	))) as Schema.Seance[]
}

export async function getSeances(userId: string) {
	return (await db.select().from(Schema.seance).where(and(
		isNull(Schema.seance.deleted_at),
		eq(Schema.seance.user_id, userId),
	))) as Schema.Seance[]
}

// ## Update

export async function updateSeance(userId: string, idOrSeance: number | Schema.NewSeance, name?: string) {
	let updatedSeance: Partial<Schema.NewSeance>

	if (typeof idOrSeance === "number") {
		updatedSeance = {
			name: name!,
			updated_at: new Date(),
		}
	} else {
		updatedSeance = {
			...idOrSeance,
			updated_at: new Date(),
		}
	}

	const result = await db
		.update(Schema.seance)
		.set(updatedSeance)
		.where(and(
			eq(Schema.seance.id, typeof idOrSeance === "number" ? idOrSeance : idOrSeance.id!),
			eq(Schema.seance.user_id, userId),
		))
		.returning({ id: Schema.seance.id })

	// Revalidate all pages that might show seances
	revalidatePath("/my", "layout")

	if (!result) {
		return null
	}

	return result[0].id
}

// ## Delete

export async function deleteSeanceById(userId: string, id: number) {
	const result = await db
		.update(Schema.seance)
		.set({ deleted_at: sql`CURRENT_TIMESTAMP` })
		.where(and(
			eq(Schema.seance.id, id),
			eq(Schema.seance.user_id, userId),
		))
		.returning({ id: Schema.seance.id })

	// Revalidate all pages that might show seances
	revalidatePath("/my", "layout")

	if (result && result.length > 0) {
		return result[0].id
	}

	return null
}

//=============================================================================
// # SeanceExercice
//=============================================================================

// ## Create

export async function createSeanceExercice(
	seanceIdOrSeanceExercice: number | Schema.NewSeanceExercice,
	exercice_id?: number,
	position?: number,
	nb_series?: number,
) {
	let newSeanceExercice: Schema.NewSeanceExercice

	if (typeof seanceIdOrSeanceExercice === "number") {
		newSeanceExercice = {
			seance_id: seanceIdOrSeanceExercice,
			exercice_id: exercice_id!,
			position: position!,
			nb_series: nb_series!,
		}
	} else {
		newSeanceExercice = seanceIdOrSeanceExercice
	}

	const result = await db
		.insert(Schema.seanceExercice)
		.values(newSeanceExercice)
		.returning({ id: Schema.seanceExercice.id })

	// Revalidate all pages that might show seance exercices
	revalidatePath("/my", "layout")

	return result[0].id
}

// ## Read

export async function getSeanceExerciceById(id: number) {
	return (await db
		.select()
		.from(Schema.seanceExercice)
		.where(eq(Schema.seanceExercice.id, id))) as Schema.SeanceExercice[]
}

export async function getSeanceExercicesBySeanceId(seance_id: number) {
	return (await db
		.select()
		.from(Schema.seanceExercice)
		.where(and(eq(Schema.seanceExercice.seance_id, seance_id), isNull(Schema.seanceExercice.deleted_at)))
		.orderBy(asc(Schema.seanceExercice.position))) as Schema.SeanceExercice[]
}

export async function getSeanceExercices() {
	return (await db
		.select()
		.from(Schema.seanceExercice)
		.where(isNull(Schema.seanceExercice.deleted_at))) as Schema.SeanceExercice[]
}

// ## Update

export async function updateSeanceExercice(
	idOrSeanceExercice: number | Schema.NewSeanceExercice,
	seance_id?: number,
	exercice_id?: number,
	position?: number,
	nb_series?: number,
) {
	let updatedSeanceExercice: Partial<Schema.NewSeanceExercice>

	if (typeof idOrSeanceExercice === "number") {
		updatedSeanceExercice = {
			seance_id: seance_id,
			exercice_id: exercice_id,
			position: position,
			nb_series: nb_series,
			updated_at: new Date(),
		}
	} else {
		updatedSeanceExercice = {
			...idOrSeanceExercice,
			updated_at: new Date(),
		}
	}

	const result = await db
		.update(Schema.seanceExercice)
		.set(updatedSeanceExercice)
		.where(
			eq(
				Schema.seanceExercice.id,
				typeof idOrSeanceExercice === "number" ? idOrSeanceExercice : idOrSeanceExercice.id!,
			),
		)
		.returning({ id: Schema.seanceExercice.id })

	// Revalidate all pages that might show seance exercices
	revalidatePath("/my", "layout")

	if (!result) {
		return null
	}

	return result[0].id
}

// ## Delete

export async function deleteSeanceExerciceById(id: number) {
	const result = await db
		.update(Schema.seanceExercice)
		.set({ deleted_at: sql`CURRENT_TIMESTAMP` })
		.where(eq(Schema.seanceExercice.id, id))
		.returning({ id: Schema.seanceExercice.id })

	// Revalidate all pages that might show seance exercices
	revalidatePath("/my", "layout")

	if (result && result.length > 0) {
		return result[0].id
	}

	return null
}

//=============================================================================
// # Workout
//=============================================================================

// ## Create

export async function createWorkout(
	userId: string,
	dateOrWorkout: Date | Schema.NewWorkout,
	note?: number,
	comment?: string,
	seance_id?: number,
) {
	let newWorkout: Schema.NewWorkout

	if (dateOrWorkout instanceof Date) {
		newWorkout = {
			date: dateOrWorkout,
			note: note,
			comment: comment,
			seance_id: seance_id,
			user_id: userId,
		}
	} else {
		newWorkout = dateOrWorkout
	}

	const result = await db.insert(Schema.workout).values(newWorkout).returning({ id: Schema.workout.id })

	// Revalidate all pages that might show workouts
	revalidatePath("/my", "layout")

	return result[0].id
}

// ## Read

export async function getWorkoutById(userId: string, id: number) {
	return (await db.select().from(Schema.workout).where(and(
		eq(Schema.workout.id, id),
		eq(Schema.workout.user_id, userId),
	))) as Schema.Workout[]
}

export async function getAllWorkouts(userId: string) {
	return (await db
		.select()
		.from(Schema.workout)
		.where(and(
			isNull(Schema.workout.deleted_at),
			eq(Schema.workout.user_id, userId),
		))
		.orderBy(desc(Schema.workout.date))) as Schema.Workout[]
}

export async function getRecentWorkouts(userId: string, limit = 5) {
	return (await db
		.select()
		.from(Schema.workout)
		.where(and(
			isNull(Schema.workout.deleted_at),
			eq(Schema.workout.user_id, userId),
		))
		.orderBy(desc(Schema.workout.date))
		.limit(limit)) as Schema.Workout[]
}

export async function getWorkoutsBySeanceId(userId: string, seance_id: number) {
	return (await db
		.select()
		.from(Schema.workout)
		.where(and(
			eq(Schema.workout.seance_id, seance_id),
			eq(Schema.workout.user_id, userId),
			isNull(Schema.workout.deleted_at),
		))
		.orderBy(desc(Schema.workout.date))) as Schema.Workout[]
}

// ## Update

export async function updateWorkout(
	userId: string,
	idOrWorkout: number | Schema.NewWorkout,
	date?: Date,
	note?: number,
	comment?: string,
	seance_id?: number,
) {
	let updatedWorkout: Partial<Schema.NewWorkout>

	if (typeof idOrWorkout === "number") {
		updatedWorkout = {
			date: date,
			note: note,
			comment: comment,
			seance_id: seance_id,
			updated_at: new Date(),
			user_id: userId,
		}
	} else {
		updatedWorkout = {
			...idOrWorkout,
			updated_at: new Date(),
		}
	}

	const result = await db
		.update(Schema.workout)
		.set(updatedWorkout)
		.where(eq(Schema.workout.id, typeof idOrWorkout === "number" ? idOrWorkout : idOrWorkout.id!))
		.returning({ id: Schema.workout.id })

	// Revalidate all pages that might show workouts
	revalidatePath("/my", "layout")

	if (!result) {
		return null
	}

	return result[0].id
}

// ## Delete

export async function deleteWorkoutById(userId: string, id: number) {
	const result = await db
		.update(Schema.workout)
		.set({ deleted_at: sql`CURRENT_TIMESTAMP` })
		.where(and(
			eq(Schema.workout.id, id),
			eq(Schema.workout.user_id, userId),
		))
		.returning({ id: Schema.workout.id })

	// Revalidate all pages that might show workouts
	revalidatePath("/my", "layout")

	if (result && result.length > 0) {
		return result[0].id
	}

	return null
}

//=============================================================================
// # Serie
//=============================================================================

// ## Create

export async function createSerie(
	userId: string,
	seriesGroupIdOrSerie: number | Schema.NewSerie,
	exercice_id?: number,
	poids?: number,
	reps?: number,
	exercice_position?: number,
	serie_position?: number,
) {
	let newSerie: Schema.NewSerie

	if (typeof seriesGroupIdOrSerie === "number") {
		newSerie = {
			series_group_id: seriesGroupIdOrSerie,
			exercice_id: exercice_id!,
			poids: poids,
			reps: reps,
			exercice_position: exercice_position!,
			serie_position: serie_position!,
			user_id: userId,
		}
	} else {
		newSerie = seriesGroupIdOrSerie
	}

	const result = await db.insert(Schema.serie).values(newSerie).returning({ id: Schema.serie.id })

	// Revalidate all pages that might show series
	revalidatePath("/my", "layout")

	return result[0].id
}

// ## Read

export async function getSerieById(userId: string, id: number) {
	return (await db.select().from(Schema.serie).where(and(
		eq(Schema.serie.id, id),
		eq(Schema.serie.user_id, userId),
	))) as Schema.Serie[]
}


export async function getSeriesByExerciceId(userId: string, exercice_id: number) {
	return (
		await db
			.select()
			.from(Schema.serie)
			.where(and(
				eq(Schema.serie.exercice_id, exercice_id),
				eq(Schema.serie.user_id, userId),
				isNull(Schema.serie.deleted_at),
			))
			.orderBy(asc(Schema.serie.exercice_position), asc(Schema.serie.serie_position))
	)
}

export async function getSeries(userId: string) {
	return (await db.select().from(Schema.serie).where(and(
		isNull(Schema.serie.deleted_at),
		eq(Schema.serie.user_id, userId),
	))) as Schema.Serie[]
}

export async function getSeriesByExerciceIds(userId: string, exercice_ids: number[]) {
	return (
		await db
			.select()
			.from(Schema.serie)
			.where(and(
				inArray(Schema.serie.exercice_id, exercice_ids),
				isNull(Schema.serie.deleted_at)
			))
			.orderBy(asc(Schema.serie.exercice_position), asc(Schema.serie.serie_position))
	)
}

// ## Update

export async function updateSerie(
	userId: string,
	idOrSerie: number | Schema.NewSerie,
	series_group_id?: number,
	exercice_id?: number,
	poids?: number,
	reps?: number,
	exercice_position?: number,
	serie_position?: number,
) {
	let updatedSerie: Partial<Schema.NewSerie>

	if (typeof idOrSerie === "number") {
		updatedSerie = {
			series_group_id: series_group_id,
			exercice_id: exercice_id,
			poids: poids,
			reps: reps,
			exercice_position: exercice_position,
			serie_position: serie_position,
			updated_at: new Date(),
			user_id: userId,
		}
	} else {
		updatedSerie = {
			...idOrSerie,
			updated_at: new Date(),
		}
	}

	const result = await db
		.update(Schema.serie)
		.set(updatedSerie)
		.where(eq(Schema.serie.id, typeof idOrSerie === "number" ? idOrSerie : idOrSerie.id!))
		.returning({ id: Schema.serie.id })

	// Revalidate all pages that might show series
	revalidatePath("/my", "layout")

	if (!result) {
		return null
	}

	return result[0].id
}

// ## Delete

export async function deleteSerieById(userId: string, id: number) {
	const result = await db
		.update(Schema.serie)
		.set({ deleted_at: sql`CURRENT_TIMESTAMP` })
		.where(and(
			eq(Schema.serie.id, id),
			eq(Schema.serie.user_id, userId),
		))
		.returning({ id: Schema.serie.id })

	// Revalidate all pages that might show series
	revalidatePath("/my", "layout")

	if (result && result.length > 0) {
		return result[0].id
	}

	return null
}

// # TaskToDoAfter

// ## Create
export async function createTaskToDoAfter(
	todoIdOrTaskToDoAfter: number | Schema.NewTaskToDoAfter,
	after_task_id?: number
) {
	let newTaskToDoAfter: Schema.NewTaskToDoAfter

	if (typeof todoIdOrTaskToDoAfter === "number") {
		newTaskToDoAfter = {
			task_id: todoIdOrTaskToDoAfter,
			after_task_id: after_task_id!,
		}
	} else {
		newTaskToDoAfter = todoIdOrTaskToDoAfter
	}

	const result = await db
		.insert(Schema.taskToDoAfter)
		.values(newTaskToDoAfter)
		.returning({ id: Schema.taskToDoAfter.id })

	return result[0].id
}

// ## Read
export async function getTaskToDoAfterById(id: number) {
	return (await db
		.select()
		.from(Schema.taskToDoAfter)
		.where(eq(Schema.taskToDoAfter.id, id))) as Schema.TaskToDoAfter[]
}

export async function getTaskToDoAfterByTodoId(task_id: number) {
	return (await db
		.select()
		.from(Schema.taskToDoAfter)
		.where(eq(Schema.taskToDoAfter.task_id, task_id))) as Schema.TaskToDoAfter[]
}

export async function getTasksToDoAfter(task_id: number) {
	return getTaskToDoAfterByTodoId(task_id);
}

export async function getTaskToDoAfterByAfterId(after_task_id: number) {
	return (await db
		.select()
		.from(Schema.taskToDoAfter)
		.where(eq(Schema.taskToDoAfter.after_task_id, after_task_id))) as Schema.TaskToDoAfter[]
}

export async function getTasksToDoBefore(after_task_id: number) {
	return getTaskToDoAfterByAfterId(after_task_id);
}

export async function getTaskToDoAfterById1AndId2(task_id: number, after_task_id: number) {
	return (await db
		.select()
		.from(Schema.taskToDoAfter)
		.where(and(
			eq(Schema.taskToDoAfter.task_id, task_id),
			eq(Schema.taskToDoAfter.after_task_id, after_task_id)
		))) as Schema.TaskToDoAfter[]
}

// ## Update

export async function updateTaskToDoAfter(
	idOrTaskToDoAfter: number | Schema.NewTaskToDoAfter,
	task_id?: number,
	after_task_id?: number
) {
	let updatedTaskToDoAfter: Partial<Schema.NewTaskToDoAfter>

	if (typeof idOrTaskToDoAfter === "number") {
		updatedTaskToDoAfter = {
			task_id: task_id,
			after_task_id: after_task_id,
			updated_at: new Date(),
		}
	} else {
		updatedTaskToDoAfter = {
			...idOrTaskToDoAfter,
			updated_at: new Date(),
		}
	}

	const result = await db
		.update(Schema.taskToDoAfter)
		.set(updatedTaskToDoAfter)
		.where(eq(Schema.taskToDoAfter.id, typeof idOrTaskToDoAfter === "number" ? idOrTaskToDoAfter : idOrTaskToDoAfter.id!))
		.returning({ id: Schema.taskToDoAfter.id })

	return result[0].id
}

// ## Delete

export async function deleteTaskToDoAfterById(id: number) {
	const result = await db
		.update(Schema.taskToDoAfter)
		.set({ deleted_at: sql`CURRENT_TIMESTAMP`, updated_at: sql`CURRENT_TIMESTAMP` })
		.where(eq(Schema.taskToDoAfter.id, id))
		.returning({ id: Schema.taskToDoAfter.id })

	if (result && result.length > 0) {
		return result[0].id
	}

	return null
}

export async function deleteTaskToDoAfterByTodoId(task_id: number) {
	const result = await db
		.update(Schema.taskToDoAfter)
		.set({ deleted_at: sql`CURRENT_TIMESTAMP`, updated_at: sql`CURRENT_TIMESTAMP` })
		.where(eq(Schema.taskToDoAfter.task_id, task_id))
		.returning({ id: Schema.taskToDoAfter.id })

	if (result && result.length > 0) {
		return result[0].id
	}

	return null
}

export async function deleteTaskToDoAfterByAfterId(after_task_id: number) {
	const result = await db
		.update(Schema.taskToDoAfter)
		.set({ deleted_at: sql`CURRENT_TIMESTAMP`, updated_at: sql`CURRENT_TIMESTAMP` })
		.where(eq(Schema.taskToDoAfter.after_task_id, after_task_id))
		.returning({ id: Schema.taskToDoAfter.id })

	if (result && result.length > 0) {
		return result[0].id
	}

	return null
}
