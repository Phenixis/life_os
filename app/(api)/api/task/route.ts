import { TaskQueries, ProjectQueries } from '@/lib/db/queries';
import type { Task } from '@/lib/db/schema';
import { type NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth/api';
import { isEmpty } from '@/lib/utils';

// GET - Récupérer les tasks
export async function GET(request: NextRequest) {
  const verification = await verifyRequest(request);
  if ('error' in verification) return verification.error;

  const searchParams = request.nextUrl.searchParams;
  const completedParam = searchParams.get('completed');
  const orderBy = searchParams.get('orderBy') as keyof Task.Task.Select | null;
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

    return NextResponse.json(tasks);
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
    const { title, importance, dueDate, duration, project, toDoAfterId } = body;

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
        projectId = await ProjectQueries.createProject(verification.userId, project.title);
      }
    }

    const toDoAfter = toDoAfterId && (await TaskQueries.Task.getTaskById(Number(toDoAfterId)));
    if (!toDoAfter && toDoAfterId != '-1') {
      return NextResponse.json({ error: 'Invalid toDoAfterId' }, { status: 400 });
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

    if (toDoAfterId && toDoAfterId != '-1') {
      await TaskQueries.Task.createTaskToDoAfter(taskId, Number(toDoAfterId));
    }

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
    const { id, title, importance, dueDate: initialDueDate, duration, project, toDoAfterId, state } = body;

    // Validation
    if (!id || !title || importance === undefined || initialDueDate === undefined || duration === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let dueDate = initialDueDate;

    let projectId = project.id >= 0 ? project.id : undefined;
    if (projectId === undefined) {
      const foundProject = await ProjectQueries.getProjectByTitle(verification.userId, project.title);
      if (foundProject) {
        projectId = foundProject.id;
      } else {
        projectId = await ProjectQueries.createProject(verification.userId, project.title);
      }
    }

    // Validate toDoAfterId if provided
    if (toDoAfterId !== undefined) {
      // Check if the referenced task exists
      if (toDoAfterId !== -1) {
        const toDoAfter = await TaskQueries.Task.getTaskById(Number(toDoAfterId));
        if (!toDoAfter) {
          return NextResponse.json({ error: 'Invalid toDoAfterId' }, { status: 400 });
        }
        if (new Date(toDoAfter.due) > new Date(dueDate)) {
          dueDate = toDoAfter.due;
        }

        // Get existing toDoAfter relations for this task
        const existingRelations = await TaskQueries.Task.getTasksToDoAfter(Number(id));

        const filteredRelations = existingRelations.filter(relation => relation.deleted_at === null);

        // Create new relation if there isn't already one, toDoAfterId is provided and not -1
        if (filteredRelations.length === 0 && toDoAfterId) {
          await TaskQueries.Task.createTaskToDoAfter(Number(id), Number(toDoAfterId));
        } else {
          filteredRelations.map(async relation => {
            const task = await TaskQueries.Task.getTaskById(relation.after_task_id);
            if (task) {
              await TaskQueries.Task.updateTask(task.id, {
                user_id: verification.userId,
                title: task.title,
                importance: task.importance,
                due: new Date(task.due) < new Date(dueDate) ? new Date(dueDate) : new Date(task.due),
                duration: task.duration,
                project_id: task.project_id || undefined
              });
            }
          });
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

    if (task) {
      // Si le task a une relation toDoAfter, on la supprime
      const existingToDoAfterRelations = await TaskQueries.Task.getTasksToDoAfter(
        typeof taskId === 'number' ? taskId : taskId.done_task_id
      );

      const filteredToDoAfterRelations = existingToDoAfterRelations.filter(relation => relation.deleted_at === null);

      if (filteredToDoAfterRelations.length > 0) {
        for (const relation of filteredToDoAfterRelations) {
          await TaskQueries.Task.deleteTaskToDoAfterById(relation.id);
        }
      }

      const existingToDoBeforeRelations = await TaskQueries.Task.getTasksToDoBefore(
        typeof taskId === 'number' ? taskId : taskId.done_task_id
      );

      const filteredToDoBeforeRelations = existingToDoBeforeRelations.filter(relation => relation.deleted_at === null);

      if (filteredToDoBeforeRelations.length > 0) {
        for (const relation of filteredToDoBeforeRelations) {
          await TaskQueries.Task.deleteTaskToDoAfterById(relation.id);
        }
      }
    }

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

    // Delete any task dependency relationships
    // 1. Where this task depends on another task
    await TaskQueries.Task.deleteTaskToDoAfterByTodoId(id);
    // 2. Where other tasks depend on this task
    await TaskQueries.Task.deleteTaskToDoAfterByAfterId(id);

    const taskId = await TaskQueries.Task.deleteTaskById(verification.userId, id);

    return NextResponse.json({ id: taskId });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
