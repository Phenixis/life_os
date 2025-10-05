"use server"

import { calculateUrgency } from "@/lib/utils/task";
import * as lib from "../lib";

import * as RecurrencyQueries from "./recurrency"

const taskToDoAfterAlias = lib.alias(lib.Schema.Task.ToDoAfter.table, 'taskToDoAfter');
const taskToDoBeforeAlias = lib.alias(lib.Schema.Task.ToDoAfter.table, 'taskToDoBefore');

// # TASK

// ## Create
export async function createTask(
    title: string,
    importance: number,
    dueDate: Date,
    duration: number,
    project?: string,
    userId?: string,
) {
    const urgency = calculateUrgency(dueDate)

    const result = await lib.db
        .insert(lib.Schema.Task.Task.table)
        .values({
            title: title,
            importance: importance,
            urgency: urgency,
            duration: duration,
            score: importance * urgency - duration,
            due: dueDate,
            project_title: project,
            user_id: userId,
        } as lib.Schema.Task.Task.Insert)
        .returning({ id: lib.Schema.Task.Task.table.id })

    const taskId = result[0].id

    // Revalidate all pages that might show todos
    lib.revalidatePath("/my", 'layout')

    return taskId
}

export async function duplicateTask(id: number, newValues: Partial<lib.Schema.Task.Task.Insert> = {}) {
    const task = await getTaskById(id);
    if (!task) return null;

    return createTask(
        newValues.title ? newValues.title : task.title,
        newValues.importance ? newValues.importance : task.importance,
        newValues.due ? newValues.due : task.due,
        newValues.duration ? newValues.duration : task.duration,
        newValues.project_title ? newValues.project_title : task.project_title ? task.project_title : undefined,
        newValues.user_id ? newValues.user_id : task.user_id
    );
}

