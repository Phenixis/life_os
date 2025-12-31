import { fetchWithAuth } from "../fetcher"
import type {
    AddictionWithStats,
    Entry,
    Relapse,
    AddictionCreateInput,
    AddictionUpdateInput,
    EntryCreateInput,
    EntryUpdateInput,
    RelapseCreateInput,
} from "./addiction-tracker-keys"

const BASE_URL = "/api/addiction-tracker"

// ============= ADDICTION API =============

export const addictionApi = {
    /**
     * Fetch all addictions for the user
     */
    getAddictions: async (apiKey: string): Promise<AddictionWithStats[]> => {
        const response = await fetchWithAuth<{ addictions: AddictionWithStats[] }>(
            `${BASE_URL}/addiction`,
            apiKey
        )
        return response.addictions
    },

    /**
     * Fetch a single addiction by ID
     */
    getAddiction: async (id: number, apiKey: string): Promise<AddictionWithStats> => {
        const response = await fetchWithAuth<{ addiction: AddictionWithStats }>(
            `${BASE_URL}/addiction/${id}`,
            apiKey
        )
        return response.addiction
    },

    /**
     * Create a new addiction
     */
    createAddiction: async (data: AddictionCreateInput, apiKey: string): Promise<AddictionWithStats> => {
        const response = await fetchWithAuth<{ addiction: AddictionWithStats }>(
            `${BASE_URL}/addiction`,
            apiKey,
            {
                method: "POST",
                body: JSON.stringify(data),
            }
        )
        return response.addiction
    },

    /**
     * Update an addiction
     */
    updateAddiction: async (
        id: number,
        data: AddictionUpdateInput,
        apiKey: string
    ): Promise<AddictionWithStats> => {
        const response = await fetchWithAuth<{ addiction: AddictionWithStats }>(
            `${BASE_URL}/addiction/${id}`,
            apiKey,
            {
                method: "PUT",
                body: JSON.stringify(data),
            }
        )
        return response.addiction
    },

    /**
     * Delete an addiction
     */
    deleteAddiction: async (id: number, apiKey: string): Promise<void> => {
        await fetchWithAuth<{ success: string }>(
            `${BASE_URL}/addiction/${id}`,
            apiKey,
            { method: "DELETE" }
        )
    },
}

// ============= ENTRY API =============

export const entryApi = {
    /**
     * Fetch entries for an addiction with pagination support
     */
    getEntries: async (
        addictionId: number, 
        apiKey: string,
        options?: { limit?: number; offset?: number }
    ): Promise<{
        entries: Entry[];
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    }> => {
        const params = new URLSearchParams({ addictionId: addictionId.toString() })
        if (options?.limit) params.append('limit', options.limit.toString())
        if (options?.offset) params.append('offset', options.offset.toString())
        
        return fetchWithAuth<{
            entries: Entry[];
            total: number;
            limit: number;
            offset: number;
            hasMore: boolean;
        }>(
            `${BASE_URL}/entry?${params.toString()}`,
            apiKey
        )
    },

    /**
     * Fetch a single entry by ID
     */
    getEntry: async (id: number, apiKey: string): Promise<Entry> => {
        const response = await fetchWithAuth<{ entry: Entry }>(
            `${BASE_URL}/entry/${id}`,
            apiKey
        )
        return response.entry
    },

    /**
     * Create a new entry
     */
    createEntry: async (data: EntryCreateInput, apiKey: string): Promise<Entry> => {
        const response = await fetchWithAuth<{ entry: Entry }>(
            `${BASE_URL}/entry`,
            apiKey,
            {
                method: "POST",
                body: JSON.stringify(data),
            }
        )
        return response.entry
    },

    /**
     * Update an entry
     */
    updateEntry: async (id: number, data: EntryUpdateInput, apiKey: string): Promise<Entry> => {
        const response = await fetchWithAuth<{ entry: Entry }>(
            `${BASE_URL}/entry/${id}`,
            apiKey,
            {
                method: "PUT",
                body: JSON.stringify(data),
            }
        )
        return response.entry
    },

    /**
     * Delete an entry
     */
    deleteEntry: async (id: number, apiKey: string): Promise<void> => {
        await fetchWithAuth<{ success: string }>(
            `${BASE_URL}/entry/${id}`,
            apiKey,
            { method: "DELETE" }
        )
    },
}

// ============= RELAPSE API =============

export const relapseApi = {
    /**
     * Fetch all relapses for an addiction
     */
    getRelapses: async (addictionId: number, apiKey: string): Promise<Relapse[]> => {
        const response = await fetchWithAuth<{ relapses: Relapse[] }>(
            `${BASE_URL}/relapse?addictionId=${addictionId}`,
            apiKey
        )
        return response.relapses
    },

    /**
     * Record a new relapse
     */
    createRelapse: async (data: RelapseCreateInput, apiKey: string): Promise<Relapse> => {
        const response = await fetchWithAuth<{ relapse: Relapse }>(
            `${BASE_URL}/relapse`,
            apiKey,
            {
                method: "POST",
                body: JSON.stringify(data),
            }
        )
        return response.relapse
    },
}
