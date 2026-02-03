import * as lib from "../lib";
import { QueryModel } from "../model";
import { RelapseQueries } from ".";

const table = lib.Schema.AddictionTracker.Entry.table;
type New = lib.Schema.AddictionTracker.Entry.Insert
type Existing = lib.Schema.AddictionTracker.Entry.Select

export class EntryQuery extends QueryModel<New, Existing> {
    constructor() {
        super(table);
    }

    async getEntriesForAddiction(
        addictionId: number, 
        with_deleted: boolean = false,
        options?: { limit?: number; offset?: number }
    ): Promise<{ success: string; entities: Existing[]; total: number } | { error: string }> {
        // First get the total count
        const countResult = await lib.db
            .select({
                count: lib.sql<number>`count(*)::int`,
            })
            .from(this.table)
            .where(lib.and(
                lib.eq(this.table.addiction_id, addictionId),
                with_deleted ? lib.sql`true` : lib.isNull(this.table.deleted_at),
            ));

        const total = countResult[0]?.count || 0;

        if (total === 0) {
            return { success: "No entries found.", entities: [], total: 0 };
        }

        // Then get the paginated results
        let query = lib.db
            .select({
                id: this.table.id,
            })
            .from(this.table)
            .where(lib.and(
                lib.eq(this.table.addiction_id, addictionId),
                with_deleted ? lib.sql`true` : lib.isNull(this.table.deleted_at),
            ))
            .orderBy(lib.desc(this.table.created_at))
            .limit(options?.limit || total)
            .offset(options?.offset || 0);

        const result = await query;

        if (lib.resultEmpty(result)) {
            return { success: "No entries found.", entities: [], total };
        }

        const byIdsResult = await this.getByIds(result.map(r => r.id), with_deleted);
        
        if ("error" in byIdsResult) {
            return byIdsResult;
        }

        return { ...byIdsResult, total };
    }

    async getEntryForRelapse(relapseId: number, with_deleted: boolean = false): Promise<{ success: string; entity: Existing } | { error: string }> {
        const result = await lib.db
            .select({
                id: this.table.id,
            })
            .from(this.table)
            .where(lib.and(
                lib.eq(this.table.relapse_id, relapseId),
                with_deleted ? lib.sql`true` : lib.isNull(this.table.deleted_at),
            ));

        if (lib.resultEmpty(result)) {
            return { error: "No entry found for the provided relapse ID." };
        }

        return this.getById(result[0].id, with_deleted);
    }

    /**
     * Soft-deletes an entry and its associated relapse.
     * 
     * CIRCULAR DELETION PATTERN:
     * This method participates in a circular deletion pattern with RelapseQueries.delete().
     * The soft-delete mechanism prevents infinite recursion:
     * 
     * Flow when Entry.delete() is called first:
     * 1. Entry.delete(entry_id) - soft-deletes the entry (sets deleted_at)
     * 2. Calls RelapseQueries.delete(relapse_id)
     * 3. Relapse.delete() queries for entries WHERE deleted_at IS NULL
     * 4. Finds nothing (entry is already soft-deleted)
     * 5. Relapse.delete() soft-deletes the relapse - DONE
     * 
     * Flow when Relapse.delete() is called first:
     * 1. Relapse.delete(relapse_id) finds the entry WHERE deleted_at IS NULL
     * 2. Calls Entry.delete(entry_id) - THIS method
     * 3. Entry is soft-deleted (deleted_at is set)
     * 4. Calls RelapseQueries.delete(relapse_id) again (recursive call)
     * 5. Relapse.delete() queries for entries WHERE deleted_at IS NULL
     * 6. Finds nothing (entry was just soft-deleted in step 3)
     * 7. Relapse.delete() soft-deletes the relapse - DONE
     * 
     * The WHERE deleted_at IS NULL filter prevents infinite recursion.
     */
    async delete(id: number): Promise<{ success: string } | { error: string }> {
        const entry = await this.getById(id);

        if ("error" in entry) {
            return { error: entry.error };
        }

        // Check if this entry is associated with the last relapse for the addiction
        if (entry.entity.relapse_id) {
            const relapseCount = await RelapseQueries.getRelapseCountForAddiction(entry.entity.addiction_id);

            if ("error" in relapseCount) {
                return { error: relapseCount.error };
            }

            if (relapseCount.count <= 1) {
                return { error: "Cannot delete this entry: at least one relapse must remain for the addiction." };
            }
        }

        // Soft-delete the entry (sets deleted_at timestamp)
        const deletionResult = await super.delete(id);

        if ("error" in deletionResult) {
            return { error: deletionResult.error };
        }

        if (!entry.entity.relapse_id) {
            return deletionResult;
        }

        // Trigger the circular deletion: this may be a recursive call
        // If so, Relapse.delete() won't find this entry (it's soft-deleted) and will proceed
        const relapseDeletionResult = await RelapseQueries.delete(entry.entity.relapse_id);

        if ("error" in relapseDeletionResult) {
            return { error: relapseDeletionResult.error };
        }

        return { success: "Entry and associated relapse deleted successfully." };
    }

    async hardDelete(id: number): Promise<{ success: string; } | { error: string; }> {
        const entry = await this.getById(id, true); // Include deleted entries

        if ("error" in entry) {
            return { error: entry.error };
        }

        // Check if this entry is associated with the last relapse for the addiction
        if (entry.entity.relapse_id) {
            const relapseCount = await RelapseQueries.getRelapseCountForAddiction(entry.entity.addiction_id, true);

            if ("error" in relapseCount) {
                return { error: relapseCount.error };
            }

            if (relapseCount.count <= 1) {
                return { error: "Cannot hard delete this entry: at least one relapse must remain for the addiction." };
            }
        }

        const deletionResult = await super.hardDelete(id);

        if ("error" in deletionResult) {
            return { error: deletionResult.error };
        }

        if (!entry.entity.relapse_id) {
            return deletionResult;
        }

        const relapseDeletionResult = await RelapseQueries.hardDelete(entry.entity.relapse_id);

        if ("error" in relapseDeletionResult) {
            return { error: relapseDeletionResult.error };
        }

        return { success: "Entry and associated relapse hard deleted successfully." };
    }
}