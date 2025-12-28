/**
 * Query keys factory for tasks
 * Provides type-safe, hierarchical query keys following React Query best practices
 */
export const taskKeys = {
    all: ['tasks'] as const,
    lists: () => [...taskKeys.all, 'list'] as const,
    list: (filters: TaskFilters) => [...taskKeys.lists(), filters] as const,
    details: () => [...taskKeys.all, 'detail'] as const,
    detail: (id: number) => [...taskKeys.details(), id] as const,
    counts: () => [...taskKeys.all, 'counts'] as const,
    count: (filters: TaskCountFilters) => [...taskKeys.counts(), filters] as const,
    search: (query: string) => [...taskKeys.all, 'search', query] as const,
}

// Type definitions for filters
export interface TaskFilters {
    completed?: boolean
    orderBy?: string
    limit?: number
    orderingDirection?: 'asc' | 'desc'
    withProject?: boolean
    projectIds?: number[]
    excludedProjectIds?: number[]
    dueBefore?: string
    dueAfter?: string
    state?: string
}

export interface TaskCountFilters {
    projectTitles?: string
    excludedProjectTitles?: string
    dueAfter?: string
    dueBefore?: string
}