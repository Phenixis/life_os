import { NoteQueries } from "@/lib/db/queries"
import { type NextRequest, NextResponse } from "next/server"
import { verifyRequest } from "@/lib/auth/api"

// POST - Recover a deleted note
export async function POST(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const body = await request.json()
        const { id } = body

        if (!id) {
            return NextResponse.json({ error: "Missing note ID" }, { status: 400 })
        }

        await NoteQueries.recoverNote(verification.userId, Number(id))

        return NextResponse.json({ id: Number(id) })
    } catch (error) {
        console.error("Error recovering note:", error)
        return NextResponse.json({ error: "Failed to recover note" }, { status: 500 })
    }
}

// GET - Get deleted notes
export async function GET(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const searchParams = request.nextUrl.searchParams
        const limitParam = searchParams.get("limit")
        const pageParam = searchParams.get("page")
        const limit = limitParam ? Number.parseInt(limitParam) : 25
        const page = pageParam ? Number.parseInt(pageParam) : 1

        const notes = await NoteQueries.getDeletedNotes(verification.userId, limit, page)

        return NextResponse.json(notes)
    } catch (error) {
        console.error("Error fetching deleted notes:", error)
        return NextResponse.json({ error: "Failed to fetch deleted notes" }, { status: 500 })
    }
}

// DELETE - Permanently delete a note
export async function DELETE(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const url = new URL(request.url)
        const idParam = url.searchParams.get("id")

        if (!idParam) {
            return NextResponse.json({ error: "Missing note ID" }, { status: 400 })
        }

        const id = Number(idParam)

        const noteId = await NoteQueries.permanentlyDeleteNote(verification.userId, id)

        if (!noteId) {
            return NextResponse.json({ error: "Note not found or not in trash" }, { status: 404 })
        }

        return NextResponse.json({ id: noteId })
    } catch (error) {
        console.error("Error permanently deleting note:", error)
        return NextResponse.json({ error: "Failed to permanently delete note" }, { status: 500 })
    }
}
