"use server"

import { calculateUrgency } from "@/lib/utils/task";
import { cacheThrough, cacheThroughOne, invalidate } from "@/lib/cache/cache-through";
import * as lib from "../lib";

import * as RecurrencyQueries from "./recurrency"

const table = lib.Schema.Task.Task.table;
const TABLE_NAME = "task";
type New = lib.Schema.Task.Task.Insert
type Existing = lib.Schema.Task.Task.Select
// # TASK

// ## Create
export async function createTask(
    values: New,
) {
    const urgency = calculateUrgency(values.due)

    const result = await lib.db
        .insert(table)
        .values({
            ...values,
            urgency: urgency,
            state: values.state || lib.Schema.Task.Task.State.TODO,
        })
        .returning({ id: table.id })

    const taskId = result[0].id

    // Revalidate all pages that might show todos
    lib.revalidatePath("/my", 'layout')

    return taskId
}

export async function duplicateTask(id: number, newValues: Partial<Existing> = {}) {
    const task = await getTaskById(id);
    if (!task) return null;

    return createTask({
        title: newValues.title ?? task.title,
        importance: newValues.importance ?? task.importance,
        duration: newValues.duration ?? task.duration,
        due: newValues.due ?? task.due,
        project_id: newValues.project_id ?? task.project_id,
        user_id: task.user_id
    } as New);
}

// ## Read
export async function getTaskById(id: number, recursive: boolean = false) {
    return cacheThroughOne<lib.Schema.Task.Task.TaskWithRelations>(
        TABLE_NAME,
        id,
        async () => {
            const dbresult = await lib.db
                .select({
                    id: table.id,
                    title: table.title,
                    importance: table.importance,
                    duration: table.duration,
                    urgency: table.urgency,
                    due: table.due,
                    project_id: table.project_id,
                    state: table.state,
                    completed_at: table.completed_at,
                    created_at: table.created_at,
                    updated_at: table.updated_at,
                    deleted_at: table.deleted_at,
                    user_id: table.user_id,
                    project: {
                        id: lib.Schema.Project.table.id,
                        title: lib.Schema.Project.table.title,
                        description: lib.Schema.Project.table.description,
                        completed: lib.Schema.Project.table.completed,
                        created_at: lib.Schema.Project.table.created_at,
                        updated_at: lib.Schema.Project.table.updated_at,
                        deleted_at: lib.Schema.Project.table.deleted_at,
                        user_id: lib.Schema.Project.table.user_id,
                    },
                    importanceDetails: {
                        level: lib.Schema.Task.Importance.table.level,
                        name: lib.Schema.Task.Importance.table.name,
                    },
                    durationDetails: {
                        level: lib.Schema.Task.Duration.table.level,
                        name: lib.Schema.Task.Duration.table.name,
                    },
                })
                .from(table)
                .leftJoin(lib.Schema.Project.table, lib.eq(table.project_id, lib.Schema.Project.table.id))
                .leftJoin(lib.Schema.Task.Importance.table, lib.eq(table.importance, lib.Schema.Task.Importance.table.level))
                .leftJoin(lib.Schema.Task.Duration.table, lib.eq(table.duration, lib.Schema.Task.Duration.table.level))
                .where(lib.and(
                    lib.eq(table.id, id),
                ))

            if (dbresult.length === 0) {
                return null;
            }

            return dbresult[0] as lib.Schema.Task.Task.TaskWithRelations
        }
    )
}

