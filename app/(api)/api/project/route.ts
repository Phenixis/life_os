import {ProjectQueries} from '@/lib/db/queries';
import {type NextRequest, NextResponse} from 'next/server';
import {verifyRequest} from '@/lib/auth/api';

// GET - Récupérer les projets
export async function GET(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    const searchParams = request.nextUrl.searchParams;
    const projectIdParam = searchParams.get('projectId');
    const projectId = projectIdParam ? Number.parseInt(projectIdParam) : undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Number.parseInt(limitParam) : undefined;
    const includeNoProject = searchParams.get('includeNoProject') !== "false"; // Default true

    const projects = projectId
        ? await ProjectQueries.getProjectById(verification.userId, projectId)
        : await ProjectQueries.getProjects(verification.userId, { limit, includeNoProject });

    return NextResponse.json(projects);
}

// POST - Créer un nouveau projet
export async function POST(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    try {
        const body = await request.json();
        const {title, description} = body;

        // Validation
        if (!title) {
            return NextResponse.json({error: 'Missing required fields'}, {status: 400});
        }

        const projectId = await ProjectQueries.createProject(verification.userId, title, description);

        return NextResponse.json({id: projectId}, {status: 201});
    } catch (error) {
        console.error('Error creating project:', error);
        return NextResponse.json({error: 'Failed to create project'}, {status: 500});
    }
}