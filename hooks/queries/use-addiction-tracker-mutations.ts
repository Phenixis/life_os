"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useUser } from "../use-user"
import { addictionApi, entryApi, relapseApi } from "@/lib/api/addiction-tracker.api"
import {
    addictionTrackerKeys,
    AddictionCreateInput,
    AddictionUpdateInput,
    AddictionWithStats,
    Entry,
    EntryCreateInput,
    EntryUpdateInput,
    RelapseCreateInput,
} from "@/lib/api/addiction-tracker-keys"
import { toast } from "sonner"

// ============= ADDICTION MUTATIONS =============

/**
 * Hook to create a new addiction
 */
export function useCreateAddiction() {
    const { user } = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ["createAddiction"],
        mutationFn: (data: AddictionCreateInput) =>
            addictionApi.createAddiction(data, user?.api_key || ""),

        onMutate: async (newAddiction) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: addictionTrackerKeys.addictionsList() })

            // Snapshot previous value
            const previousAddictions = queryClient.getQueryData<AddictionWithStats[]>(
                addictionTrackerKeys.addictionsList()
            )

            // Optimistically add the new addiction
            const optimisticAddiction: AddictionWithStats = {
                id: -Date.now(), // Temporary negative ID
                user_id: user?.id || "",
                title: newAddiction.title,
                description: newAddiction.description || null,
                created_at: new Date(),
                updated_at: new Date(),
                deleted_at: null,
                last_relapse_at: new Date(),
                relapse_count: 1, // Initial relapse is created automatically
            }

            queryClient.setQueryData<AddictionWithStats[]>(
                addictionTrackerKeys.addictionsList(),
                (old) => [optimisticAddiction, ...(old ?? [])]
            )

            return { previousAddictions, optimisticId: optimisticAddiction.id }
        },

        onError: (error, _, context) => {
            // Rollback on error
            if (context?.previousAddictions) {
                queryClient.setQueryData(
                    addictionTrackerKeys.addictionsList(),
                    context.previousAddictions
                )
            }
            toast.error(`Failed to create addiction: ${error.message}`)
        },

        onSuccess: (createdAddiction, _, context) => {
            // Replace optimistic addiction with real one
            queryClient.setQueryData<AddictionWithStats[]>(
                addictionTrackerKeys.addictionsList(),
                (old) =>
                    old?.map((addiction) =>
                        addiction.id === context?.optimisticId ? createdAddiction : addiction
                    ) ?? []
            )
            toast.success("Addiction created successfully")
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: addictionTrackerKeys.addictionsList() })
        },
    })
}

/**
 * Hook to update an addiction
 */
export function useUpdateAddiction() {
    const { user } = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ["updateAddiction"],
        mutationFn: ({ id, data }: { id: number; data: AddictionUpdateInput }) =>
            addictionApi.updateAddiction(id, data, user?.api_key || ""),

        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: addictionTrackerKeys.addictionsList() })
            await queryClient.cancelQueries({ queryKey: addictionTrackerKeys.addictionDetail(id) })

            const previousAddictions = queryClient.getQueryData<AddictionWithStats[]>(
                addictionTrackerKeys.addictionsList()
            )
            const previousAddiction = queryClient.getQueryData<AddictionWithStats>(
                addictionTrackerKeys.addictionDetail(id)
            )

            // Optimistically update in list
            queryClient.setQueryData<AddictionWithStats[]>(
                addictionTrackerKeys.addictionsList(),
                (old) =>
                    old?.map((addiction) =>
                        addiction.id === id
                            ? { ...addiction, ...data, updated_at: new Date() }
                            : addiction
                    ) ?? []
            )

            // Optimistically update detail
            queryClient.setQueryData<AddictionWithStats>(
                addictionTrackerKeys.addictionDetail(id),
                (old) => (old ? { ...old, ...data, updated_at: new Date() } : old)
            )

            return { previousAddictions, previousAddiction }
        },

        onError: (error, { id }, context) => {
            if (context?.previousAddictions) {
                queryClient.setQueryData(
                    addictionTrackerKeys.addictionsList(),
                    context.previousAddictions
                )
            }
            if (context?.previousAddiction) {
                queryClient.setQueryData(
                    addictionTrackerKeys.addictionDetail(id),
                    context.previousAddiction
                )
            }
            toast.error(`Failed to update addiction: ${error.message}`)
        },

        onSuccess: () => {
            toast.success("Addiction updated successfully")
        },

        onSettled: (_, __, { id }) => {
            queryClient.invalidateQueries({ queryKey: addictionTrackerKeys.addictionsList() })
            queryClient.invalidateQueries({ queryKey: addictionTrackerKeys.addictionDetail(id) })
        },
    })
}