export async function getNumberOfTasks(userId: string, projectTitles?: string[], excludedProjectTitles?: string[], dueAfter?: Date, dueBefore?: Date) {
    const dbresult = await lib.db
        .select({
            completed_count: lib.sql<number>`SUM(CASE WHEN ${table.completed_at} IS NOT NULL THEN 1 ELSE 0 END)`.as("completed_count"),
            uncompleted_count: lib.sql<number>`SUM(CASE WHEN ${table.completed_at} IS NULL THEN 1 ELSE 0 END)`.as("uncompleted_count"),
            due: table.due,
        })
        .from(table)
        .leftJoin(lib.Schema.Project.table, lib.eq(table.project_id, lib.Schema.Project.table.id))
        .where(lib.and(
            lib.isNull(table.deleted_at),
            lib.eq(table.user_id, userId),
            projectTitles
                ? lib.or(
                    lib.inArray(lib.Schema.Project.table.title, projectTitles),
                    lib.sql`${lib.isNull(table.project_id)} and ${projectTitles.includes("No project")}`,
                )
                : lib.sql`1 = 1`,
            excludedProjectTitles && excludedProjectTitles.length > 0
                ? lib.and(
                    lib.or(
                        lib.isNull(table.project_id),
                        lib.not(lib.inArray(
                            lib.Schema.Project.table.title,
                            excludedProjectTitles.filter(p => p !== "No project")
                        ))
                    ),
                    excludedProjectTitles.includes("No project")
                        ? lib.isNotNull(table.project_id)
                        : lib.sql`1 = 1`
                )
                : lib.sql`1 = 1`,
            dueAfter ? lib.gte(table.due, dueAfter) : lib.sql`1 = 1`,
            dueBefore ? lib.lte(table.due, dueBefore) : lib.sql`1 = 1`
        ))
        .groupBy(table.due)

    return dbresult;
}

export async function getTasks(
    userId: string,
    orderBy: keyof Existing = "due",
    orderingDirection: "asc" | "desc" = "asc",
    limit = 50,
    projectIds?: number[],
    excludedProjectIds?: number[],
    dueBefore?: Date,
    dueAfter?: Date,
    completed?: boolean,
    completed_after?: Date,
    completed_before?: Date,
    state?: string,
) {
    // Step 1: First query to get distinct tasks with limit applied
    const distinctTasks = await lib.db
        .select({
            id: table.id,
        })
        .from(table)
        .leftJoin(lib.Schema.Project.table, lib.eq(table.project_id, lib.Schema.Project.table.id))
        .where(
            lib.and(
                lib.isNull(table.deleted_at),
                // Filter by user ID if provided
                lib.eq(table.user_id, userId),
                // Include specific projects if provided
                projectIds
                    ? lib.or(
                        lib.inArray(lib.Schema.Project.table.id, projectIds),
                        lib.sql`${lib.isNull(table.project_id)} and ${projectIds.includes(-1)}`,
                    )
                    : lib.sql`1 = 1`,
                // Exclude specific projects if provided
                excludedProjectIds && excludedProjectIds.length > 0
                    ? lib.and(
                        // For tasks with project titles
                        lib.or(
                            lib.isNull(table.project_id),
                            lib.not(lib.inArray(
                                lib.Schema.Project.table.id,
                                excludedProjectIds.filter(p => p !== -1)
                            ))
                        ),
                        // For tasks with null project ("No project")
                        excludedProjectIds.includes(-1)
                            ? lib.isNotNull(table.project_id)
                            : lib.sql`1 = 1`
                    )
                    : lib.sql`1 = 1`,
                dueBefore ? lib.lte(table.due, dueBefore) : lib.sql`1 = 1`,
                dueAfter ? lib.gte(table.due, dueAfter) : lib.sql`1 = 1`,
                completed !== undefined
                    ? completed
                        ? lib.isNotNull(table.completed_at)
                        : lib.isNull(table.completed_at)
                    : lib.sql`1 = 1`,
                completed_after ? lib.gte(table.completed_at, completed_after) : lib.sql`1 = 1`,
                completed_before ? lib.lte(table.completed_at, completed_before) : lib.sql`1 = 1`,
                state ? lib.eq(table.state, state) : lib.sql`1 = 1`,
            ),
        )
        .orderBy(
            orderingDirection === "asc" ? lib.asc(table[orderBy]) : lib.desc(table[orderBy]),
            orderingDirection === "asc" ? lib.asc(table.title) : lib.desc(table.title),
        )
        .limit(limit === -1 ? Number.MAX_SAFE_INTEGER : limit)

    if (distinctTasks.length === 0) return []

    // Get the IDs of the distinct tasks
    const taskIds = distinctTasks.map((task) => task.id)

    // Step 2: Cache-through - get from Redis first, fetch missing from DB
    const results = await cacheThrough<lib.Schema.Task.Task.TaskWithRelations>(
        TABLE_NAME,
        taskIds,
        async (missingIds) => {
            const rows = await lib.db
                .select({
                    id: table.id,
                    title: table.title,
                    importance: table.importance,
                    urgency: table.urgency,
                    duration: table.duration,
                    due: table.due,
                    state: table.state,
                    completed_at: table.completed_at,
                    created_at: table.created_at,
                    updated_at: table.updated_at,
                    deleted_at: table.deleted_at,
                    project_id: table.project_id,
                    user_id: table.user_id,
                    project: {
                        id: lib.Schema.Project.table.id,
                        title: lib.Schema.Project.table.title,
                        description: lib.Schema.Project.table.description,
                        completed: lib.Schema.Project.table.completed,
                        created_at: lib.Schema.Project.table.created_at,
                        updated_at: lib.Schema.Project.table.updated_at,
                        deleted_at: lib.Schema.Project.table.deleted_at,
                        user_id: lib.Schema.Project.table.user_id,
                    },
                    importanceDetails: {
                        level: lib.Schema.Task.Importance.table.level,
                        name: lib.Schema.Task.Importance.table.name,
                    },
                    durationDetails: {
                        level: lib.Schema.Task.Duration.table.level,
                        name: lib.Schema.Task.Duration.table.name,
                    },
                })
                .from(table)
                .leftJoin(lib.Schema.Project.table, lib.eq(table.project_id, lib.Schema.Project.table.id))
                .leftJoin(lib.Schema.Task.Importance.table, lib.eq(table.importance, lib.Schema.Task.Importance.table.level))
                .leftJoin(lib.Schema.Task.Duration.table, lib.eq(table.duration, lib.Schema.Task.Duration.table.level))
                .where(lib.inArray(table.id, missingIds as number[]))

            const groupedTasks: Record<string, lib.Schema.Task.Task.TaskWithRelations> = {}

            for (const row of rows) {
                const taskId = row.id
                if (!groupedTasks[taskId]) {
                    groupedTasks[taskId] = {
                        ...row,
                        importanceDetails: row.importanceDetails!,
                        durationDetails: row.durationDetails!,
                    }
                }
            }

            return Object.values(groupedTasks)
        },
        (task) => task.id
    )

    return results
}

