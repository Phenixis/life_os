import {NextRequest, NextResponse} from "next/server"
import {NoteQueries} from "@/lib/db/queries"

export async function GET(
    request: NextRequest,
    {params}: {params: Promise<{token: string}>}
) {
    const {token} = await params

    if (!token) {
        return NextResponse.json({error: "Missing token"}, {status: 400})
    }

    try {
        const note = await NoteQueries.getSharedNote(token)
        
        if (!note) {
            return NextResponse.json({error: "Note not found or not shared"}, {status: 404})
        }

        // Don't share encrypted notes - return error
        if (note.salt && note.iv) {
            return NextResponse.json({error: "Encrypted notes cannot be shared"}, {status: 403})
        }

        return NextResponse.json(note)
    } catch (error) {
        console.error("Error fetching shared note:", error)
        return NextResponse.json({error: "Failed to fetch shared note"}, {status: 500})
    }
}
