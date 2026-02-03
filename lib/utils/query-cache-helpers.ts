import type { QueryClient, QueryKey } from "@tanstack/react-query"

/**
 * Snapshot queries before optimistic update
 * Cancels ongoing queries and returns their current data
 */
export async function snapshotQueries(
    queryClient: QueryClient,
    queryKeys: QueryKey[]
): Promise<[QueryKey, unknown][][]> {
    const snapshots = await Promise.all(
        queryKeys.map(async (queryKey) => {
            await queryClient.cancelQueries({ queryKey })
            return queryClient.getQueriesData({ queryKey })
        })
    )
    return snapshots
}

/**
 * Restore queries from snapshots after error
 */
export function restoreQueries(
    queryClient: QueryClient,
    snapshots: [QueryKey, unknown][][]
) {
    snapshots.flat().forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
    })
}

/**
 * Update tasks in all list queries
 */
export function updateTasksInLists(
    queryClient: QueryClient,
    listsQueryKey: QueryKey,
    updater: (tasks: any[]) => any[]
) {
    queryClient.setQueriesData({ queryKey: listsQueryKey }, (old: any) => {
        if (!Array.isArray(old)) return old
        return updater(old)
    })
}

/**
 * Update a single task in all list queries
 */
export function updateTaskInLists(
    queryClient: QueryClient,
    listsQueryKey: QueryKey,
    taskId: number,
    updater: (task: any) => any
) {
    updateTasksInLists(queryClient, listsQueryKey, (tasks) =>
        tasks.map((task) => (task.id === taskId ? updater(task) : task))
    )
}

/**
 * Remove task from all list queries
 */
export function removeTaskFromLists(
    queryClient: QueryClient,
    listsQueryKey: QueryKey,
    taskId: number
) {
    updateTasksInLists(queryClient, listsQueryKey, (tasks) =>
        tasks.filter((task) => task.id !== taskId)
    )
}

/**
 * Add task to all list queries
 */
export function addTaskToLists(
    queryClient: QueryClient,
    listsQueryKey: QueryKey,
    task: any,
    position: "start" | "end" = "start"
) {
    updateTasksInLists(queryClient, listsQueryKey, (tasks) =>
        position === "start" ? [task, ...tasks] : [...tasks, task]
    )
}
