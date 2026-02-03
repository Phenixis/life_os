"use client"

import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import { useUser } from "../use-user"
import { addictionApi, entryApi, relapseApi } from "@/lib/api/addiction-tracker.api"
import { addictionTrackerKeys } from "@/lib/api/addiction-tracker-keys"

/**
 * Hook to fetch all addictions for the user
 */
export function useAddictionsQuery(options?: { enabled?: boolean }) {
    const { user } = useUser()

    const query = useQuery({
        queryKey: addictionTrackerKeys.addictionsList(),
        queryFn: () => addictionApi.getAddictions(user?.api_key || ""),
        enabled: options?.enabled !== false && !!user?.api_key,
        staleTime: 5000,
    })

    return {
        ...query,
        addictions: query.data ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
    }
}

/**
 * Hook to fetch a single addiction by ID
 */
export function useAddictionQuery(id: number | undefined, options?: { enabled?: boolean }) {
    const { user } = useUser()

    return useQuery({
        queryKey: addictionTrackerKeys.addictionDetail(id!),
        queryFn: () => addictionApi.getAddiction(id!, user?.api_key || ""),
        enabled: options?.enabled !== false && !!id && !!user?.api_key,
        staleTime: 5000,
    })
}

/**
 * Hook to fetch all entries for an addiction
 */
export function useEntriesQuery(addictionId: number | undefined, options?: { enabled?: boolean }) {
    const { user } = useUser()

    const query = useQuery({
        queryKey: addictionTrackerKeys.entriesList(addictionId!),
        queryFn: () => entryApi.getEntries(addictionId!, user?.api_key || ""),
        enabled: options?.enabled !== false && !!addictionId && !!user?.api_key,
        staleTime: 5000,
    })

    return {
        ...query,
        entries: query.data?.entries ?? [],
        total: query.data?.total ?? 0,
        isLoading: query.isLoading,
        isError: query.isError,
    }
}

/**
 * Hook to fetch entries with infinite scrolling
 */
export function useInfiniteEntriesQuery(addictionId: number | undefined, options?: { enabled?: boolean; limit?: number }) {
    const { user } = useUser()
    const limit = options?.limit ?? 20

    const query = useInfiniteQuery({
        queryKey: [...addictionTrackerKeys.entriesList(addictionId!), 'infinite'],
        queryFn: ({ pageParam = 0 }) => 
            entryApi.getEntries(addictionId!, user?.api_key || "", { limit, offset: pageParam }),
        enabled: options?.enabled !== false && !!addictionId && !!user?.api_key,
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
            if (lastPage.hasMore) {
                return lastPage.offset + lastPage.limit
            }
            return undefined
        },
        staleTime: 5000,
    })

    const allEntries = query.data?.pages.flatMap(page => page.entries) ?? []
    const total = query.data?.pages[0]?.total ?? 0

    return {
        ...query,
        entries: allEntries,
        total,
        isLoading: query.isLoading,
        isError: query.isError,
    }
}

/**
 * Hook to fetch a single entry by ID
 */
export function useEntryQuery(id: number | undefined, options?: { enabled?: boolean }) {
    const { user } = useUser()

    return useQuery({
        queryKey: addictionTrackerKeys.entryDetail(id!),
        queryFn: () => entryApi.getEntry(id!, user?.api_key || ""),
        enabled: options?.enabled !== false && !!id && !!user?.api_key,
        staleTime: 5000,
    })
}

/**
 * Hook to fetch all relapses for an addiction
 */
export function useRelapsesQuery(addictionId: number | undefined, options?: { enabled?: boolean }) {
    const { user } = useUser()

    const query = useQuery({
        queryKey: addictionTrackerKeys.relapsesList(addictionId!),
        queryFn: () => relapseApi.getRelapses(addictionId!, user?.api_key || ""),
        enabled: options?.enabled !== false && !!addictionId && !!user?.api_key,
        staleTime: 5000,
    })

    return {
        ...query,
        relapses: query.data ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
    }
}
