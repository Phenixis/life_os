"use server"

import * as lib from "./lib"

// # Project

// ## Create

export async function createProject(userId: string, title: string, description?: string) {
    const result = await lib.db
        .insert(lib.Schema.Project.table)
        .values({
            title: title,
            description: description,
            user_id: userId,
        } as lib.Schema.Project.Insert)
        .returning({ id: lib.Schema.Project.table.title })

    // Revalidate all pages that might show projects
    lib.revalidatePath("/my", 'layout')

    return result[0].id
}

// ## Read

export async function searchProjects(userId: string, title: string, limit = 50) {
    return await lib.db
        .select()
        .from(lib.Schema.Project.table)
        .where(lib.and(
            lib.sql`LOWER(${lib.Schema.Project.table.title}) LIKE LOWER(${`%${title}%`})`,
            lib.isNull(lib.Schema.Project.table.deleted_at),
            lib.eq(lib.Schema.Project.table.user_id, userId),
        ))
        .orderBy(lib.asc(lib.Schema.Project.table.title))
        .limit(limit === -1 ? Number.MAX_SAFE_INTEGER : limit) as lib.Schema.Project.Select[]
}

export async function getProject(userId: string, title: string) {
    const dbresult = await lib.db
        .select()
        .from(lib.Schema.Project.table)
        .where(lib.and(
            lib.eq(lib.Schema.Project.table.title, title),
            lib.isNull(lib.Schema.Project.table.deleted_at),
            lib.eq(lib.Schema.Project.table.user_id, userId),
        )) as lib.Schema.Project.Select[]

    if (!dbresult) {
        throw new Error("Project not found")
    }

    return dbresult[0];
}

