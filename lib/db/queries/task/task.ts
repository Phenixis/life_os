"use server"

import {calculateUrgency} from "@/lib/utils/task";
import * as lib from "../lib";

import * as RecurrencyQueries from "./recurrency"

const taskToDoAfterAlias = lib.alias(lib.Schema.Task.ToDoAfter.table, 'taskToDoAfter');
const taskToDoBeforeAlias = lib.alias(lib.Schema.Task.ToDoAfter.table, 'taskToDoBefore');

const table = lib.Schema.Task.Task.table;
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
            score: (values.importance * urgency) - values.duration,
            state: values.state || lib.Schema.Task.Task.State.TODO
        })
        .returning({id: table.id})

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
        score: newValues.score ?? task.score,
        project_id: newValues.project_id ?? task.project_id,
        user_id: task.user_id
    } as New);
}

// ## Read
export async function getTaskById(id: number, recursive: boolean = false) {
    const dbresult = await lib.db
        .select({
            id: table.id,
            title: table.title,
            importance: table.importance,
            duration: table.duration,
            urgency: table.urgency,
            score: table.score,
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
        .from(table)
        .leftJoin(lib.Schema.Project.table, lib.eq(table.project_id, lib.Schema.Project.table.id))
        .leftJoin(lib.Schema.Task.Importance.table, lib.eq(table.importance, lib.Schema.Task.Importance.table.level))
        .leftJoin(lib.Schema.Task.Duration.table, lib.eq(table.duration, lib.Schema.Task.Duration.table.level))
        .leftJoin(taskToDoAfterAlias, lib.eq(table.id, taskToDoAfterAlias.task_id)) // tasks to do after this task
        .leftJoin(taskToDoBeforeAlias, lib.eq(table.id, taskToDoBeforeAlias.after_task_id)) // tasks to do before this task
        .where(lib.and(
            lib.eq(table.id, id),
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

        return result as lib.Schema.Task.Task.TaskWithRelations;
    } else {
        return dbresult[0] ? {
            ...dbresult[0],
            recursive: false
        } as lib.Schema.Task.Task.TaskWithNonRecursiveRelations : null;
    }

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
    orderBy: keyof Existing = "score",
    orderingDirection?: "asc" | "desc",
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

    // Step 2: Now fetch all related data for these specific tasks
    const rows = await lib.db
        .select({
            id: table.id,
            title: table.title,
            importance: table.importance,
            urgency: table.urgency,
            duration: table.duration,
            due: table.due,
            score: table.score,
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
        .from(table)
        .leftJoin(lib.Schema.Project.table, lib.eq(table.project_id, lib.Schema.Project.table.id))
        .leftJoin(lib.Schema.Task.Importance.table, lib.eq(table.importance, lib.Schema.Task.Importance.table.level))
        .leftJoin(lib.Schema.Task.Duration.table, lib.eq(table.duration, lib.Schema.Task.Duration.table.level))
        .leftJoin(taskToDoAfterAlias, lib.eq(table.id, taskToDoAfterAlias.task_id))
        .leftJoin(taskToDoBeforeAlias, lib.eq(table.id, taskToDoBeforeAlias.after_task_id))
        .where(lib.inArray(table.id, taskIds))

    const groupedTasks: Record<string, lib.Schema.Task.Task.TaskWithRelations> = {}

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

    return result as lib.Schema.Task.Task.TaskWithRelations[]
}

export async function getCompletedTasks(userId: string, orderBy: keyof Existing = "completed_at", orderingDirection?: "asc" | "desc", limit = 50, projectIds?: number[], excludedProjectIds?: number[], dueBefore?: Date, dueAfter?: Date) {
    return getTasks(userId, orderBy, orderingDirection, limit, projectIds, excludedProjectIds, dueBefore, dueAfter, true);
}

export async function getUncompletedTasks(userId: string, orderBy: keyof Existing = "score", orderingDirection?: "asc" | "desc", limit = 50, projectIds?: number[], excludedProjectIds?: number[], dueBefore?: Date, dueAfter?: Date) {
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

export async function getUncompletedAndDueInTheNextThreeDaysOrLessTasks(userId: string, orderBy: keyof Existing = "score", orderingDirection?: "asc" | "desc") {
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
            score: table.score,
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
        recursive: false as const
    })) as lib.Schema.Task.Task.TaskWithNonRecursiveRelations[]

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
            score: importance * urgency - duration,
            updated_at: lib.sql`CURRENT_TIMESTAMP`,
        })
        .where(lib.and(
            lib.eq(table.id, id),
        ))

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
            score: todoData.importance * urgency - todoData.duration,
            updated_at: lib.sql`CURRENT_TIMESTAMP`,
        })
        .where(lib.and(
            lib.eq(table.id, id),
            lib.eq(table.user_id, userId),
        ))
        .returning({id: table.id})

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
        .returning({id: table.id})

    await RecurrencyQueries.IncrementCurrentCount(id);

    const nextDue = await RecurrencyQueries.CalculateNextDue(id);

    let new_task_id: number | undefined = undefined;

    if (nextDue) {
        const local_new_task_id = await duplicateTask(id, {due: nextDue});
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
        .returning({id: table.id})

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
        .set({deleted_at: lib.sql`CURRENT_TIMESTAMP`, updated_at: lib.sql`CURRENT_TIMESTAMP`})
        .where(lib.and(
            lib.eq(table.id, id),
            lib.eq(table.user_id, userId),
        ))
        .returning({id: table.id})

    // Revalidate all pages that might show todos
    lib.revalidatePath("/my", 'layout')

    if (result && result.length > 0) {
        return result[0].id
    }

    return null
}

