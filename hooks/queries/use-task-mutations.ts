"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useUser } from "../use-user"
import { tasksApi, TaskCreateInput, TaskUpdateInput } from "@/lib/api/tasks.api"
import { taskKeys } from "@/lib/api/query-keys"
import { toast } from "sonner"
import {
    snapshotQueries,
    restoreQueries,
    addTaskToLists,
    updateTaskInLists,
    removeTaskFromLists,
    updateTasksInLists,
} from "@/lib/utils/query-cache-helpers"
import {
    buildOptimisticTask,
    buildTaskUpdate,
    updateCountsForNewTask,
    updateCountsForToggle,
} from "@/lib/utils/task-builder"

/**
 * Hook to create a new task
 */
export function useCreateTask() {
    const { user } = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ["createTask"],
        mutationFn: (data: TaskCreateInput) =>
            tasksApi.createTask(data, user?.api_key || ""),

        onMutate: async (newTask) => {
            // Snapshot current state
            const snapshots = await snapshotQueries(queryClient, [
                taskKeys.lists(),
                taskKeys.counts(),
            ])

            // Build and add optimistic task
            const optimisticTask = buildOptimisticTask(newTask, user?.id || "")
            addTaskToLists(queryClient, taskKeys.lists(), optimisticTask)

            // Update counts
            updateTasksInLists(queryClient, taskKeys.counts(), (counts) =>
                updateCountsForNewTask(counts, newTask.dueDate)
            )

            return { snapshots, optimisticTask }
        },

        onError: (error, _, context) => {
            if (context?.snapshots) {
                restoreQueries(queryClient, context.snapshots)
            }
            toast.error(`Failed to create task: ${error.message}`)
        },

        onSuccess: (response, _, context) => {
            // Replace temp ID with real ID from server
            if (context?.optimisticTask) {
                updateTaskInLists(
                    queryClient,
                    taskKeys.lists(),
                    context.optimisticTask.id,
                    (task) => ({ ...task, id: response.id })
                )
            }
            toast.success("Task created successfully")
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
            queryClient.invalidateQueries({ queryKey: taskKeys.counts() })
        },
    })
}

/**
 * Hook to update a task
 */
export function useUpdateTask() {
    const { user } = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ["updateTask"],
        mutationFn: ({ id, data }: { id: number; data: TaskUpdateInput }) =>
            tasksApi.updateTask(id, data, user?.api_key || ""),

        onMutate: async ({ id, data }) => {
            // Snapshot current state
            const snapshots = await snapshotQueries(queryClient, [
                taskKeys.lists(),
                taskKeys.detail(id),
            ])

            // Optimistically update task in lists and detail
            updateTaskInLists(queryClient, taskKeys.lists(), id, (task) =>
                buildTaskUpdate(data, task)
            )

            queryClient.setQueryData(taskKeys.detail(id), (old: any) => {
                if (!old) return old
                return buildTaskUpdate(data, old)
            })

            return { snapshots }
        },

        onError: (error, _, context) => {
            if (context?.snapshots) {
                restoreQueries(queryClient, context.snapshots)
            }
            toast.error(`Failed to update task: ${error.message}`)
        },

        onSuccess: () => {
            toast.success("Task updated successfully")
        },

        onSettled: (_, __, { id }) => {
            queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) })
            queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
            queryClient.invalidateQueries({ queryKey: taskKeys.counts() })
        },
    })
}

/**
 * Hook to toggle task completion with optimistic updates
 */
export function useToggleTask() {
    const { user } = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ["toggleTask"],
        mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
            tasksApi.toggleTask(id, completed, user?.api_key || ""),

        onMutate: async ({ id, completed }) => {
            // Snapshot current state
            const snapshots = await snapshotQueries(queryClient, [
                taskKeys.lists(),
                taskKeys.counts(),
            ])

            // Remove task from current list (it will move to completed/uncompleted)
            removeTaskFromLists(queryClient, taskKeys.lists(), id)

            // Update counts
            updateTasksInLists(queryClient, taskKeys.counts(), (counts) =>
                updateCountsForToggle(counts, completed)
            )

            return { snapshots }
        },

        onError: (error, _, context) => {
            if (context?.snapshots) {
                restoreQueries(queryClient, context.snapshots)
            }
            toast.error(`Failed to toggle task: ${error.message}`)
        },

        onSuccess: (_, { completed }) => {
            toast.success(
                completed ? "Task completed! 🎉" : "Task marked as incomplete"
            )
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
            queryClient.invalidateQueries({ queryKey: taskKeys.counts() })
        },
    })
}

/**
 * Hook to delete a task
 */
export function useDeleteTask() {
    const { user } = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ["deleteTask"],
        mutationFn: (id: number) =>
            tasksApi.deleteTask(id, user?.api_key || ""),

        onMutate: async (id) => {
            // Snapshot current state
            const snapshots = await snapshotQueries(queryClient, [
                taskKeys.lists(),
            ])

            // Optimistically remove task
            removeTaskFromLists(queryClient, taskKeys.lists(), id)

            return { snapshots }
        },

        onError: (error, _, context) => {
            if (context?.snapshots) {
                restoreQueries(queryClient, context.snapshots)
            }
            toast.error(`Failed to delete task: ${error.message}`)
        },

        onSuccess: () => {
            toast.success("Task deleted")
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
            queryClient.invalidateQueries({ queryKey: taskKeys.counts() })
        },
    })
}