/**
 * Hook to delete an addiction
 */
export function useDeleteAddiction() {
    const { user } = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ["deleteAddiction"],
        mutationFn: (id: number) => addictionApi.deleteAddiction(id, user?.api_key || ""),

        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: addictionTrackerKeys.addictionsList() })

            const previousAddictions = queryClient.getQueryData<AddictionWithStats[]>(
                addictionTrackerKeys.addictionsList()
            )

            // Optimistically remove from list
            queryClient.setQueryData<AddictionWithStats[]>(
                addictionTrackerKeys.addictionsList(),
                (old) => old?.filter((addiction) => addiction.id !== id) ?? []
            )

            return { previousAddictions }
        },

        onError: (error, _, context) => {
            if (context?.previousAddictions) {
                queryClient.setQueryData(
                    addictionTrackerKeys.addictionsList(),
                    context.previousAddictions
                )
            }
            toast.error(`Failed to delete addiction: ${error.message}`)
        },

        onSuccess: () => {
            toast.success("Addiction deleted successfully")
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: addictionTrackerKeys.addictionsList() })
        },
    })
}

// ============= ENTRY MUTATIONS =============

/**
 * Hook to create a new entry
 */
export function useCreateEntry() {
    const { user } = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ["createEntry"],
        mutationFn: (data: EntryCreateInput) =>
            entryApi.createEntry(data, user?.api_key || ""),

        onMutate: async (newEntry) => {
            await queryClient.cancelQueries({
                queryKey: addictionTrackerKeys.entriesList(newEntry.addictionId),
            })

            const previousEntries = queryClient.getQueryData<Entry[]>(
                addictionTrackerKeys.entriesList(newEntry.addictionId)
            )

            // Optimistically add the new entry
            const optimisticEntry: Entry = {
                id: -Date.now(),
                user_id: user?.id || "",
                addiction_id: newEntry.addictionId,
                content: newEntry.content,
                relapse_id: null,
                created_at: new Date(),
                updated_at: new Date(),
                deleted_at: null,
            }

            queryClient.setQueryData<Entry[]>(
                addictionTrackerKeys.entriesList(newEntry.addictionId),
                (old) => [optimisticEntry, ...(old ?? [])]
            )

            return { previousEntries, addictionId: newEntry.addictionId, optimisticId: optimisticEntry.id }
        },

        onError: (error, _, context) => {
            if (context?.previousEntries && context?.addictionId) {
                queryClient.setQueryData(
                    addictionTrackerKeys.entriesList(context.addictionId),
                    context.previousEntries
                )
            }
            toast.error(`Failed to create entry: ${error.message}`)
        },

        onSuccess: (createdEntry, newEntry, context) => {
            queryClient.setQueryData<Entry[]>(
                addictionTrackerKeys.entriesList(newEntry.addictionId),
                (old) =>
                    old?.map((entry) =>
                        entry.id === context?.optimisticId ? createdEntry : entry
                    ) ?? []
            )
            toast.success("Entry created successfully")
        },

        onSettled: (_, __, { addictionId }) => {
            queryClient.invalidateQueries({
                queryKey: addictionTrackerKeys.entriesList(addictionId),
            })
        },
    })
}

