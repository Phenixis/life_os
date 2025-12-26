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

interface GetProjectsOptions {
    limit?: number
    includeNoProject?: boolean
}

export async function getProjects(userId: string, options: GetProjectsOptions = {}): Promise<Existing[]> {
    const { limit = 50, includeNoProject = true } = options

    const projects = await lib.db
        .select()
        .from(table)
        .where(lib.and(
            lib.isNull(table.deleted_at),
            lib.eq(table.user_id, userId),
        ))
        .orderBy(lib.asc(table.title))
        .limit(limit === -1 ? Number.MAX_SAFE_INTEGER : limit) as Existing[]

    if (includeNoProject) {
        projects.unshift({
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

    return projects
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