export async function getCompletedTasks(userId: string, orderBy: keyof Existing = "completed_at", orderingDirection?: "asc" | "desc", limit = 50, projectIds?: number[], excludedProjectIds?: number[], dueBefore?: Date, dueAfter?: Date) {
    return getTasks(userId, orderBy, orderingDirection, limit, projectIds, excludedProjectIds, dueBefore, dueAfter, true);
}

export async function getUncompletedTasks(userId: string, orderBy: keyof Existing = "due", orderingDirection?: "asc" | "desc", limit = 50, projectIds?: number[], excludedProjectIds?: number[], dueBefore?: Date, dueAfter?: Date) {
    return getTasks(userId, orderBy, orderingDirection, limit, projectIds, excludedProjectIds, dueBefore, dueAfter, false);
}

export async function searchTasksByTitle(userId: string, title: string, limit = 50) {
    return await lib.db
        .select()
        .from(table)
        .where(lib.and(
            lib.sql`LOWER(${table.title}) LIKE LOWER(${`%${title}%`})`,
            lib.eq(table.user_id, userId),
            lib.isNull(table.deleted_at),
            lib.isNull(table.completed_at),
        ))
        .limit(limit === -1 ? Number.MAX_SAFE_INTEGER : limit) as Existing[]
}

export async function getUncompletedAndDueInTheNextThreeDaysOrLessTasks(userId: string, orderBy: keyof Existing = "due", orderingDirection?: "asc" | "desc") {
    const today = new Date()
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(today.getDate() + 3)

    return getTasks(userId, orderBy, orderingDirection, -1, undefined, undefined, threeDaysFromNow, undefined, false);
}