/**
 * Hook to update an entry
 */
export function useUpdateEntry() {
    const { user } = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ["updateEntry"],
        mutationFn: ({ id, addictionId, data }: { id: number; addictionId: number; data: EntryUpdateInput }) =>
            entryApi.updateEntry(id, data, user?.api_key || ""),

        onMutate: async ({ id, addictionId, data }) => {
            await queryClient.cancelQueries({
                queryKey: addictionTrackerKeys.entriesList(addictionId),
            })

            const previousEntries = queryClient.getQueryData<Entry[]>(
                addictionTrackerKeys.entriesList(addictionId)
            )

            queryClient.setQueryData<Entry[]>(
                addictionTrackerKeys.entriesList(addictionId),
                (old) =>
                    old?.map((entry) =>
                        entry.id === id
                            ? { ...entry, ...data, updated_at: new Date() }
                            : entry
                    ) ?? []
            )

            return { previousEntries, addictionId }
        },

        onError: (error, _, context) => {
            if (context?.previousEntries && context?.addictionId) {
                queryClient.setQueryData(
                    addictionTrackerKeys.entriesList(context.addictionId),
                    context.previousEntries
                )
            }
            toast.error(`Failed to update entry: ${error.message}`)
        },

        onSuccess: () => {
            toast.success("Entry updated successfully")
        },

        onSettled: (_, __, { addictionId }) => {
            queryClient.invalidateQueries({
                queryKey: addictionTrackerKeys.entriesList(addictionId),
            })
        },
    })
}

/**
 * Hook to delete an entry
 */
export function useDeleteEntry() {
    const { user } = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ["deleteEntry"],
        mutationFn: ({ id }: { id: number; addictionId: number }) =>
            entryApi.deleteEntry(id, user?.api_key || ""),

        onMutate: async ({ id, addictionId }) => {
            await queryClient.cancelQueries({
                queryKey: addictionTrackerKeys.entriesList(addictionId),
            })

            const previousEntries = queryClient.getQueryData<Entry[]>(
                addictionTrackerKeys.entriesList(addictionId)
            )

            queryClient.setQueryData<Entry[]>(
                addictionTrackerKeys.entriesList(addictionId),
                (old) => old?.filter((entry) => entry.id !== id) ?? []
            )

            return { previousEntries, addictionId }
        },

        onError: (error, _, context) => {
            if (context?.previousEntries && context?.addictionId) {
                queryClient.setQueryData(
                    addictionTrackerKeys.entriesList(context.addictionId),
                    context.previousEntries
                )
            }
            toast.error(`Failed to delete entry: ${error.message}`)
        },

        onSuccess: () => {
            toast.success("Entry deleted successfully")
        },

        onSettled: (_, __, { addictionId }) => {
            queryClient.invalidateQueries({
                queryKey: addictionTrackerKeys.entriesList(addictionId),
            })
        },
    })
}

// ============= RELAPSE MUTATIONS =============

/**
 * Hook to record a relapse
 */
export function useCreateRelapse() {
    const { user } = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ["createRelapse"],
        mutationFn: (data: RelapseCreateInput) =>
            relapseApi.createRelapse(data, user?.api_key || ""),

        onSuccess: (_, { addictionId }) => {
            toast.success("Relapse recorded")
            // Invalidate related queries to refresh data
            queryClient.invalidateQueries({
                queryKey: addictionTrackerKeys.relapsesList(addictionId),
            })
            queryClient.invalidateQueries({
                queryKey: addictionTrackerKeys.entriesList(addictionId),
            })
            queryClient.invalidateQueries({
                queryKey: addictionTrackerKeys.addictionsList(),
            })
            queryClient.invalidateQueries({
                queryKey: addictionTrackerKeys.addictionDetail(addictionId),
            })
        },

        onError: (error) => {
            toast.error(`Failed to record relapse: ${error.message}`)
        },
    })
}
