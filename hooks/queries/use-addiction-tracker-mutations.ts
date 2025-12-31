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
    RelapseUpdateInput,
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
            const previousInfiniteEntries = queryClient.getQueryData(
                [...addictionTrackerKeys.entriesList(newEntry.addictionId), 'infinite']
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

            // Update regular query
            queryClient.setQueryData<Entry[]>(
                addictionTrackerKeys.entriesList(newEntry.addictionId),
                (old) => [optimisticEntry, ...(old ?? [])]
            )

            // Update infinite query
            queryClient.setQueryData(
                [...addictionTrackerKeys.entriesList(newEntry.addictionId), 'infinite'],
                (old: any) => {
                    if (!old) return old
                    return {
                        ...old,
                        pages: old.pages.map((page: any, index: number) =>
                            index === 0
                                ? { ...page, entries: [optimisticEntry, ...page.entries] }
                                : page
                        ),
                    }
                }
            )

            return { previousEntries, previousInfiniteEntries, addictionId: newEntry.addictionId, optimisticId: optimisticEntry.id }
        },

        onError: (error, _, context) => {
            if (context?.previousEntries && context?.addictionId) {
                queryClient.setQueryData(
                    addictionTrackerKeys.entriesList(context.addictionId),
                    context.previousEntries
                )
            }
            if (context?.previousInfiniteEntries && context?.addictionId) {
                queryClient.setQueryData(
                    [...addictionTrackerKeys.entriesList(context.addictionId), 'infinite'],
                    context.previousInfiniteEntries
                )
            }
            toast.error(`Failed to create entry: ${error.message}`)
        },

        onSuccess: (createdEntry, newEntry, context) => {
            // Update regular query
            queryClient.setQueryData<Entry[]>(
                addictionTrackerKeys.entriesList(newEntry.addictionId),
                (old) =>
                    old?.map((entry) =>
                        entry.id === context?.optimisticId ? createdEntry : entry
                    ) ?? []
            )
            // Update infinite query
            queryClient.setQueryData(
                [...addictionTrackerKeys.entriesList(newEntry.addictionId), 'infinite'],
                (old: any) => {
                    if (!old) return old
                    return {
                        ...old,
                        pages: old.pages.map((page: any) => ({
                            ...page,
                            entries: page.entries.map((entry: Entry) =>
                                entry.id === context?.optimisticId ? createdEntry : entry
                            ),
                        })),
                    }
                }
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
            const previousInfiniteEntries = queryClient.getQueryData(
                [...addictionTrackerKeys.entriesList(addictionId), 'infinite']
            )

            // Update regular query
            queryClient.setQueryData<Entry[]>(
                addictionTrackerKeys.entriesList(addictionId),
                (old) =>
                    old?.map((entry) =>
                        entry.id === id
                            ? { ...entry, ...data, updated_at: new Date() }
                            : entry
                    ) ?? []
            )

            // Update infinite query
            queryClient.setQueryData(
                [...addictionTrackerKeys.entriesList(addictionId), 'infinite'],
                (old: any) => {
                    if (!old) return old
                    return {
                        ...old,
                        pages: old.pages.map((page: any) => ({
                            ...page,
                            entries: page.entries.map((entry: Entry) =>
                                entry.id === id
                                    ? { ...entry, ...data, updated_at: new Date() }
                                    : entry
                            ),
                        })),
                    }
                }
            )

            return { previousEntries, previousInfiniteEntries, addictionId }
        },

        onError: (error, _, context) => {
            if (context?.previousEntries && context?.addictionId) {
                queryClient.setQueryData(
                    addictionTrackerKeys.entriesList(context.addictionId),
                    context.previousEntries
                )
            }
            if (context?.previousInfiniteEntries && context?.addictionId) {
                queryClient.setQueryData(
                    [...addictionTrackerKeys.entriesList(context.addictionId), 'infinite'],
                    context.previousInfiniteEntries
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
            const previousInfiniteEntries = queryClient.getQueryData(
                [...addictionTrackerKeys.entriesList(addictionId), 'infinite']
            )

            // Update regular query
            queryClient.setQueryData<Entry[]>(
                addictionTrackerKeys.entriesList(addictionId),
                (old) => old?.filter((entry) => entry.id !== id) ?? []
            )

            // Update infinite query
            queryClient.setQueryData(
                [...addictionTrackerKeys.entriesList(addictionId), 'infinite'],
                (old: any) => {
                    if (!old) return old
                    return {
                        ...old,
                        pages: old.pages.map((page: any) => ({
                            ...page,
                            entries: page.entries.filter((entry: Entry) => entry.id !== id),
                        })),
                    }
                }
            )

            return { previousEntries, previousInfiniteEntries, addictionId }
        },

        onError: (error, _, context) => {
            if (context?.previousEntries && context?.addictionId) {
                queryClient.setQueryData(
                    addictionTrackerKeys.entriesList(context.addictionId),
                    context.previousEntries
                )
            }
            if (context?.previousInfiniteEntries && context?.addictionId) {
                queryClient.setQueryData(
                    [...addictionTrackerKeys.entriesList(context.addictionId), 'infinite'],
                    context.previousInfiniteEntries
                )
            }
            toast.error(`Failed to delete entry: ${error.message}`)
        },

        onSuccess: () => {
            toast.success("Entry deleted successfully")
        },

        onSettled: (_, __, { addictionId }) => {
            // Invalidate entries queries
            queryClient.invalidateQueries({
                queryKey: addictionTrackerKeys.entriesList(addictionId),
            })
            // Invalidate addiction queries (to update relapse count and last_relapse_at in CircularTimer)
            queryClient.invalidateQueries({
                queryKey: addictionTrackerKeys.addictionsList(),
            })
            queryClient.invalidateQueries({
                queryKey: addictionTrackerKeys.addictionDetail(addictionId),
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

        onMutate: async ({ addictionId }) => {
            // Cancel outgoing queries
            await queryClient.cancelQueries({
                queryKey: addictionTrackerKeys.addictionsList(),
            })
            await queryClient.cancelQueries({
                queryKey: addictionTrackerKeys.addictionDetail(addictionId),
            })

            // Snapshot current data
            const previousAddictions = queryClient.getQueryData<AddictionWithStats[]>(
                addictionTrackerKeys.addictionsList()
            )
            const previousAddiction = queryClient.getQueryData<AddictionWithStats>(
                addictionTrackerKeys.addictionDetail(addictionId)
            )

            // Optimistically update addiction with new relapse time
            const now = new Date()
            
            queryClient.setQueryData<AddictionWithStats[]>(
                addictionTrackerKeys.addictionsList(),
                (old) =>
                    old?.map((addiction) =>
                        addiction.id === addictionId
                            ? {
                                ...addiction,
                                last_relapse_at: now,
                                relapse_count: addiction.relapse_count + 1,
                            }
                            : addiction
                    ) ?? []
            )

            queryClient.setQueryData<AddictionWithStats>(
                addictionTrackerKeys.addictionDetail(addictionId),
                (old) =>
                    old
                        ? {
                            ...old,
                            last_relapse_at: now,
                            relapse_count: old.relapse_count + 1,
                        }
                        : old
            )

            return { previousAddictions, previousAddiction, addictionId }
        },

        onError: (error, _, context) => {
            // Rollback on error
            if (context?.previousAddictions) {
                queryClient.setQueryData(
                    addictionTrackerKeys.addictionsList(),
                    context.previousAddictions
                )
            }
            if (context?.previousAddiction && context?.addictionId) {
                queryClient.setQueryData(
                    addictionTrackerKeys.addictionDetail(context.addictionId),
                    context.previousAddiction
                )
            }
            toast.error(`Failed to record relapse: ${error.message}`)
        },

        onSuccess: (_, { addictionId }) => {
            toast.success("Relapse recorded")
        },

        onSettled: (_, __, { addictionId }) => {
            // Invalidate related queries to ensure data consistency
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
    })
}

/**
 * Hook to update an existing relapse
 */
export function useUpdateRelapse() {
    const { user } = useUser()
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ["updateRelapse"],
        mutationFn: (data: { id: number; addictionId: number; data: RelapseUpdateInput }) =>
            relapseApi.updateRelapse(data.id, data.data, user?.api_key || ""),

        onMutate: async ({ id, addictionId, data }) => {
            // Cancel outgoing queries
            await queryClient.cancelQueries({
                queryKey: addictionTrackerKeys.addictionDetail(addictionId),
            })

            // Snapshot current state
            const previousAddiction = queryClient.getQueryData<AddictionWithStats>(
                addictionTrackerKeys.addictionDetail(addictionId)
            )

            // Optimistically update addiction's last_relapse_at
            if (previousAddiction) {
                queryClient.setQueryData<AddictionWithStats>(
                    addictionTrackerKeys.addictionDetail(addictionId),
                    {
                        ...previousAddiction,
                        last_relapse_at: data.created_at,
                    }
                )
            }

            return { previousAddiction, addictionId }
        },

        onError: (error, _, context) => {
            // Rollback on error
            if (context?.previousAddiction && context?.addictionId) {
                queryClient.setQueryData(
                    addictionTrackerKeys.addictionDetail(context.addictionId),
                    context.previousAddiction
                )
            }
            toast.error(`Failed to update relapse: ${error.message}`)
        },

        onSuccess: () => {
            toast.success("Relapse time updated")
        },

        onSettled: (_, __, { addictionId }) => {
            // Invalidate queries to refetch fresh data
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
    })
}
