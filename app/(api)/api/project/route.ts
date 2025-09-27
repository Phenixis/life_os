import {
    ProjectQueries
} from '@/lib/db/queries';
import type { Note } from '@/lib/db/schema';
import { type NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth/api';

// GET - Récupérer les projets
export async function GET(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    const searchParams = request.nextUrl.searchParams;
    const projectTitle = searchParams.get('projectTitle');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Number.parseInt(limitParam) : undefined;
    const completed = searchParams.get('completed');
    const taskCompleted = searchParams.get('taskCompleted') == "true";
    const taskDueDate = searchParams.get('taskDueDate') ? new Date(searchParams.get('taskDueDate') as string) : undefined;
    const taskDeleted = searchParams.get('taskDeleted') == "true";
    const withNotes = searchParams.get('withNotes') == "true";
    const noteLimit = searchParams.get('noteLimit') ? Number.parseInt(searchParams.get('noteLimit') as string) : undefined;
    const noteOrderBy = searchParams.get('noteOrderBy') as keyof Note.Note.Select | undefined;
    const noteOrderingDirection = searchParams.get('noteOrderingDirection') as "asc" | "desc" | undefined;
    const noteProjectTitle = searchParams.get('noteProjectTitle') || undefined;

    const projects = projectTitle ?
        await ProjectQueries.getProject(verification.userId, projectTitle) :
        withNotes ? await ProjectQueries.getProjectsWithNotes(
            verification.userId,
            limit,
            noteLimit,
            noteOrderBy,
            noteOrderingDirection,
            noteProjectTitle
        ) :
        completed == "true" ? await ProjectQueries.getCompletedProjects(verification.userId, limit, taskCompleted, taskDueDate, taskDeleted) :
            completed == "false" ? await ProjectQueries.getUncompletedProjects(verification.userId, limit, taskCompleted, taskDueDate, taskDeleted) :
                await ProjectQueries.getProjects(verification.userId, limit);

    return NextResponse.json(projects);
}

// POST - Créer un nouveau projet
export async function POST(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const body = await request.json();
        const { title, description } = body;

        // Validation
        if (!title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const projectId = await ProjectQueries.createProject(verification.userId, title, description);

        return NextResponse.json({ id: projectId }, { status: 201 });
    } catch (error) {
        console.error('Error creating project:', error);
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }
}