export async function getProjects(userId: string, limit = 50, completed?: boolean, taskDeleted?: boolean, taskDueDate?: Date, taskCompleted: boolean = false) {
    const dbresult = await lib.db
        .select({
            title: lib.Schema.Project.table.title,
            description: lib.Schema.Project.table.description,
            completed: lib.Schema.Project.table.completed,
            created_at: lib.Schema.Project.table.created_at,
            updated_at: lib.Schema.Project.table.updated_at,
            deleted_at: lib.Schema.Project.table.deleted_at,
        })
        .from(lib.Schema.Project.table)
        .leftJoin(lib.Schema.Task.Task.table, lib.eq(lib.Schema.Project.table.title, lib.Schema.Task.Task.table.project_title))
        .where(lib.and(
            lib.isNull(lib.Schema.Project.table.deleted_at),
            lib.eq(lib.Schema.Project.table.user_id, userId),
            completed !== undefined ? lib.eq(lib.Schema.Project.table.completed, completed) : lib.sql`1 = 1`,
            taskDeleted !== undefined ? (taskDeleted ? lib.isNotNull(lib.Schema.Task.Task.table.deleted_at) : lib.isNull(lib.Schema.Task.Task.table.deleted_at)) : lib.sql`1 = 1`,
            taskCompleted !== undefined ? (taskCompleted ? lib.isNotNull(lib.Schema.Task.Task.table.completed_at) : lib.isNull(lib.Schema.Task.Task.table.completed_at)) : lib.sql`1 = 1`,
            taskDueDate ? lib.lte(lib.Schema.Task.Task.table.due, taskDueDate) : lib.sql`1 = 1`,
        ))
        .groupBy(lib.Schema.Project.table.title)
        .limit(limit === -1 ? Number.MAX_SAFE_INTEGER : limit) as lib.Schema.Project.Select[]

    const tasksWithoutProject = await lib.db
        .select()
        .from(lib.Schema.Task.Task.table)
        .where(
            lib.and(
                lib.isNull(lib.Schema.Task.Task.table.project_title),
                lib.isNull(lib.Schema.Task.Task.table.deleted_at),
                taskDueDate ? lib.lte(lib.Schema.Task.Task.table.due, taskDueDate) : lib.sql`1 = 1`,
                taskCompleted !== undefined
                    ? taskCompleted
                        ? lib.isNotNull(lib.Schema.Task.Task.table.completed_at)
                        : lib.isNull(lib.Schema.Task.Task.table.completed_at)
                    : lib.sql`1 = 1`,
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
    noteOrderBy?: keyof lib.Schema.Note.Note.Select,
    noteOrderingDirection?: "asc" | "desc",
    noteProjectTitle?: string,
) {
    // First get projects with notes
    const projectsWithNotes = await lib.db
        .select({
            title: lib.Schema.Project.table.title,
            description: lib.Schema.Project.table.description,
            completed: lib.Schema.Project.table.completed,
            created_at: lib.Schema.Project.table.created_at,
            updated_at: lib.Schema.Project.table.updated_at,
            deleted_at: lib.Schema.Project.table.deleted_at,
            user_id: lib.Schema.Project.table.user_id,
        })
        .from(lib.Schema.Project.table)
        .innerJoin(lib.Schema.Note.Note.table, lib.eq(lib.Schema.Project.table.title, lib.Schema.Note.Note.table.project_title))
        .where(lib.and(
            lib.isNull(lib.Schema.Project.table.deleted_at),
            lib.eq(lib.Schema.Project.table.user_id, userId),
            lib.isNull(lib.Schema.Note.Note.table.deleted_at),
            noteProjectTitle && noteProjectTitle !== "No project" ? lib.eq(lib.Schema.Note.Note.table.project_title, noteProjectTitle) : lib.sql`1 = 1`,
        ))
        .groupBy(lib.Schema.Project.table.title)
        .limit(limit === -1 ? Number.MAX_SAFE_INTEGER : limit) as lib.Schema.Project.Select[]

    // Check if there are any notes without a project
    const hasNotesWithoutProject = await lib.db
        .select({ count: lib.sql<number>`count(*)` })
        .from(lib.Schema.Note.Note.table)
        .where(lib.and(
            lib.isNull(lib.Schema.Note.Note.table.project_title),
            lib.isNull(lib.Schema.Note.Note.table.deleted_at),
            lib.eq(lib.Schema.Note.Note.table.user_id, userId),
        ))
        .then(result => result[0].count > 0)

    // If there are notes without a project lib.and we're not filtering by a specific project
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
    const result = await lib.db
        .update(lib.Schema.Project.table)
        .set({
            title: new_title ? new_title : title,
            description: description,
            updated_at: lib.sql`CURRENT_TIMESTAMP`,
        })
        .where(lib.and(
            lib.eq(lib.Schema.Project.table.title, title),
            lib.eq(lib.Schema.Project.table.user_id, userId),
        ))
        .returning({ title: lib.Schema.Project.table.title })

    // Revalidate all pages that might show projects
    lib.revalidatePath("/my", 'layout')

    if (!result) {
        return null
    }

    return result[0].title
}

export async function completeProject(userId: string, title: string) {
    const result = await lib.db
        .update(lib.Schema.Project.table)
        .set({
            completed: true,
            updated_at: lib.sql`CURRENT_TIMESTAMP`,
        })
        .where(lib.and(
            lib.eq(lib.Schema.Project.table.title, title),
            lib.eq(lib.Schema.Project.table.user_id, userId),
        ))
        .returning({ title: lib.Schema.Project.table.title })

    // Revalidate all pages that might show projects
    lib.revalidatePath("/my", 'layout')

    if (!result) {
        return null
    }

    return result[0].title
}

export async function uncompleteProject(userId: string, title: string) {
    const result = await lib.db
        .update(lib.Schema.Project.table)
        .set({
            completed: false,
            updated_at: lib.sql`CURRENT_TIMESTAMP`,
        })
        .where(lib.and(
            lib.eq(lib.Schema.Project.table.title, title),
            lib.eq(lib.Schema.Project.table.user_id, userId),
        ))
        .returning({ title: lib.Schema.Project.table.title })

    // Revalidate all pages that might show projects
    lib.revalidatePath("/my", 'layout')

    if (!result) {
        return null
    }

    return result[0].title
}

// ## Delete

export async function deleteProject(userId: string, title: string) {
    const result = await lib.db.update(lib.Schema.Project.table)
        .set({
            deleted_at: lib.sql`CURRENT_TIMESTAMP`,
            updated_at: lib.sql`CURRENT_TIMESTAMP`
        })
        .where(lib.and(
            lib.eq(lib.Schema.Project.table.title, title),
            lib.eq(lib.Schema.Project.table.user_id, userId),
        ))
        .returning({ title: lib.Schema.Project.table.title })

    // Revalidate all pages that might show projects
    lib.revalidatePath("/my", 'layout')

    if (result && result.length > 0) {
        return result[0].title
    }

    return null
}