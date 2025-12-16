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
    projectIds?: number[],
    excludedProjectIds?: number[],
    createdAfter?: Date,
    createdBefore?: Date
) {
    // Build date filter condition
    const dateCondition = (() => {
        if (createdAfter && createdBefore) {
            // Use UTC methods to properly compare dates across timezones
            const startDay = new Date(Date.UTC(createdAfter.getUTCFullYear(), createdAfter.getUTCMonth(), createdAfter.getUTCDate()))
            const endDay = new Date(Date.UTC(createdBefore.getUTCFullYear(), createdBefore.getUTCMonth(), createdBefore.getUTCDate()))
            
            if (startDay.getTime() === endDay.getTime()) {
                // Single day filter - use AT TIME ZONE to ensure proper date comparison
                return lib.sql`DATE(${lib.Schema.Note.Note.table.created_at} AT TIME ZONE 'UTC') = DATE(${createdAfter.toISOString()}::timestamp AT TIME ZONE 'UTC')`
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
                projectIds && projectIds.length > 0 
                    ? lib.or(
                        lib.inArray(lib.Schema.Project.table.id, projectIds.filter(p => p !== -1)),
                        projectIds.includes(-1) ? lib.isNull(lib.Schema.Note.Note.table.project_id) : undefined
                    )
                    : undefined,
                excludedProjectIds && excludedProjectIds.length > 0 
                    ? lib.and(
                        lib.or(
                            lib.isNull(lib.Schema.Note.Note.table.project_id),
                            lib.not(lib.inArray(
                                lib.Schema.Project.table.id,
                                excludedProjectIds.filter(p => p !== -1)
                            ))
                        ),
                        excludedProjectIds.includes(-1)
                            ? lib.isNotNull(lib.Schema.Note.Note.table.project_id)
                            : lib.sql`1 = 1`
                    )
                    : undefined,
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
        share_token: lib.Schema.Note.Note.table.share_token,
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
            projectIds && projectIds.length > 0 
                ? lib.or(
                    lib.inArray(lib.Schema.Project.table.id, projectIds.filter(p => p !== -1)),
                    projectIds.includes(-1) ? lib.isNull(lib.Schema.Note.Note.table.project_id) : undefined
                )
                : undefined,
            excludedProjectIds && excludedProjectIds.length > 0 
                ? lib.and(
                    lib.or(
                        lib.isNull(lib.Schema.Note.Note.table.project_id),
                        lib.not(lib.inArray(
                            lib.Schema.Project.table.id,
                            excludedProjectIds.filter(p => p !== -1)
                        ))
                    ),
                    excludedProjectIds.includes(-1)
                        ? lib.isNotNull(lib.Schema.Note.Note.table.project_id)
                        : lib.sql`1 = 1`
                )
                : undefined,
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
        share_token: lib.Schema.Note.Note.table.share_token,
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

export async function generateShareToken(userId: string, noteId: number) {
    // Generate 24-char token (DB field is VARCHAR(32) for flexibility)
    const shareToken = lib.nanoid(24)
    
    const result = await lib.db.update(lib.Schema.Note.Note.table)
        .set({ share_token: shareToken })
        .where(lib.and(
            lib.eq(lib.Schema.Note.Note.table.id, noteId),
            lib.eq(lib.Schema.Note.Note.table.user_id, userId),
            lib.isNull(lib.Schema.Note.Note.table.deleted_at)
        ))
        .returning({ share_token: lib.Schema.Note.Note.table.share_token })
    
    if (result.length > 0) {
        return result[0].share_token
    }
    
    return null
}

export async function removeShareToken(userId: string, noteId: number) {
    const result = await lib.db.update(lib.Schema.Note.Note.table)
        .set({ share_token: null })
        .where(lib.and(
            lib.eq(lib.Schema.Note.Note.table.id, noteId),
            lib.eq(lib.Schema.Note.Note.table.user_id, userId),
            lib.isNull(lib.Schema.Note.Note.table.deleted_at)
        ))
        .returning({ id: lib.Schema.Note.Note.table.id })
    
    return result.length > 0
}

export async function getSharedNote(shareToken: string) {
    const notes = await lib.db.select({
        id: lib.Schema.Note.Note.table.id,
        user_id: lib.Schema.Note.Note.table.user_id,
        project_id: lib.Schema.Note.Note.table.project_id,
        title: lib.Schema.Note.Note.table.title,
        content: lib.Schema.Note.Note.table.content,
        salt: lib.Schema.Note.Note.table.salt,
        iv: lib.Schema.Note.Note.table.iv,
        share_token: lib.Schema.Note.Note.table.share_token,
        created_at: lib.Schema.Note.Note.table.created_at,
        updated_at: lib.Schema.Note.Note.table.updated_at,
        deleted_at: lib.Schema.Note.Note.table.deleted_at,
        project_title: lib.Schema.Project.table.title,
    })
        .from(lib.Schema.Note.Note.table)
        .leftJoin(lib.Schema.Project.table, lib.eq(lib.Schema.Note.Note.table.project_id, lib.Schema.Project.table.id))
        .where(lib.and(
            lib.eq(lib.Schema.Note.Note.table.share_token, shareToken),
            lib.isNull(lib.Schema.Note.Note.table.deleted_at)
        ))
        .limit(1)
    
    return notes.length > 0 ? notes[0] : null
}