import { TaskQueries, ProjectQueries } from '@/lib/db/queries';
import type { Task } from '@/lib/db/schema';
import { type NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth/api';
import { isEmpty } from '@/lib/utils';
import { cachedJsonResponse } from '@/lib/api/cached-response';

// GET - Récupérer les tasks
export async function GET(request: NextRequest) {
  const verification = await verifyRequest(request);
  if ('error' in verification) return verification.error;

  const searchParams = request.nextUrl.searchParams;
  const completedParam = searchParams.get('completed');
  const orderByParam = searchParams.get('orderBy');
  const orderBy = orderByParam && orderByParam in ({} as Task.Task.Select)
    ? orderByParam as keyof Task.Task.Select
    : null;
  const limitParam = searchParams.get('limit');
  const orderingDirection = searchParams.get('orderingDirection') as 'asc' | 'desc' | undefined;
  const projectIds = searchParams.get('projectIds')
    ? searchParams.get('projectIds')?.split(',').map(Number)
    : undefined;
  const excludedProjectIds = searchParams.get('excludedProjectIds')
    ? searchParams.get('excludedProjectIds')?.split(',').map(Number)
    : undefined;
  const dueBefore = searchParams.get('dueBefore') ? new Date(searchParams.get('dueBefore') as string) : undefined;
  const dueAfter = searchParams.get('dueAfter') ? new Date(searchParams.get('dueAfter') as string) : undefined;
  const state = searchParams.get('state') || undefined;
  const limit = limitParam ? Number.parseInt(limitParam) : -1;
  const completed: boolean | undefined =
    completedParam === 'true' ? true : completedParam === 'false' ? false : undefined;

  try {
    const tasks =
      completed === true
        ? await TaskQueries.Task.getCompletedTasks(
          verification.userId,
          orderBy || undefined,
          orderingDirection,
          limit,
          projectIds,
          excludedProjectIds,
          dueBefore,
          dueAfter
        )
        : completed === false
          ? await TaskQueries.Task.getUncompletedTasks(
            verification.userId,
            orderBy || undefined,
            orderingDirection,
            limit,
            projectIds,
            excludedProjectIds,
            dueBefore,
            dueAfter
          )
          : await TaskQueries.Task.getTasks(
            verification.userId,
            orderBy || undefined,
            orderingDirection,
            limit,
            projectIds,
            excludedProjectIds,
            dueBefore,
            dueAfter,
            completed,
            undefined,
            undefined,
            state
          );

    return cachedJsonResponse(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST - Créer un nouveau task
export async function POST(request: NextRequest) {
  const verification = await verifyRequest(request);
  if ('error' in verification) return verification.error;

  try {
    const body = await request.json();
    const { title, importance, dueDate, duration, project } = body;

    // Validation
    if (isEmpty(title) || isEmpty(dueDate) || isEmpty(duration) || isEmpty(importance)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let projectId = project.id >= 0 ? project.id : undefined;
    if (projectId === undefined && project.title != '') {
      const foundProject = await ProjectQueries.getProjectByTitle(verification.userId, project.title);
      if (foundProject) {
        projectId = foundProject.id;
      } else {
        try {
          projectId = await ProjectQueries.createProject(verification.userId, project.title)
        } catch (error) {
          console.error("Error creating project while creating note:", error)
        }
      }
    }

    const dueDateAtMidnight = new Date(dueDate);

    const taskId = await TaskQueries.Task.createTask({
      title: title,
      importance: Number(importance),
      due: dueDateAtMidnight,
      duration: Number(duration),
      project_id: projectId,
      user_id: verification.userId
    } as Task.Task.Insert);

    return NextResponse.json({ id: taskId }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

// PUT - Mettre à jour un task existant
export async function PUT(request: NextRequest) {
  const verification = await verifyRequest(request);
  if ('error' in verification) return verification.error;

  try {
    const body = await request.json();
    const { id, title, importance, dueDate: initialDueDate, duration, project, state } = body;

    // Validation
    if (!id || !title || importance === undefined || initialDueDate === undefined || duration === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let dueDate = initialDueDate;

    let projectId = project.id >= 0 ? project.id : undefined;
    if (projectId === undefined && project.title != '') {
      const foundProject = await ProjectQueries.getProjectByTitle(verification.userId, project.title);
      if (foundProject) {
        projectId = foundProject.id;
      } else {
        try {
          projectId = await ProjectQueries.createProject(verification.userId, project.title)
        } catch (error) {
          console.error("Error creating project while creating note:", error)
        }
      }
    }

    const updateData: Partial<Task.Task.Insert> = {
      user_id: verification.userId,
      title: title,
      importance: Number(importance),
      due: new Date(dueDate),
      duration: Number(duration),
      project_id: projectId
    };

    if (state !== undefined) {
      updateData.state = state;
    }

    const taskId = await TaskQueries.Task.updateTask(Number(id), updateData);

    return NextResponse.json({ id: taskId });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// PATCH - Marquer un task comme terminé/non terminé
export async function PATCH(request: NextRequest) {
  const verification = await verifyRequest(request);
  if ('error' in verification) return verification.error;

  try {
    const body = await request.json();
    const { id, completed } = body;

    // Validation
    if (!id || completed === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let taskId: number | { done_task_id: number; new_task_id?: number };
    if (completed === true) {
      taskId = await TaskQueries.Task.markTaskAsDone(verification.userId, Number(id));
    } else if (completed === false) {
      taskId = await TaskQueries.Task.markTaskAsUndone(verification.userId, Number(id));
    } else {
      taskId = await TaskQueries.Task.toggleTask(verification.userId, Number(id), completed);
    }

    const task = await TaskQueries.Task.getTaskById(typeof taskId === 'number' ? taskId : taskId.done_task_id);

    return NextResponse.json({ id: typeof taskId === 'number' ? taskId : taskId.done_task_id });
  } catch (error) {
    console.error('Error toggling task completion:', error);
    return NextResponse.json({ error: 'Failed to update task status' }, { status: 500 });
  }
}

// DELETE - Supprimer un task
export async function DELETE(request: NextRequest) {
  const verification = await verifyRequest(request);
  if ('error' in verification) return verification.error;

  try {
    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');

    if (!idParam) {
      return NextResponse.json({ error: 'Missing task ID' }, { status: 400 });
    }

    const id = Number(idParam);

    const taskId = await TaskQueries.Task.deleteTaskById(verification.userId, id);

    return NextResponse.json({ id: taskId });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
