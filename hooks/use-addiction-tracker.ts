"use client"

// Query hooks
export {
    useAddictionsQuery,
    useAddictionQuery,
    useEntriesQuery,
    useInfiniteEntriesQuery,
    useEntryQuery,
    useRelapsesQuery,
} from "./queries/use-addiction-tracker-query"

// Mutation hooks
export {
    useCreateAddiction,
    useUpdateAddiction,
    useDeleteAddiction,
    useCreateEntry,
    useUpdateEntry,
    useDeleteEntry,
    useCreateRelapse,
} from "./queries/use-addiction-tracker-mutations"

// Re-export types
export type {
    AddictionWithStats,
    Entry,
    Relapse,
    AddictionCreateInput,
    AddictionUpdateInput,
    EntryCreateInput,
    EntryUpdateInput,
    RelapseCreateInput,
} from "@/lib/api/addiction-tracker-keys"
