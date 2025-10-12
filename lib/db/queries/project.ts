"use server"

import * as lib from "./lib"

const table = lib.Schema.Project.table
type New = lib.Schema.Project.Insert
type Existing = lib.Schema.Project.Select

// # Project

// ## Create

export async function createProject(userId: string, title: string, description?: string) {
    const result = await lib.db
        .insert(table)
        .values({
            title: title,
            description: description,
            user_id: userId,
        } as New)
        .returning({id: table.id})

    // Revalidate all pages that might show projects
    lib.revalidatePath("/my", 'layout')

    return result[0].id
}

// ## Read

export async function searchProjects(userId: string, title: string, limit = 50): Promise<Existing[]> {
    return await lib.db
        .select()
        .from(table)
        .where(lib.and(
            lib.sql`LOWER(${table.title}) LIKE LOWER(${`%${title}%`})`,
            lib.isNull(table.deleted_at),
            lib.eq(table.user_id, userId),
        ))
        .orderBy(lib.asc(table.title))
        .limit(limit === -1 ? Number.MAX_SAFE_INTEGER : limit) as Existing[]
}

export async function getProjectById(userId: string, id: number): Promise<Existing> {
    const dbresult = await lib.db
        .select()
        .from(table)
        .where(lib.and(
            lib.eq(table.id, id),
            lib.isNull(table.deleted_at),
            lib.eq(table.user_id, userId),
        )) as Existing[]

    if (!dbresult) {
        throw new Error("Project not found")
    }

    return dbresult[0];
}

export async function getProjectByTitle(userId: string, title: string): Promise<Existing> {
    const dbresult = await lib.db
        .select()
        .from(table)
        .where(lib.and(
            lib.eq(table.title, title),
            lib.isNull(table.deleted_at),
            lib.eq(table.user_id, userId),
        )) as Existing[]

    if (!dbresult) {
        throw new Error("Project not found")
    }

    return dbresult[0];
}

export async function getProjects(userId: string, limit = 50): Promise<Existing[]> {
    return await lib.db
        .select()
        .from(table)
        .where(lib.and(
            lib.isNull(table.deleted_at),
            lib.eq(table.user_id, userId),
        ))
        .groupBy(table.id)
        .limit(limit === -1 ? Number.MAX_SAFE_INTEGER : limit) as Existing[]
}

export async function getProjectsWithTasks(userId: string, completed?: boolean, taskDeleted?: boolean, taskDueDate?: Date, taskCompleted?: boolean): Promise<Existing[]> {
    const projectsIds = (await lib.db
        .selectDistinct({
            id: lib.Schema.Task.Task.table.project_id,
        })
        .from(lib.Schema.Task.Task.table)
        .where(lib.and(
            lib.eq(lib.Schema.Task.Task.table.user_id, userId),
            completed ? lib.isNotNull(lib.Schema.Task.Task.table.completed_at) : completed === false ? lib.isNull(lib.Schema.Task.Task.table.completed_at) : lib.sql`1 = 1`,
            taskDeleted ? lib.isNotNull(lib.Schema.Task.Task.table.deleted_at) : taskDeleted === false ? lib.isNull(lib.Schema.Task.Task.table.deleted_at) : lib.sql`1 = 1`,
            taskCompleted ? lib.isNotNull(lib.Schema.Task.Task.table.completed_at) : taskCompleted === false ? lib.isNull(lib.Schema.Task.Task.table.completed_at) : lib.sql`1 = 1`,
            taskDueDate ? lib.lte(lib.Schema.Task.Task.table.due, taskDueDate) : lib.sql`1 = 1`,
        ))).map(row => row.id)

    if (projectsIds.length === 0) {
        return []
    }

    const projects: Existing[] = await lib.db
        .select()
        .from(table)
        .where(lib.and(
            lib.inArray(table.id, projectsIds.filter(id => id !== null)),
        ))

    if (projectsIds.includes(null)) {
        projects.push({
            id: -1,
            title: "No project",
            description: null,
            completed: false,
            created_at: new Date(0),
            updated_at: new Date(0),
            deleted_at: null,
            user_id: userId,
        })
    }

    return projects;
}

export async function getCompletedProjectsWithTasks(userId: string, taskDeleted?: boolean, taskDueDate?: Date, taskCompleted: boolean = false) {
    return getProjectsWithTasks(userId, true, taskDeleted, taskDueDate, taskCompleted);
}

export async function getUncompletedProjectsWithTasks(userId: string, taskDeleted?: boolean, taskDueDate?: Date, taskCompleted: boolean = false) {
    return getProjectsWithTasks(userId, false, taskDeleted, taskDueDate, taskCompleted);
}

export async function getProjectsWithNotes(
    userId: string,
) {
    const projectsIds = (await lib.db
        .selectDistinct({
            id: lib.Schema.Note.Note.table.project_id,
        })
        .from(lib.Schema.Note.Note.table)
        .where(lib.and(
            lib.eq(lib.Schema.Note.Note.table.user_id, userId),
        ))).map(row => row.id)

    if (projectsIds.length === 0) {
        return []
    }

    const projects: Existing[] = await lib.db
        .select()
        .from(table)
        .where(lib.and(
            lib.inArray(table.id, projectsIds.filter(id => id !== null)),
        ))

    if (projectsIds.includes(null)) {
        projects.push({
            id: -1,
            title: "No project",
            description: null,
            completed: false,
            created_at: new Date(0),
            updated_at: new Date(0),
            deleted_at: null,
            user_id: userId,
        })
    }

    return projects;
}

// ## Update

export async function updateProject(userId: string, title: string, new_title?: string, description?: string) {
    const result = await lib.db
        .update(table)
        .set({
            title: new_title ? new_title : title,
            description: description,
            updated_at: lib.sql`CURRENT_TIMESTAMP`,
        })
        .where(lib.and(
            lib.eq(table.title, title),
            lib.eq(table.user_id, userId),
        ))
        .returning({title: table.title})

    // Revalidate all pages that might show projects
    lib.revalidatePath("/my", 'layout')

    if (!result) {
        return null
    }

    return result[0].title
}

export async function completeProject(userId: string, title: string) {
    const result = await lib.db
        .update(table)
        .set({
            completed: true,
            updated_at: lib.sql`CURRENT_TIMESTAMP`,
        })
        .where(lib.and(
            lib.eq(table.title, title),
            lib.eq(table.user_id, userId),
        ))
        .returning({title: table.title})

    // Revalidate all pages that might show projects
    lib.revalidatePath("/my", 'layout')

    if (!result) {
        return null
    }

    return result[0].title
}

export async function uncompleteProject(userId: string, title: string) {
    const result = await lib.db
        .update(table)
        .set({
            completed: false,
            updated_at: lib.sql`CURRENT_TIMESTAMP`,
        })
        .where(lib.and(
            lib.eq(table.title, title),
            lib.eq(table.user_id, userId),
        ))
        .returning({title: table.title})

    // Revalidate all pages that might show projects
    lib.revalidatePath("/my", 'layout')

    if (!result) {
        return null
    }

    return result[0].title
}

// ## Delete

export async function deleteProject(userId: string, title: string) {
    const result = await lib.db.update(table)
        .set({
            deleted_at: lib.sql`CURRENT_TIMESTAMP`,
            updated_at: lib.sql`CURRENT_TIMESTAMP`
        })
        .where(lib.and(
            lib.eq(table.title, title),
            lib.eq(table.user_id, userId),
        ))
        .returning({title: table.title})

    // Revalidate all pages that might show projects
    lib.revalidatePath("/my", 'layout')

    if (result && result.length > 0) {
        return result[0].title
    }

    return null
}