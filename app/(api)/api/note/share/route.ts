import {NextRequest, NextResponse} from "next/server"
import {verifyRequest} from "@/lib/auth/api"
import {NoteQueries} from "@/lib/db/queries"

export async function PUT(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const {noteId, action} = await request.json()

        if (!noteId) {
            return NextResponse.json({error: "Missing noteId"}, {status: 400})
        }

        if (action === 'generate') {
            const shareToken = await NoteQueries.generateShareToken(verification.userId, noteId)
            if (shareToken) {
                return NextResponse.json({shareToken})
            } else {
                return NextResponse.json({error: "Failed to generate share token"}, {status: 500})
            }
        } else if (action === 'remove') {
            const success = await NoteQueries.removeShareToken(verification.userId, noteId)
            if (success) {
                return NextResponse.json({success: true})
            } else {
                return NextResponse.json({error: "Failed to remove share token"}, {status: 500})
            }
        } else {
            return NextResponse.json({error: "Invalid action"}, {status: 400})
        }
    } catch (error) {
        console.error("Error managing share token:", error)
        return NextResponse.json({error: "Failed to manage share token"}, {status: 500})
    }
}
