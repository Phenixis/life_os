import { NextRequest, NextResponse } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { getNotes, createNote, updateNote, deleteNote } from "@/lib/db/queries/note"

export async function GET(request: NextRequest) {
	const verification = await verifyRequest(request)
	if ('error' in verification) return verification.error

    const searchParams = request.nextUrl.searchParams
    const title = searchParams.get("title") || undefined
    const projectTitle = searchParams.get("projectTitle") || undefined
    const projectTitles = searchParams.get("projectTitles")?.split(",") || undefined
    const excludedProjectTitles = searchParams.get("excludedProjectTitles")?.split(",") || undefined
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit") as string) : undefined
    const page = searchParams.get("page") ? Number.parseInt(searchParams.get("page") as string) : undefined

    try {
        const result = await getNotes(verification.userId, title, projectTitle, limit, page, projectTitles, excludedProjectTitles)
        return NextResponse.json(result)
    } catch (error) {
        console.error("Error fetching notes:", error)
        return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error
    
    const { title, content, project_title, salt, iv } = await request.json()

    try {
        const note = await createNote(verification.userId, title, content, project_title != "" ? project_title : undefined, salt, iv)
        return NextResponse.json(note)
    } catch (error) {
        console.error("Error creating note:", error)
        return NextResponse.json({ error: "Failed to create note" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error
    
    const { id, title, content, project_title, salt, iv } = await request.json()

    try {
        const note = await updateNote(verification.userId, id, title, content, project_title != "" ? project_title : null, salt, iv)
        return NextResponse.json(note)
    } catch (error) {
        console.error("Error updating note:", error)
        return NextResponse.json({ error: "Failed to update note" }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error
    
    const { id } = await request.json()

    try {
        const note = await deleteNote(verification.userId, id)
        return NextResponse.json(note)
    } catch (error) {
        console.error("Error deleting note:", error)
        return NextResponse.json({ error: "Failed to delete note" }, { status: 500 })
    }
}