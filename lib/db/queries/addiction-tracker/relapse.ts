import * as lib from "../lib";
import { QueryModel } from "../model";
import { EntryQueries } from ".";

const table = lib.Schema.AddictionTracker.Relapse.table;
type New = lib.Schema.AddictionTracker.Relapse.Insert
type Existing = lib.Schema.AddictionTracker.Relapse.Select

export class RelapseQuery extends QueryModel<New, Existing> {
    constructor() {
        super(table);
    }

    async create(data: New & { comment?: string }): Promise<{ success: string; createdEntity: Existing } | { error: string }> {
        const creationResult = await super.create(data);

        if ("error" in creationResult) {
            return { error: creationResult.error };
        }

        const entryCreationResult = await EntryQueries.create({
            user_id: data.user_id,
            addiction_id: data.addiction_id,
            content: "Relapse recorded" + (data.comment ? `: ${data.comment}` : ""),
            relapse_id: creationResult.createdEntity.id,
        });

        if ("error" in entryCreationResult) {
            return { error: entryCreationResult.error };
        }

        return { success: "Relapse and entry created successfully.", createdEntity: creationResult.createdEntity };
    }

    async getRelapsesForAddiction(addictionId: number): Promise<{ success: string; entities: Existing[] } | { error: string }> {
        const result = await lib.db
            .select({
                id: this.table.id,
            })
            .from(this.table)
            .where(lib.and(
                lib.eq(this.table.addiction_id, addictionId),
                lib.isNull(this.table.deleted_at),
            ));

        if (lib.resultEmpty(result)) {
            return { success: "No relapses found.", entities: [] };
        }

        return this.getByIds(result.map(r => r.id));
    }

    async getLastRelapseForAddiction(addictionId: number, with_deleted: boolean = false): Promise<{ success: string; entity: Existing } | { error: string }> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.and(
                lib.eq(this.table.addiction_id, addictionId),
                with_deleted ? lib.sql`true` : lib.isNull(this.table.deleted_at),
            ))
            .orderBy(lib.desc(this.table.created_at))
            .limit(1) as Existing[];

        if (lib.resultEmpty(result)) {
            return { error: "No relapse found for the provided addiction ID." };
        }

        return { success: "Data retrieved successfully.", entity: result[0] };
    }

    async getRelapseCountForAddiction(addictionId: number, with_deleted: boolean = false): Promise<{ success: string; count: number } | { error: string }> {
        const result = await lib.db
            .select({
                count: lib.count(this.table.id)
            })
            .from(this.table)
            .where(lib.and(
                lib.eq(this.table.addiction_id, addictionId),
                with_deleted ? lib.sql`true` : lib.isNull(this.table.deleted_at),
            )) as { count: number }[];

        if (lib.resultEmpty(result)) {
            return { error: "Failed to retrieve relapse count." };
        }

        return { success: "Count retrieved successfully.", count: result[0].count };
    }
    /**
     * Soft-deletes a relapse and its associated entry.
     * 
     * CIRCULAR DELETION PATTERN:
     * This method participates in a circular deletion pattern with EntryQueries.delete().
     * The soft-delete mechanism prevents infinite recursion:
     * 
     * Flow when Relapse.delete() is called first:
     * 1. Relapse.delete(relapse_id) finds entry WHERE deleted_at IS NULL
     * 2. Calls Entry.delete(entry_id)
     * 3. Entry.delete() soft-deletes the entry (sets deleted_at)
     * 4. Entry.delete() calls Relapse.delete(relapse_id) again (recursive call)
     * 5. Relapse.delete() queries for entries WHERE deleted_at IS NULL
     * 6. Finds nothing (entry was just soft-deleted in step 3)
     * 7. Relapse.delete() soft-deletes the relapse - DONE
     * 
     * Flow when Entry.delete() is called first:
     * 1. Entry.delete(entry_id) soft-deletes the entry
     * 2. Calls RelapseQueries.delete(relapse_id) - THIS method
     * 3. Relapse.delete() queries for entries WHERE deleted_at IS NULL
     * 4. Finds nothing (entry is already soft-deleted)
     * 5. Relapse.delete() soft-deletes the relapse - DONE
     * 
     * The WHERE deleted_at IS NULL filter prevents infinite recursion.
     */
    async delete(id: number): Promise<{ success: string } | { error: string }> {
        // First get the relapse to know which addiction it belongs to
        const relapse = await this.getById(id);

        if ("error" in relapse) {
            return { error: relapse.error };
        }

        // Check if this is the last relapse for the addiction
        const relapseCount = await this.getRelapseCountForAddiction(relapse.entity.addiction_id);
        
        if ("error" in relapseCount) {
            return { error: relapseCount.error };
        }

        if (relapseCount.count <= 1) {
            return { error: "Cannot delete this relapse: at least one relapse must remain for the addiction." };
        }

        // Find entry associated with this relapse (only non-deleted entries)
        // This query is the KEY to preventing infinite recursion:
        // If this is a recursive call, the entry will already be soft-deleted, so nothing is found
        const entry = await lib.db
            .select()
            .from(EntryQueries.table)
            .where(lib.and(
                lib.eq(EntryQueries.table.relapse_id, id),
                lib.isNull(EntryQueries.table.deleted_at), // Only finds non-deleted entries
            ))
            .limit(1);

        if (!lib.resultEmpty(entry)) {
            // Trigger the circular deletion: Entry.delete() will soft-delete the entry
            // and call this method again, but the recursive call will skip this block
            const entryDeletion = await EntryQueries.delete(entry[0].id);
            if ("error" in entryDeletion) {
                return { error: entryDeletion.error };
            }
        }

        // Soft-delete the relapse (sets deleted_at timestamp)
        return await super.delete(id);
    }

    async hardDelete(id: number): Promise<{ success: string } | { error: string }> {
        // First get the relapse to know which addiction it belongs to
        const relapse = await this.getById(id, true); // Include deleted relapses

        if ("error" in relapse) {
            return { error: relapse.error };
        }

        // Check if this is the last relapse for the addiction (include deleted)
        const relapseCount = await this.getRelapseCountForAddiction(relapse.entity.addiction_id, true);
        
        if ("error" in relapseCount) {
            return { error: relapseCount.error };
        }

        if (relapseCount.count <= 1) {
            return { error: "Cannot hard delete this relapse: at least one relapse must remain for the addiction." };
        }

        const entry = await lib.db
            .select()
            .from(EntryQueries.table)
            .where(lib.eq(EntryQueries.table.relapse_id, id))
            .limit(1);

        if (!lib.resultEmpty(entry)) {
            const entryDeletion = await EntryQueries.hardDelete(entry[0].id);
            if ("error" in entryDeletion) {
                return { error: entryDeletion.error };
            }
        }

        return await super.hardDelete(id);
    }
}