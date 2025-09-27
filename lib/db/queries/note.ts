"use server"

import * as lib from "./lib"

export type NotesAndData = {
    notes: lib.Schema.Note.Note.Select[]
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
    excludedProjectTitles?: string[]
) {
    // Get total count
    const [{ count }] = await lib.db
        .select({ count: lib.sql<number>`count(*)` })
        .from(lib.Schema.Note.Note.table)
        .where(
            lib.and(
                lib.isNull(lib.Schema.Note.Note.table.deleted_at),
                lib.eq(lib.Schema.Note.Note.table.user_id, userId),
                title ? lib.sql`LOWER(${lib.Schema.Note.Note.table.title}) LIKE LOWER(${'%' + title + '%'})` : undefined,
                projectTitle ? (lib.and(
                    lib.isNotNull(lib.Schema.Note.Note.table.project_title),
                    lib.sql`LOWER(${lib.Schema.Note.Note.table.project_title}) LIKE LOWER(${'%' + projectTitle + '%'})`,
                )) : undefined,
                projectTitles && projectTitles.length > 0 ? lib.inArray(lib.Schema.Note.Note.table.project_title, projectTitles) : undefined,
                excludedProjectTitles && excludedProjectTitles.length > 0 ? lib.not(lib.inArray(lib.Schema.Note.Note.table.project_title, excludedProjectTitles)) : undefined
            )
        )

    // Get paginated notes
    const notes = await lib.db.select().from(lib.Schema.Note.Note.table).where(
        lib.and(
            lib.isNull(lib.Schema.Note.Note.table.deleted_at),
            lib.eq(lib.Schema.Note.Note.table.user_id, userId),
            title ? lib.sql`LOWER(${lib.Schema.Note.Note.table.title}) LIKE LOWER(${'%' + title + '%'})` : undefined,
            projectTitle ? (lib.and(
                lib.isNotNull(lib.Schema.Note.Note.table.project_title),
                lib.sql`LOWER(${lib.Schema.Note.Note.table.project_title}) LIKE LOWER(${'%' + projectTitle + '%'})`
            )) : undefined,
            projectTitles && projectTitles.length > 0 ? (
                projectTitles.includes("No project")
                    ?   lib.or(
                        lib.inArray(lib.Schema.Note.Note.table.project_title, projectTitles.filter(p => p !== "No project")),
                        lib.isNull(lib.Schema.Note.Note.table.project_title)
                    )
                    : lib.inArray(lib.Schema.Note.Note.table.project_title, projectTitles)
            ) : undefined,
            excludedProjectTitles && excludedProjectTitles.length > 0 ? (
                excludedProjectTitles.includes("No project")
                    ? lib.and(
                        lib.not(lib.inArray(lib.Schema.Note.Note.table.project_title, excludedProjectTitles.filter(p => p !== "No project"))),
                        lib.isNotNull(lib.Schema.Note.Note.table.project_title)
                    )
                    : lib.or(
                        lib.not(lib.inArray(lib.Schema.Note.Note.table.project_title, excludedProjectTitles)),
                        lib.isNull(lib.Schema.Note.Note.table.project_title)
                    )
            ) : undefined
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

export async function createNote(userId: string, title: string, content: string, projectTitle?: string, salt?: string, iv?: string) {
    const note = await lib.db.insert(lib.Schema.Note.Note.table).values({
        user_id: userId,
        title,
        content,
        project_title: projectTitle,
        salt,
        iv
    })

    return note
}

export async function updateNote(userId: string, id: number, title: string, content: string, projectTitle?: string, salt?: string, iv?: string) {
    const note = await lib.db.update(lib.Schema.Note.Note.table).set({
        title,
        content,
        project_title: projectTitle,
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