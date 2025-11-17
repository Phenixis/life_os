"use server"

import * as lib from "./lib"

export type NoteWithProject = lib.Schema.Note.Note.Select & {
    project_title?: string | null
}

export type NotesAndData = {
    notes: NoteWithProject[]
    totalCount: number
    totalPages: number
    currentPage: number
    limit: number
}

export async function getNotes(
    userId: string,
    title?: string,
    projectTitle?: string,
    limit: number = 25,
    page: number = 1,
    projectTitles?: string[],
    excludedProjectTitles?: string[],
    createdAfter?: Date,
    createdBefore?: Date
) {
    // Build date filter condition
    const dateCondition = (() => {
        if (createdAfter && createdBefore) {
            const startDay = new Date(createdAfter.getFullYear(), createdAfter.getMonth(), createdAfter.getDate())
            const endDay = new Date(createdBefore.getFullYear(), createdBefore.getMonth(), createdBefore.getDate())
            
            if (startDay.getTime() === endDay.getTime()) {
                // Single day filter
                return lib.sql`DATE(${lib.Schema.Note.Note.table.created_at}) = DATE(${createdAfter.toISOString()}::timestamp)`
            } else {
                // Range filter
                return lib.and(
                    lib.gte(lib.Schema.Note.Note.table.created_at, createdAfter),
                    lib.lte(lib.Schema.Note.Note.table.created_at, createdBefore)
                )
            }
        } else if (createdAfter) {
            return lib.gte(lib.Schema.Note.Note.table.created_at, createdAfter)
        } else if (createdBefore) {
            return lib.lte(lib.Schema.Note.Note.table.created_at, createdBefore)
        }
        return undefined
    })()

    // Get total count
    const [{ count }] = await lib.db
        .select({ count: lib.sql<number>`count(*)` })
        .from(lib.Schema.Note.Note.table)
        .leftJoin(lib.Schema.Project.table, lib.eq(lib.Schema.Note.Note.table.project_id, lib.Schema.Project.table.id))
        .where(
            lib.and(
                lib.isNull(lib.Schema.Note.Note.table.deleted_at),
                lib.eq(lib.Schema.Note.Note.table.user_id, userId),
                title ? lib.sql`LOWER(${lib.Schema.Note.Note.table.title}) LIKE LOWER(${'%' + title + '%'})` : undefined,
                projectTitle ? (lib.and(
                    lib.isNotNull(lib.Schema.Note.Note.table.project_id),
                    lib.sql`LOWER(${lib.Schema.Project.table.title}) LIKE LOWER(${'%' + projectTitle + '%'})`,
                )) : undefined,
                projectTitles && projectTitles.length > 0 ? lib.or(
                    lib.inArray(lib.Schema.Project.table.title, projectTitles.filter(p => p !== "No project")),
                    projectTitles.includes("No project") ? lib.isNull(lib.Schema.Note.Note.table.project_id) : undefined
                ) : undefined,
                excludedProjectTitles && excludedProjectTitles.length > 0 ? lib.and(
                    lib.not(lib.inArray(lib.Schema.Project.table.title, excludedProjectTitles.filter(p => p !== "No project"))),
                    excludedProjectTitles.includes("No project") ? lib.isNotNull(lib.Schema.Note.Note.table.project_id) : lib.sql`1 = 1`
                ) : undefined,
                dateCondition
            )
        )

    // Get paginated notes
    const notes = await lib.db.select({
        id: lib.Schema.Note.Note.table.id,
        user_id: lib.Schema.Note.Note.table.user_id,
        project_id: lib.Schema.Note.Note.table.project_id,
        title: lib.Schema.Note.Note.table.title,
        content: lib.Schema.Note.Note.table.content,
        salt: lib.Schema.Note.Note.table.salt,
        iv: lib.Schema.Note.Note.table.iv,
        created_at: lib.Schema.Note.Note.table.created_at,
        updated_at: lib.Schema.Note.Note.table.updated_at,
        deleted_at: lib.Schema.Note.Note.table.deleted_at,
        project_title: lib.Schema.Project.table.title,
    }).from(lib.Schema.Note.Note.table)
        .leftJoin(lib.Schema.Project.table, lib.eq(lib.Schema.Note.Note.table.project_id, lib.Schema.Project.table.id))
        .where(
        lib.and(
            lib.isNull(lib.Schema.Note.Note.table.deleted_at),
            lib.eq(lib.Schema.Note.Note.table.user_id, userId),
            title ? lib.sql`LOWER(${lib.Schema.Note.Note.table.title}) LIKE LOWER(${'%' + title + '%'})` : undefined,
            projectTitle ? (lib.and(
                lib.isNotNull(lib.Schema.Note.Note.table.project_id),
                lib.sql`LOWER(${lib.Schema.Project.table.title}) LIKE LOWER(${'%' + projectTitle + '%'})`
            )) : undefined,
            projectTitles && projectTitles.length > 0 ? (
                projectTitles.includes("No project")
                    ?   lib.or(
                        lib.inArray(lib.Schema.Project.table.title, projectTitles.filter(p => p !== "No project")),
                        lib.isNull(lib.Schema.Note.Note.table.project_id)
                    )
                    : lib.inArray(lib.Schema.Project.table.title, projectTitles)
            ) : undefined,
            excludedProjectTitles && excludedProjectTitles.length > 0 ? (
                excludedProjectTitles.includes("No project")
                    ? lib.and(
                        lib.not(lib.inArray(lib.Schema.Project.table.title, excludedProjectTitles.filter(p => p !== "No project"))),
                        lib.isNotNull(lib.Schema.Note.Note.table.project_id)
                    )
                    : lib.or(
                        lib.not(lib.inArray(lib.Schema.Project.table.title, excludedProjectTitles)),
                        lib.isNull(lib.Schema.Note.Note.table.project_id)
                    )
            ) : undefined,
            dateCondition
        )
    )
        .orderBy(lib.desc(lib.Schema.Note.Note.table.created_at))
        .offset((page - 1) * limit)
        .limit(limit)

    return {
        notes,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit
    } as NotesAndData
}

