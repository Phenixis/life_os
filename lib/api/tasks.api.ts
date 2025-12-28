import { Task } from "@/lib/db/schema"
import { TaskFilters, TaskCountFilters } from "./query-keys"
import { fetchWithAuth } from "../fetcher"
import type { TaskCount } from "@/components/ui/calendar"

/**
 * Build query string from filters
 */
function buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            searchParams.append(key, value.toString())
        }
    })
    return searchParams.toString()
}

// ============= QUERIES =============

export const tasksApi = {
    /**
     * Fetch tasks list
     */
    getTasks: async (filters: TaskFilters, apiKey: string): Promise<Task.Task.TaskWithRelations[]> => {
        const queryString = buildQueryString({
            completed: filters.completed,
            orderBy: filters.orderBy,
            limit: filters.limit,
            orderingDirection: filters.orderingDirection,
            withProject: filters.withProject ? "true" : "false",
            projectIds: filters.projectIds?.join(","),
            excludedProjectIds: filters.excludedProjectIds?.join(","),
            dueBefore: filters.dueBefore,
            dueAfter: filters.dueAfter,
            state: filters.state,
        })

        return fetchWithAuth(`/api/task?${queryString}`, apiKey)
    },

    /**
     * Fetch single task by ID
     */
    getTask: async (id: number, apiKey: string): Promise<Task.Task.TaskWithRelations> => {
        return fetchWithAuth(`/api/task/${id}`, apiKey)
    },

    /**
     * Fetch task counts (for calendar/progress)
     */
    getTaskCounts: async (filters: TaskCountFilters, apiKey: string): Promise<TaskCount[]> => {
        const queryString = buildQueryString(filters)
        return fetchWithAuth(`/api/task/count?${queryString}`, apiKey)
    },

    /**
     * Search tasks
     */
    searchTasks: async (query: string, apiKey: string): Promise<Task.Task.TaskWithRelations[]> => {
        return fetchWithAuth(`/api/task/search?query=${encodeURIComponent(query)}`, apiKey)
    },

    // ============= MUTATIONS =============

    /**
     * Create a new task
     */
    createTask: async (data: TaskCreateInput, apiKey: string): Promise<{ id: number }> => {
        return fetchWithAuth('/api/task', apiKey, {
            method: 'POST',
            body: JSON.stringify(data),
        })
    },

    /**
     * Update a task
     */
    updateTask: async (id: number, data: TaskUpdateInput, apiKey: string): Promise<{ id: number }> => {
        return fetchWithAuth('/api/task', apiKey, {
            method: 'PUT',
            body: JSON.stringify({ id, ...data }),
        })
    },

    /**
     * Toggle task completion (PATCH for completion state)
     */
    toggleTask: async (id: number, completed: boolean, apiKey: string): Promise<{ id: number }> => {
        return fetchWithAuth('/api/task', apiKey, {
            method: 'PATCH',
            body: JSON.stringify({ id, completed }),
        })
    },

    /**
     * Delete a task
     */
    deleteTask: async (id: number, apiKey: string): Promise<{ id: number }> => {
        return fetchWithAuth(`/api/task?id=${id}`, apiKey, {
            method: 'DELETE',
        })
    },

    /**
     * Delete task dependency
     */
    deleteTaskDependency: async (id: number, apiKey: string): Promise<void> => {
        return fetchWithAuth(`/api/task/dependency?id=${id}`, apiKey, {
            method: 'DELETE',
        })
    },

    /**
     * Update task urgency
     */
    updateTaskUrgency: async (apiKey: string): Promise<void> => {
        return fetchWithAuth('/api/task/updateUrgency', apiKey, {
            method: 'POST',
        })
    },
}

// ============= TYPE DEFINITIONS =============

export interface TaskCreateInput {
    title: string
    importance: number
    dueDate: string
    duration: number
    project: {
        id: number
        title: string
    }
    toDoAfterId?: number
}

export interface TaskUpdateInput {
    title: string
    importance: number
    dueDate: string
    duration: number
    project: {
        id: number
        title: string
    }
    toDoAfterId?: number
    state?: string
}