export async function getDeletedTasks(userId: string, orderBy: keyof Existing = "deleted_at", orderingDirection: "asc" | "desc" = "desc", limit = 50, page = 1) {
    // Get total count
    const [{ count }] = await lib.db
        .select({ count: lib.sql<number>`count(*)` })
        .from(table)
        .where(
            lib.and(
                lib.eq(table.user_id, userId),
                lib.isNotNull(table.deleted_at)
            )
        )

    const tasks = await lib.db
        .select({
            id: table.id,
            title: table.title,
            importance: table.importance,
            urgency: table.urgency,
            duration: table.duration,
            due: table.due,
            state: table.state,
            completed_at: table.completed_at,
            created_at: table.created_at,
            updated_at: table.updated_at,
            deleted_at: table.deleted_at,
            project_id: table.project_id,
            user_id: table.user_id,
            project: {
                id: lib.Schema.Project.table.id,
                title: lib.Schema.Project.table.title,
                description: lib.Schema.Project.table.description,
                completed: lib.Schema.Project.table.completed,
                created_at: lib.Schema.Project.table.created_at,
                updated_at: lib.Schema.Project.table.updated_at,
                deleted_at: lib.Schema.Project.table.deleted_at,
                user_id: lib.Schema.Project.table.user_id,
            },
            importanceDetails: {
                level: lib.Schema.Task.Importance.table.level,
                name: lib.Schema.Task.Importance.table.name,
            },
            durationDetails: {
                level: lib.Schema.Task.Duration.table.level,
                name: lib.Schema.Task.Duration.table.name,
            },
        })
        .from(table)
        .leftJoin(lib.Schema.Project.table, lib.eq(table.project_id, lib.Schema.Project.table.id))
        .leftJoin(lib.Schema.Task.Importance.table, lib.eq(table.importance, lib.Schema.Task.Importance.table.level))
        .leftJoin(lib.Schema.Task.Duration.table, lib.eq(table.duration, lib.Schema.Task.Duration.table.level))
        .where(
            lib.and(
                lib.eq(table.user_id, userId),
                lib.isNotNull(table.deleted_at)
            )
        )
        .orderBy(
            orderingDirection === "asc" ? lib.asc(table[orderBy]) : lib.desc(table[orderBy])
        )
        .offset((page - 1) * limit)
        .limit(limit === -1 ? Number.MAX_SAFE_INTEGER : limit)

    const mapped = tasks.map(task => ({
        ...task,
        tasksToDoAfter: null,
        tasksToDoBefore: null,
        importanceDetails: task.importanceDetails!,
        durationDetails: task.durationDetails!,
    })) as lib.Schema.Task.Task.TaskWithRelations[]

    return {
        tasks: mapped,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit,
    }
}

export async function getTasksCompletedTheDayBefore(userId: string, orderBy: keyof Existing = "completed_at", orderingDirection: "asc" | "desc" = "asc") {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    return getTasks(userId, orderBy, orderingDirection, -1, undefined, undefined, undefined, undefined, true, yesterday, today);
}

// ## Update
export async function updateTask(id: number, values: Partial<Existing>) {
    const old_task = await getTaskById(id)
    if (!old_task) {
        return null
    }
    const urgency = values.due ? calculateUrgency(values.due) : old_task.urgency
    const importance = values.importance ?? old_task.importance
    const duration = values.duration ?? old_task.duration

    const result = await lib.db
        .update(table)
        .set({
            ...values,
            urgency: urgency,
            updated_at: lib.sql`CURRENT_TIMESTAMP`,
        })
        .where(lib.and(
            lib.eq(table.id, id),
        ))

    // Invalidate cache for this task
    await invalidate(TABLE_NAME, id)

    // Revalidate all pages that might show todos
    lib.revalidatePath("/my", 'layout')

    if (!result) {
        return null
    }

    return id
}

