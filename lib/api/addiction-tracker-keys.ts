import { AddictionTracker } from "@/lib/db/schema"

/**
 * Query keys factory for addiction tracker
 * Provides type-safe, hierarchical query keys following React Query best practices
 */
export const addictionTrackerKeys = {
    // Addictions
    all: ['addiction-tracker'] as const,
    addictions: () => [...addictionTrackerKeys.all, 'addictions'] as const,
    addictionsList: () => [...addictionTrackerKeys.addictions(), 'list'] as const,
    addictionDetail: (id: number) => [...addictionTrackerKeys.addictions(), 'detail', id] as const,

    // Entries
    entries: () => [...addictionTrackerKeys.all, 'entries'] as const,
    entriesList: (addictionId: number) => [...addictionTrackerKeys.entries(), 'list', addictionId] as const,
    entryDetail: (id: number) => [...addictionTrackerKeys.entries(), 'detail', id] as const,

    // Relapses
    relapses: () => [...addictionTrackerKeys.all, 'relapses'] as const,
    relapsesList: (addictionId: number) => [...addictionTrackerKeys.relapses(), 'list', addictionId] as const,
}

// Type definitions
export type AddictionWithStats = AddictionTracker.Addiction.Select & {
    last_relapse_at: Date | null
    relapse_count: number
}

export type Entry = AddictionTracker.Entry.Select
export type Relapse = AddictionTracker.Relapse.Select

export interface AddictionCreateInput {
    title: string
    description?: string
}

export interface AddictionUpdateInput {
    title?: string
    description?: string | null
}

export interface EntryCreateInput {
    addictionId: number
    content: string
}

export interface EntryUpdateInput {
    content: string
}

export interface RelapseCreateInput {
    addictionId: number
    comment?: string
}