export async function recoverTaskById(userId: string, id: number) {
    const result = await lib.db.update(table)
        .set({deleted_at: null, updated_at: lib.sql`CURRENT_TIMESTAMP`})
        .where(lib.and(
            lib.eq(table.id, id),
            lib.eq(table.user_id, userId),
        ))
        .returning({id: table.id})

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
        .returning({id: table.id})

    // Revalidate all pages that might show todos
    lib.revalidatePath("/my", 'layout')

    if (result && result.length > 0) {
        return result[0].id
    }

    return null
}

// # TaskToDoAfter

// ## Create
export async function createTaskToDoAfter(
    todoIdOrTaskToDoAfter: number | lib.Schema.Task.ToDoAfter.Insert,
    after_task_id?: number
) {
    let newTaskToDoAfter: lib.Schema.Task.ToDoAfter.Insert

    if (typeof todoIdOrTaskToDoAfter === "number") {
        newTaskToDoAfter = {
            task_id: todoIdOrTaskToDoAfter,
            after_task_id: after_task_id!,
        }
    } else {
        newTaskToDoAfter = todoIdOrTaskToDoAfter
    }

    const result = await lib.db
        .insert(lib.Schema.Task.ToDoAfter.table)
        .values(newTaskToDoAfter)
        .returning({id: lib.Schema.Task.ToDoAfter.table.id})

    return result[0].id
}

// ## Read
export async function getTaskToDoAfterById(id: number) {
    return (await lib.db
        .select()
        .from(lib.Schema.Task.ToDoAfter.table)
        .where(lib.eq(lib.Schema.Task.ToDoAfter.table.id, id))) as lib.Schema.Task.ToDoAfter.Select[]
}

export async function getTaskToDoAfterByTodoId(task_id: number) {
    return (await lib.db
        .select()
        .from(lib.Schema.Task.ToDoAfter.table)
        .where(lib.eq(lib.Schema.Task.ToDoAfter.table.task_id, task_id))) as lib.Schema.Task.ToDoAfter.Select[]
}

export async function getTasksToDoAfter(task_id: number) {
    return getTaskToDoAfterByTodoId(task_id);
}

export async function getTaskToDoAfterByAfterId(after_task_id: number) {
    return (await lib.db
        .select()
        .from(lib.Schema.Task.ToDoAfter.table)
        .where(lib.eq(lib.Schema.Task.ToDoAfter.table.after_task_id, after_task_id))) as lib.Schema.Task.ToDoAfter.Select[]
}

export async function getTasksToDoBefore(after_task_id: number) {
    return getTaskToDoAfterByAfterId(after_task_id);
}

export async function getTaskToDoAfterById1AndId2(task_id: number, after_task_id: number) {
    return (await lib.db
        .select()
        .from(lib.Schema.Task.ToDoAfter.table)
        .where(lib.and(
            lib.eq(lib.Schema.Task.ToDoAfter.table.task_id, task_id),
            lib.eq(lib.Schema.Task.ToDoAfter.table.after_task_id, after_task_id)
        ))) as lib.Schema.Task.ToDoAfter.Select[]
}

// ## Update

export async function updateTaskToDoAfter(
    idOrTaskToDoAfter: number | lib.Schema.Task.ToDoAfter.Insert,
    task_id?: number,
    after_task_id?: number
) {
    let updatedTaskToDoAfter: Partial<lib.Schema.Task.ToDoAfter.Insert>

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

    const result = await lib.db
        .update(lib.Schema.Task.ToDoAfter.table)
        .set(updatedTaskToDoAfter)
        .where(lib.eq(lib.Schema.Task.ToDoAfter.table.id, typeof idOrTaskToDoAfter === "number" ? idOrTaskToDoAfter : idOrTaskToDoAfter.id!))
        .returning({id: lib.Schema.Task.ToDoAfter.table.id})

    return result[0].id
}

// ## Delete

export async function deleteTaskToDoAfterById(id: number) {
    const result = await lib.db
        .update(lib.Schema.Task.ToDoAfter.table)
        .set({deleted_at: lib.sql`CURRENT_TIMESTAMP`, updated_at: lib.sql`CURRENT_TIMESTAMP`})
        .where(lib.eq(lib.Schema.Task.ToDoAfter.table.id, id))
        .returning({id: lib.Schema.Task.ToDoAfter.table.id})

    if (result && result.length > 0) {
        return result[0].id
    }

    return null
}

export async function deleteTaskToDoAfterByTodoId(task_id: number) {
    const result = await lib.db
        .update(lib.Schema.Task.ToDoAfter.table)
        .set({deleted_at: lib.sql`CURRENT_TIMESTAMP`, updated_at: lib.sql`CURRENT_TIMESTAMP`})
        .where(lib.eq(lib.Schema.Task.ToDoAfter.table.task_id, task_id))
        .returning({id: lib.Schema.Task.ToDoAfter.table.id})

    if (result && result.length > 0) {
        return result[0].id
    }

    return null
}

export async function deleteTaskToDoAfterByAfterId(after_task_id: number) {
    const result = await lib.db
        .update(lib.Schema.Task.ToDoAfter.table)
        .set({deleted_at: lib.sql`CURRENT_TIMESTAMP`, updated_at: lib.sql`CURRENT_TIMESTAMP`})
        .where(lib.eq(lib.Schema.Task.ToDoAfter.table.after_task_id, after_task_id))
        .returning({id: lib.Schema.Task.ToDoAfter.table.id})

    if (result && result.length > 0) {
        return result[0].id
    }

    return null
}