export async function updateTaskUrgency(userId: string, id: number) {
    const todoData = await getTaskById(id)

    if (!todoData || todoData.completed_at !== null || todoData.deleted_at !== null) {
        return null
    }

    const urgency = calculateUrgency(todoData.due)

    const result = await lib.db
        .update(table)
        .set({
            urgency: urgency,
            updated_at: lib.sql`CURRENT_TIMESTAMP`,
        })
        .where(lib.and(
            lib.eq(table.id, id),
            lib.eq(table.user_id, userId),
        ))
        .returning({ id: table.id })

    await invalidate(TABLE_NAME, id)

    // Revalidate all pages that might show todos
    lib.revalidatePath("/my", 'layout')

    if (!result) {
        return null
    }

    return result[0].id
}

export async function markTaskAsDone(userId: string, id: number): Promise<{
    done_task_id: number,
    new_task_id?: number
}> {
    const result = await lib.db
        .update(table)
        .set({
            completed_at: lib.sql`CURRENT_TIMESTAMP`,
            state: lib.Schema.Task.Task.State.DONE,
            updated_at: lib.sql`CURRENT_TIMESTAMP`,
        })
        .where(lib.and(
            lib.eq(table.id, id),
            lib.eq(table.user_id, userId),
        ))
        .returning({ id: table.id })

    await invalidate(TABLE_NAME, id)

    await RecurrencyQueries.IncrementCurrentCount(id);

    const nextDue = await RecurrencyQueries.CalculateNextDue(id);

    let new_task_id: number | undefined = undefined;

    if (nextDue) {
        const local_new_task_id = await duplicateTask(id, { due: nextDue });
        if (local_new_task_id) {
            new_task_id = local_new_task_id;
        }
    }

    // Revalidate all pages that might show todos
    lib.revalidatePath("/my", 'layout')

    return {
        done_task_id: result[0].id,
        new_task_id
    }
}

export async function markTaskAsUndone(userId: string, id: number) {
    const result = await lib.db
        .update(table)
        .set({
            completed_at: null,
            state: lib.Schema.Task.Task.State.TODO,
            updated_at: lib.sql`CURRENT_TIMESTAMP`,
        })
        .where(lib.and(
            lib.eq(table.id, id),
            lib.eq(table.user_id, userId),
        ))
        .returning({ id: table.id })

    await invalidate(TABLE_NAME, id)

    // Revalidate all pages that might show todos
    lib.revalidatePath("/my", 'layout')

    return result[0].id
}

export async function toggleTask(userId: string, id: number, currentState: boolean) {
    return currentState ? await markTaskAsUndone(userId, id) : await markTaskAsDone(userId, id);
}

// ## Delete
export async function deleteTaskById(userId: string, id: number) {

    const result = await lib.db.update(table)
        .set({ deleted_at: lib.sql`CURRENT_TIMESTAMP`, updated_at: lib.sql`CURRENT_TIMESTAMP` })
        .where(lib.and(
            lib.eq(table.id, id),
            lib.eq(table.user_id, userId),
        ))
        .returning({ id: table.id })

    await invalidate(TABLE_NAME, id)

    // Revalidate all pages that might show todos
    lib.revalidatePath("/my", 'layout')

    if (result && result.length > 0) {
        return result[0].id
    }

    return null
}

export async function recoverTaskById(userId: string, id: number) {
    const result = await lib.db.update(table)
        .set({ deleted_at: null, updated_at: lib.sql`CURRENT_TIMESTAMP` })
        .where(lib.and(
            lib.eq(table.id, id),
            lib.eq(table.user_id, userId),
        ))
        .returning({ id: table.id })

    await invalidate(TABLE_NAME, id)

    // Revalidate all pages that might show todos
    lib.revalidatePath("/my", 'layout')

    if (result && result.length > 0) {
        return result[0].id
    }

    return null
}

export async function permanentlyDeleteTaskById(userId: string, id: number) {
    const result = await lib.db.delete(table)
        .where(lib.and(
            lib.eq(table.id, id),
            lib.eq(table.user_id, userId),
            lib.isNotNull(table.deleted_at)
        ))
        .returning({ id: table.id })

    await invalidate(TABLE_NAME, id)

    // Revalidate all pages that might show todos
    lib.revalidatePath("/my", 'layout')

    if (result && result.length > 0) {
        return result[0].id
    }

    return null
}