export async function createNote(userId: string, title: string, content: string, projectId?: number, salt?: string, iv?: string) {

    const note = await lib.db.insert(lib.Schema.Note.Note.table).values({
        user_id: userId,
        title,
        content,
        project_id: projectId,
        salt,
        iv
    }).returning({ id: lib.Schema.Note.Note.table.id })

    if (note[0].id) {
        lib.revalidatePath("/my", "layout");
    }

    return note[0].id
}

export async function updateNote(userId: string, id: number, title: string, content: string, projectTitle?: string, salt?: string, iv?: string) {
    let projectIdToSet: number | null | undefined = undefined;
    if (projectTitle !== undefined) {
        if (projectTitle === "" || projectTitle === "No project") {
            projectIdToSet = null;
        } else {
            const proj = await lib.db
                .select({ id: lib.Schema.Project.table.id })
                .from(lib.Schema.Project.table)
                .where(lib.and(
                    lib.eq(lib.Schema.Project.table.user_id, userId),
                    lib.eq(lib.Schema.Project.table.title, projectTitle)
                ))
                .limit(1);
            
            if (proj.length > 0) {
                projectIdToSet = proj[0].id;
            } else {
                // Project doesn't exist, create it
                const newProject = await lib.db.insert(lib.Schema.Project.table).values({
                    user_id: userId,
                    title: projectTitle,
                }).returning({ id: lib.Schema.Project.table.id });
                projectIdToSet = newProject[0].id;
            }
        }
    }

    const note = await lib.db.update(lib.Schema.Note.Note.table).set({
        title,
        content,
        project_id: projectIdToSet as any,
        salt,
        iv
    }).where(lib.and(lib.eq(lib.Schema.Note.Note.table.id, id), lib.eq(lib.Schema.Note.Note.table.user_id, userId)))

    lib.revalidatePath("/my", "layout");

    return note
}

export async function deleteNote(userId: string, id: number) {
    const note = await lib.db.update(lib.Schema.Note.Note.table).set({
        deleted_at: new Date()
    }).where(lib.and(lib.eq(lib.Schema.Note.Note.table.id, id), lib.eq(lib.Schema.Note.Note.table.user_id, userId)))

    lib.revalidatePath("/my", "layout");

    return note
}

export async function getDeletedNotes(
    userId: string,
    limit: number = 25,
    page: number = 1
) {
    // Get total count
    const [{ count }] = await lib.db
        .select({ count: lib.sql<number>`count(*)` })
        .from(lib.Schema.Note.Note.table)
        .where(
            lib.and(
                lib.isNotNull(lib.Schema.Note.Note.table.deleted_at),
                lib.eq(lib.Schema.Note.Note.table.user_id, userId)
            )
        )

    // Get paginated notes
    const notes = await lib.db.select({
        id: lib.Schema.Note.Note.table.id,
        user_id: lib.Schema.Note.Note.table.user_id,
        project_id: lib.Schema.Note.Note.table.project_id,
        title: lib.Schema.Note.Note.table.title,
        content: lib.Schema.Note.Note.table.content,
        salt: lib.Schema.Note.Note.table.salt,
        iv: lib.Schema.Note.Note.table.iv,
        created_at: lib.Schema.Note.Note.table.created_at,
        updated_at: lib.Schema.Note.Note.table.updated_at,
        deleted_at: lib.Schema.Note.Note.table.deleted_at,
    }).from(lib.Schema.Note.Note.table)
        .where(
            lib.and(
                lib.isNotNull(lib.Schema.Note.Note.table.deleted_at),
                lib.eq(lib.Schema.Note.Note.table.user_id, userId)
            )
        )
        .orderBy(lib.desc(lib.Schema.Note.Note.table.deleted_at))
        .offset((page - 1) * limit)
        .limit(limit)

    return {
        notes,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        limit
    } as NotesAndData
}

export async function recoverNote(userId: string, id: number) {
    const note = await lib.db.update(lib.Schema.Note.Note.table).set({
        deleted_at: null
    }).where(lib.and(lib.eq(lib.Schema.Note.Note.table.id, id), lib.eq(lib.Schema.Note.Note.table.user_id, userId)))

    lib.revalidatePath("/my", "layout");

    return note
}

export async function permanentlyDeleteNote(userId: string, id: number) {
    const note = await lib.db.delete(lib.Schema.Note.Note.table)
        .where(lib.and(
            lib.eq(lib.Schema.Note.Note.table.id, id),
            lib.eq(lib.Schema.Note.Note.table.user_id, userId),
            lib.isNotNull(lib.Schema.Note.Note.table.deleted_at)
        ))
        .returning({id: lib.Schema.Note.Note.table.id})

    lib.revalidatePath("/my", "layout");

    if (note && note.length > 0) {
        return note[0].id
    }

    return null
}