// ## Read
export async function getTaskById(id: number, recursive: boolean = false) {
    const dbresult = await lib.db
        .select({
            id: lib.Schema.Task.Task.table.id,
            title: lib.Schema.Task.Task.table.title,
            importance: lib.Schema.Task.Task.table.importance,
            duration: lib.Schema.Task.Task.table.duration,
            urgency: lib.Schema.Task.Task.table.urgency,
            score: lib.Schema.Task.Task.table.score,
            due: lib.Schema.Task.Task.table.due,
            project_title: lib.Schema.Task.Task.table.project_title,
            completed_at: lib.Schema.Task.Task.table.completed_at,
            created_at: lib.Schema.Task.Task.table.created_at,
            updated_at: lib.Schema.Task.Task.table.updated_at,
            deleted_at: lib.Schema.Task.Task.table.deleted_at,
            user_id: lib.Schema.Task.Task.table.user_id,
            project: {
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
        .from(lib.Schema.Task.Task.table)
        .leftJoin(lib.Schema.Project.table, lib.eq(lib.Schema.Task.Task.table.project_title, lib.Schema.Project.table.title))
        .leftJoin(lib.Schema.Task.Importance.table, lib.eq(lib.Schema.Task.Task.table.importance, lib.Schema.Task.Importance.table.level))
        .leftJoin(lib.Schema.Task.Duration.table, lib.eq(lib.Schema.Task.Task.table.duration, lib.Schema.Task.Duration.table.level))
        .leftJoin(taskToDoAfterAlias, lib.eq(lib.Schema.Task.Task.table.id, taskToDoAfterAlias.task_id)) // tasks to do after this task
        .leftJoin(taskToDoBeforeAlias, lib.eq(lib.Schema.Task.Task.table.id, taskToDoBeforeAlias.after_task_id)) // tasks to do before this task
        .where(lib.and(
            lib.eq(lib.Schema.Task.Task.table.id, id),
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
            completed_count: lib.sql<number>`COUNT(CASE WHEN ${lib.Schema.Task.Task.table.completed_at} IS NOT NULL THEN 1 END)`.as("completed_count"),
            uncompleted_count: lib.sql<number>`COUNT(CASE WHEN ${lib.Schema.Task.Task.table.completed_at} IS NULL THEN 1 END)`.as("uncompleted_count"),
            due: lib.Schema.Task.Task.table.due,
        })
        .from(lib.Schema.Task.Task.table)
        .where(lib.and(
            lib.isNull(lib.Schema.Task.Task.table.deleted_at),
            lib.eq(lib.Schema.Task.Task.table.user_id, userId),
            projectTitles
                ? lib.or(
                    lib.inArray(lib.Schema.Task.Task.table.project_title, projectTitles),
                    lib.sql`${lib.isNull(lib.Schema.Task.Task.table.project_title)} and ${projectTitles.includes("No project")}`,
                )
                : lib.sql`1 = 1`,
            excludedProjectTitles && excludedProjectTitles.length > 0
                ? lib.and(
                    lib.or(
                        lib.isNull(lib.Schema.Task.Task.table.project_title),
                        lib.not(lib.inArray(
                            lib.Schema.Task.Task.table.project_title,
                            excludedProjectTitles.filter(p => p !== "No project")
                        ))
                    ),
                    excludedProjectTitles.includes("No project")
                        ? lib.isNotNull(lib.Schema.Task.Task.table.project_title)
                        : lib.sql`1 = 1`
                )
                : lib.sql`1 = 1`,
            dueAfter ? lib.gte(lib.Schema.Task.Task.table.due, dueAfter) : lib.sql`1 = 1`,
            dueBefore ? lib.lte(lib.Schema.Task.Task.table.due, dueBefore) : lib.sql`1 = 1`
        ))
        .groupBy(lib.Schema.Task.Task.table.due)

    return dbresult;
}

export async function getTasks(
    userId: string,
    orderBy: keyof lib.Schema.Task.Task.Select = "score",
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
    const distinctTasks = await lib.db
        .select({
            id: lib.Schema.Task.Task.table.id,
            title: lib.Schema.Task.Task.table.title,
            importance: lib.Schema.Task.Task.table.importance,
            urgency: lib.Schema.Task.Task.table.urgency,
            duration: lib.Schema.Task.Task.table.duration,
            due: lib.Schema.Task.Task.table.due,
            score: lib.Schema.Task.Task.table.score,
            completed_at: lib.Schema.Task.Task.table.completed_at,
            created_at: lib.Schema.Task.Task.table.created_at,
            updated_at: lib.Schema.Task.Task.table.updated_at,
            deleted_at: lib.Schema.Task.Task.table.deleted_at,
            project_title: lib.Schema.Task.Task.table.project_title,
            user_id: lib.Schema.Task.Task.table.user_id,
        })
        .from(lib.Schema.Task.Task.table)
        .where(
            lib.and(
                lib.isNull(lib.Schema.Task.Task.table.deleted_at),
                // Filter by user ID if provided
                lib.eq(lib.Schema.Task.Task.table.user_id, userId),
                // Include specific projects if provided
                projectTitles
                    ? lib.or(
                        lib.inArray(lib.Schema.Task.Task.table.project_title, projectTitles),
                        lib.sql`${lib.isNull(lib.Schema.Task.Task.table.project_title)} and ${projectTitles.includes("No project")}`,
                    )
                    : lib.sql`1 = 1`,
                // Exclude specific projects if provided
                excludedProjectTitles && excludedProjectTitles.length > 0
                    ? lib.and(
                        // For tasks with project titles
                        lib.or(
                            lib.isNull(lib.Schema.Task.Task.table.project_title),
                            lib.not(lib.inArray(
                                lib.Schema.Task.Task.table.project_title,
                                excludedProjectTitles.filter(p => p !== "No project")
                            ))
                        ),
                        // For tasks with null project title ("No project")
                        excludedProjectTitles.includes("No project")
                            ? lib.isNotNull(lib.Schema.Task.Task.table.project_title)
                            : lib.sql`1 = 1`
                    )
                    : lib.sql`1 = 1`,
                dueBefore ? lib.lte(lib.Schema.Task.Task.table.due, dueBefore) : lib.sql`1 = 1`,
                dueAfter ? lib.gte(lib.Schema.Task.Task.table.due, dueAfter) : lib.sql`1 = 1`,
                completed !== undefined
                    ? completed
                        ? lib.isNotNull(lib.Schema.Task.Task.table.completed_at)
                        : lib.isNull(lib.Schema.Task.Task.table.completed_at)
                    : lib.sql`1 = 1`,
                completed_after ? lib.gte(lib.Schema.Task.Task.table.completed_at, completed_after) : lib.sql`1 = 1`,
                completed_before ? lib.lte(lib.Schema.Task.Task.table.completed_at, completed_before) : lib.sql`1 = 1`,
            ),
        )
        .orderBy(
            orderingDirection === "asc" ? lib.asc(lib.Schema.Task.Task.table[orderBy]) : lib.desc(lib.Schema.Task.Task.table[orderBy]),
            orderingDirection === "asc" ? lib.asc(lib.Schema.Task.Task.table.title) : lib.desc(lib.Schema.Task.Task.table.title),
        )
        .limit(limit === -1 ? Number.MAX_SAFE_INTEGER : limit)

    if (distinctTasks.length === 0) return []

    // Get the IDs of the distinct tasks
    const taskIds = distinctTasks.map((task) => task.id)

    // Step 2: Now fetch all related data for these specific tasks
    const rows = await lib.db
        .select({
            id: lib.Schema.Task.Task.table.id,
            title: lib.Schema.Task.Task.table.title,
            importance: lib.Schema.Task.Task.table.importance,
            urgency: lib.Schema.Task.Task.table.urgency,
            duration: lib.Schema.Task.Task.table.duration,
            due: lib.Schema.Task.Task.table.due,
            score: lib.Schema.Task.Task.table.score,
            completed_at: lib.Schema.Task.Task.table.completed_at,
            created_at: lib.Schema.Task.Task.table.created_at,
            updated_at: lib.Schema.Task.Task.table.updated_at,
            deleted_at: lib.Schema.Task.Task.table.deleted_at,
            project_title: lib.Schema.Task.Task.table.project_title,
            user_id: lib.Schema.Task.Task.table.user_id,
            project: {
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
        .from(lib.Schema.Task.Task.table)
        .leftJoin(lib.Schema.Project.table, lib.eq(lib.Schema.Task.Task.table.project_title, lib.Schema.Project.table.title))
        .leftJoin(lib.Schema.Task.Importance.table, lib.eq(lib.Schema.Task.Task.table.importance, lib.Schema.Task.Importance.table.level))
        .leftJoin(lib.Schema.Task.Duration.table, lib.eq(lib.Schema.Task.Task.table.duration, lib.Schema.Task.Duration.table.level))
        .leftJoin(taskToDoAfterAlias, lib.eq(lib.Schema.Task.Task.table.id, taskToDoAfterAlias.task_id))
        .leftJoin(taskToDoBeforeAlias, lib.eq(lib.Schema.Task.Task.table.id, taskToDoBeforeAlias.after_task_id))
        .where(lib.inArray(lib.Schema.Task.Task.table.id, taskIds))

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

export async function getCompletedTasks(userId: string, orderBy: keyof lib.Schema.Task.Task.Select = "completed_at", orderingDirection?: "asc" | "desc", limit = 50, projectTitles?: string[], excludedProjectTitles?: string[], dueBefore?: Date, dueAfter?: Date) {
    return getTasks(userId, orderBy, orderingDirection, limit, projectTitles, excludedProjectTitles, dueBefore, dueAfter, true);
}

export async function getUncompletedTasks(userId: string, orderBy: keyof lib.Schema.Task.Task.Select = "score", orderingDirection?: "asc" | "desc", limit = 50, projectTitles?: string[], excludedProjectTitles?: string[], dueBefore?: Date, dueAfter?: Date) {
    return getTasks(userId, orderBy, orderingDirection, limit, projectTitles, excludedProjectTitles, dueBefore, dueAfter, false);
}

export async function searchTasksByTitle(userId: string, title: string, limit = 50) {
    return await lib.db
        .select()
        .from(lib.Schema.Task.Task.table)
        .where(lib.and(
            lib.sql`LOWER(${lib.Schema.Task.Task.table.title}) LIKE LOWER(${`%${title}%`})`,
            lib.eq(lib.Schema.Task.Task.table.user_id, userId),
            lib.isNull(lib.Schema.Task.Task.table.deleted_at),
            lib.isNull(lib.Schema.Task.Task.table.completed_at),
        ))
        .limit(limit === -1 ? Number.MAX_SAFE_INTEGER : limit) as lib.Schema.Task.Task.Select[]
}

export async function getUncompletedAndDueInTheNextThreeDaysOrLessTasks(userId: string, orderBy: keyof lib.Schema.Task.Task.Select = "score", orderingDirection?: "asc" | "desc") {
    const today = new Date()
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(today.getDate() + 3)

    return getTasks(userId, orderBy, orderingDirection, -1, undefined, undefined, threeDaysFromNow, undefined, false);
}

export async function getTasksCompletedTheDayBefore(userId: string, orderBy: keyof lib.Schema.Task.Task.Select = "completed_at", orderingDirection: "asc" | "desc" = "asc") {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    return getTasks(userId, orderBy, orderingDirection, -1, undefined, undefined, undefined, undefined, true, yesterday, today);
}

// ## Update
export async function updateTask(userId: string, id: number, title: string, importance: number, dueDate: Date, duration: number, projectTitle?: string) {
    const urgency = calculateUrgency(dueDate)

    const result = await lib.db
        .update(lib.Schema.Task.Task.table)
        .set({
            title: title,
            importance: importance,
            urgency: urgency,
            duration: duration,
            due: dueDate,
            score: importance * urgency - duration,
            project_title: projectTitle,
            updated_at: lib.sql`CURRENT_TIMESTAMP`,
        })
        .where(lib.and(
            lib.eq(lib.Schema.Task.Task.table.id, id),
            lib.eq(lib.Schema.Task.Task.table.user_id, userId),
        ))
        .returning({ id: lib.Schema.Task.Task.table.id })

    // Revalidate all pages that might show todos
    lib.revalidatePath("/my", 'layout')

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

    const result = await lib.db
        .update(lib.Schema.Task.Task.table)
        .set({
            urgency: urgency,
            score: todoData.importance * urgency - todoData.duration,
            updated_at: lib.sql`CURRENT_TIMESTAMP`,
        })
        .where(lib.and(
            lib.eq(lib.Schema.Task.Task.table.id, id),
            lib.eq(lib.Schema.Task.Task.table.user_id, userId),
        ))
        .returning({ id: lib.Schema.Task.Task.table.id })

    // Revalidate all pages that might show todos
    lib.revalidatePath("/my", 'layout')

    if (!result) {
        return null
    }

    return result[0].id
}

export async function markTaskAsDone(userId: string, id: number) : Promise<{
    done_task_id: number,
    new_task_id?: number
}> {
    const result = await lib.db
        .update(lib.Schema.Task.Task.table)
        .set({
            completed_at: lib.sql`CURRENT_TIMESTAMP`,
            updated_at: lib.sql`CURRENT_TIMESTAMP`,
        })
        .where(lib.and(
            lib.eq(lib.Schema.Task.Task.table.id, id),
            lib.eq(lib.Schema.Task.Task.table.user_id, userId),
        ))
        .returning({ id: lib.Schema.Task.Task.table.id })

    RecurrencyQueries.IncrementCurrentCount(id);

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
        .update(lib.Schema.Task.Task.table)
        .set({
            completed_at: null,
            updated_at: lib.sql`CURRENT_TIMESTAMP`,
        })
        .where(lib.and(
            lib.eq(lib.Schema.Task.Task.table.id, id),
            lib.eq(lib.Schema.Task.Task.table.user_id, userId),
        ))
        .returning({ id: lib.Schema.Task.Task.table.id })

    // Revalidate all pages that might show todos
    lib.revalidatePath("/my", 'layout')

    return result[0].id
}

export async function toggleTask(userId: string, id: number, currentState: boolean) {
    return currentState ? await markTaskAsUndone(userId, id) : await markTaskAsDone(userId, id);
}

// ## Delete
export async function deleteTaskById(userId: string, id: number) {

    const result = await lib.db.update(lib.Schema.Task.Task.table)
        .set({ deleted_at: lib.sql`CURRENT_TIMESTAMP`, updated_at: lib.sql`CURRENT_TIMESTAMP` })
        .where(lib.and(
            lib.eq(lib.Schema.Task.Task.table.id, id),
            lib.eq(lib.Schema.Task.Task.table.user_id, userId),
        ))
        .returning({ id: lib.Schema.Task.Task.table.id })

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
        .returning({ id: lib.Schema.Task.ToDoAfter.table.id })

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
        .returning({ id: lib.Schema.Task.ToDoAfter.table.id })

    return result[0].id
}

// ## Delete

export async function deleteTaskToDoAfterById(id: number) {
    const result = await lib.db
        .update(lib.Schema.Task.ToDoAfter.table)
        .set({ deleted_at: lib.sql`CURRENT_TIMESTAMP`, updated_at: lib.sql`CURRENT_TIMESTAMP` })
        .where(lib.eq(lib.Schema.Task.ToDoAfter.table.id, id))
        .returning({ id: lib.Schema.Task.ToDoAfter.table.id })

    if (result && result.length > 0) {
        return result[0].id
    }

    return null
}

export async function deleteTaskToDoAfterByTodoId(task_id: number) {
    const result = await lib.db
        .update(lib.Schema.Task.ToDoAfter.table)
        .set({ deleted_at: lib.sql`CURRENT_TIMESTAMP`, updated_at: lib.sql`CURRENT_TIMESTAMP` })
        .where(lib.eq(lib.Schema.Task.ToDoAfter.table.task_id, task_id))
        .returning({ id: lib.Schema.Task.ToDoAfter.table.id })

    if (result && result.length > 0) {
        return result[0].id
    }

    return null
}

export async function deleteTaskToDoAfterByAfterId(after_task_id: number) {
    const result = await lib.db
        .update(lib.Schema.Task.ToDoAfter.table)
        .set({ deleted_at: lib.sql`CURRENT_TIMESTAMP`, updated_at: lib.sql`CURRENT_TIMESTAMP` })
        .where(lib.eq(lib.Schema.Task.ToDoAfter.table.after_task_id, after_task_id))
        .returning({ id: lib.Schema.Task.ToDoAfter.table.id })

    if (result && result.length > 0) {
        return result[0].id
    }

    return null
}

