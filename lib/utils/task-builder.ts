import type { TaskCreateInput, TaskUpdateInput } from "@/lib/api/tasks.api"

/**
 * Build an optimistic task object for immediate UI updates
 * Uses a temporary negative ID that will be replaced by the server response
 */
export function buildOptimisticTask(input: TaskCreateInput, userId: string) {
    return {
        id: -Date.now(), // Temporary negative ID
        title: input.title,
        importance: input.importance,
        due: input.dueDate,
        duration: input.duration,
        project_id: input.project.id >= 0 ? input.project.id : null,
        project:
            input.project.id >= 0
                ? { id: input.project.id, title: input.project.title }
                : null,
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: userId,
        recursive: true,
        tasksToDoAfter: [],
        tasksToDoBefore: [],
        // Minimal details - server will provide full details on refetch
        importanceDetails: {
            id: input.importance,
            name: "",
            color: "",
            description: "",
            user_id: userId,
        },
        durationDetails: {
            id: input.duration,
            name: "",
            minutes: 0,
            user_id: userId,
        },
    }
}

/**
 * Build task update object from input
 */
export function buildTaskUpdate(input: TaskUpdateInput, existingTask: any) {
    return {
        ...existingTask,
        title: input.title,
        importance: input.importance,
        due: input.dueDate,
        duration: input.duration,
        project_id: input.project.id >= 0 ? input.project.id : null,
        project:
            input.project.id >= 0
                ? { id: input.project.id, title: input.project.title }
                : null,
        updated_at: new Date().toISOString(),
    }
}

/**
 * Update task counts optimistically
 */
export function updateCountsForNewTask(counts: any[], dueDate: string) {
    return counts.map((count) => {
        const taskDate = new Date(dueDate)
        const countDate = new Date(count.due)
        if (taskDate.toDateString() === countDate.toDateString()) {
            return {
                ...count,
                uncompleted_count: Number(count.uncompleted_count) + 1,
            }
        }
        return count
    })
}

/**
 * Update task counts when toggling completion
 */
export function updateCountsForToggle(counts: any[], completed: boolean) {
    return counts.map((count) => ({
        ...count,
        completed_count: completed
            ? Number(count.completed_count) + 1
            : Number(count.completed_count) - 1,
        uncompleted_count: completed
            ? Number(count.uncompleted_count) - 1
            : Number(count.uncompleted_count) + 1,
    }))
}
