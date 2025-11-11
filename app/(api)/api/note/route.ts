import {NextRequest, NextResponse} from "next/server"
import {verifyRequest} from "@/lib/auth/api"
import {NoteQueries, ProjectQueries} from "@/lib/db/queries"
import {isEmpty} from "@/lib/utils";

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
        const result = await NoteQueries.getNotes(verification.userId, title, projectTitle, limit, page, projectTitles, excludedProjectTitles)
        return NextResponse.json(result)
    } catch (error) {
        console.error("Error fetching notes:", error)
        return NextResponse.json({error: "Failed to fetch notes"}, {status: 500})
    }
}

export async function POST(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error
    try {

        const {noteData, project} = await request.json()

        if (isEmpty(noteData.title) || isEmpty(noteData.content)) {
            return NextResponse.json({error: "Missing required fields"}, {status: 400})
        }

        let projectId = project.id > 0 ? project.id : undefined
        if (projectId === undefined && project.title && project.title.trim() !== "") {
            const foundProject = await ProjectQueries.getProjectByTitle(verification.userId, project.title)
            if (foundProject) {
                projectId = foundProject.id
            } else {
                projectId = await ProjectQueries.createProject(verification.userId, project.title)
            }
        }

        const note = await NoteQueries.createNote(verification.userId, noteData.title, noteData.content, projectId, noteData.salt, noteData.iv)
        return NextResponse.json(note)
    } catch (error) {
        console.error("Error creating note:", error)
        return NextResponse.json({error: "Failed to create note"}, {status: 500})
    }
}

export async function PUT(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const {noteData, project} = await request.json()

        if (isEmpty(noteData.id) || isEmpty(noteData.title) || isEmpty(noteData.content)) {
            return NextResponse.json({error: "Missing required fields"}, {status: 400})
        }

        // Determine the project title to pass
        let projectTitle: string | undefined = undefined
        if (project.id > 0) {
            // If we have a valid project ID, get its title
            try {
                const existingProject = await ProjectQueries.getProjectById(verification.userId, project.id)
                projectTitle = existingProject?.title || undefined
            } catch (error) {
                console.error("Project not found with id:", project.id)
                projectTitle = undefined
            }
        } else if (project.title && project.title.trim() !== "") {
            // If we have a project title, use it (will be created if needed in updateNote)
            projectTitle = project.title.trim()
        }

        const note = await NoteQueries.updateNote(verification.userId, noteData.id, noteData.title, noteData.content, projectTitle, noteData.salt, noteData.iv)
        return NextResponse.json(note)
    } catch (error) {
        console.error("Error updating note:", error)
        return NextResponse.json({error: "Failed to update note"}, {status: 500})
    }
}

export async function DELETE(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    const {id} = await request.json()

    try {
        const note = await NoteQueries.deleteNote(verification.userId, id)
        return NextResponse.json(note)
    } catch (error) {
        console.error("Error deleting note:", error)
        return NextResponse.json({error: "Failed to delete note"}, {status: 500})
    }
}