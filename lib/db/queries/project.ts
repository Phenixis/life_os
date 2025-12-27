"use server"

import * as lib from "./lib"

const table = lib.Schema.Project.table
type New = lib.Schema.Project.Insert
type Existing = lib.Schema.Project.Select

// # Project

// ## Create

export async function createProject(userId: string, title: string, description?: string) {
    // Check if a project with the same title already exists
    const existingProject = await lib.db
        .select()
        .from(table)
        .where(lib.and(
            lib.eq(table.title, title),
            lib.eq(table.user_id, userId),
            lib.isNull(table.deleted_at),
        ))
        .limit(1) as Existing[]

    if (existingProject && existingProject.length > 0) {
        throw new Error("A project with this title already exists")
    }

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
            title: "No Project",
            description: "All entities without a project",
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

export async function updateProject(userId: string, id: number, title?: string, description?: string) {
    const updateData: any = {
        updated_at: lib.sql`CURRENT_TIMESTAMP`,
    }
    
    if (title !== undefined) {
        // Check if another project with the same title exists
        const existingProject = await lib.db
            .select()
            .from(table)
            .where(lib.and(
                lib.eq(table.title, title),
                lib.eq(table.user_id, userId),
                lib.isNull(table.deleted_at),
                lib.not(lib.eq(table.id, id)), // Exclude current project
            ))
            .limit(1) as Existing[]

        if (existingProject && existingProject.length > 0) {
            throw new Error("A project with this title already exists")
        }

        updateData.title = title
    }
    
    if (description !== undefined) {
        updateData.description = description
    }
    
    const result = await lib.db
        .update(table)
        .set(updateData)
        .where(lib.and(
            lib.eq(table.id, id),
            lib.eq(table.user_id, userId),
        ))
        .returning({id: table.id, title: table.title})

    // Revalidate all pages that might show projects
    lib.revalidatePath("/my", 'layout')

    if (!result || result.length === 0) {
        return null
    }

    return result[0]
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

// ## Merge

export async function mergeProjects(userId: string, sourceProjectId: number, targetProjectId: number) {
    // First, reassign all tasks from source project to target project
    await lib.db.update(lib.Schema.Task.Task.table)
        .set({ project_id: targetProjectId })
        .where(lib.and(
            lib.eq(lib.Schema.Task.Task.table.project_id, sourceProjectId),
            lib.eq(lib.Schema.Task.Task.table.user_id, userId),
        ))

    // Reassign all notes from source project to target project
    await lib.db.update(lib.Schema.Note.Note.table)
        .set({ project_id: targetProjectId })
        .where(lib.and(
            lib.eq(lib.Schema.Note.Note.table.project_id, sourceProjectId),
            lib.eq(lib.Schema.Note.Note.table.user_id, userId),
        ))

    // Then soft-delete the source project
    const result = await lib.db.update(table)
        .set({
            deleted_at: lib.sql`CURRENT_TIMESTAMP`,
            updated_at: lib.sql`CURRENT_TIMESTAMP`
        })
        .where(lib.and(
            lib.eq(table.id, sourceProjectId),
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

// ## Delete

export async function deleteProject(userId: string, id: number) {
    // First, unlink all tasks and notes from this project
    await lib.db.update(lib.Schema.Task.Task.table)
        .set({ project_id: null })
        .where(lib.and(
            lib.eq(lib.Schema.Task.Task.table.project_id, id),
            lib.eq(lib.Schema.Task.Task.table.user_id, userId),
        ))

    await lib.db.update(lib.Schema.Note.Note.table)
        .set({ project_id: null })
        .where(lib.and(
            lib.eq(lib.Schema.Note.Note.table.project_id, id),
            lib.eq(lib.Schema.Note.Note.table.user_id, userId),
        ))

    // Then soft-delete the project
    const result = await lib.db.update(table)
        .set({
            deleted_at: lib.sql`CURRENT_TIMESTAMP`,
            updated_at: lib.sql`CURRENT_TIMESTAMP`
        })
        .where(lib.and(
            lib.eq(table.id, id),
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