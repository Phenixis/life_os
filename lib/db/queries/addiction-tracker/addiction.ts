import * as lib from "../lib";
import { QueryModel } from "../model";
import { RelapseQueries } from ".";
import { EntryQueries } from ".";

const table = lib.Schema.AddictionTracker.Addiction.table;
type New = lib.Schema.AddictionTracker.Addiction.Insert
type Existing = lib.Schema.AddictionTracker.Addiction.Select

export class AddictionQuery extends QueryModel<New, Existing> {
    constructor() {
        super(table);
    }

    async getAllForUser(userId: string, with_deleted: boolean = false): Promise<{
        success: string; entities: (Existing & {
            last_relapse_at: Date,
            relapse_count: number
        })[]
    } | { error: string }> {
        const relapseTable = lib.Schema.AddictionTracker.Relapse.table;

        const result = await lib.db
            .select({
                id: this.table.id,
                user_id: this.table.user_id,
                title: this.table.title,
                description: this.table.description,
                created_at: this.table.created_at,
                updated_at: this.table.updated_at,
                deleted_at: this.table.deleted_at,
                last_relapse_at: lib.max(relapseTable.created_at),
                relapse_count: lib.count(relapseTable.id),
            })
            .from(this.table)
            .leftJoin(
                relapseTable,
                lib.and(
                    lib.eq(this.table.id, relapseTable.addiction_id),
                    with_deleted ? lib.sql`true` :
                    lib.isNull(relapseTable.deleted_at)
                )
            )
            .where(lib.and(
                lib.eq(this.table.user_id, userId),
                with_deleted ? lib.sql`true` : lib.isNull(this.table.deleted_at)
            ))
            .groupBy(this.table.id)
            .orderBy(lib.desc(this.table.created_at));

        return { success: "Data retrieved successfully.", entities: result as (Existing & {
            last_relapse_at: Date,
            relapse_count: number
        })[] };
    }

    async create(data: New): Promise<{ success: string; createdEntity: Existing } | { error: string }> {
        const creationResult = await super.create(data);

        if ("error" in creationResult) {
            return { error: creationResult.error };
        }

        const relapseCreationResult = await RelapseQueries.create({
            user_id: data.user_id,
            addiction_id: creationResult.createdEntity.id,
            comment: "Initial relapse",
        });

        if ("error" in relapseCreationResult) {
            return { error: relapseCreationResult.error };
        }

        return { success: "Addiction and initial relapse created successfully.", createdEntity: creationResult.createdEntity };
    }

    async getByIds(ids: number[], with_deleted: boolean = false): Promise<{
        success: string; entities: (Existing & {
            last_relapse_at: Date,
            relapse_count: number
        })[]
    } | { error: string }> {
        const relapseTable = lib.Schema.AddictionTracker.Relapse.table;

        const result = await lib.db
            .select({
                id: this.table.id,
                user_id: this.table.user_id,
                title: this.table.title,
                description: this.table.description,
                created_at: this.table.created_at,
                updated_at: this.table.updated_at,
                deleted_at: this.table.deleted_at,
                last_relapse_at: lib.max(relapseTable.created_at),
                relapse_count: lib.count(relapseTable.id),
            })
            .from(this.table)
            .leftJoin(
                relapseTable,
                lib.and(
                    lib.eq(this.table.id, relapseTable.addiction_id),
                    with_deleted ? lib.sql`true` :
                    lib.isNull(relapseTable.deleted_at)
                )
            )
            .where(lib.and(
                lib.inArray(this.table.id, ids),
                with_deleted ? lib.sql`true` : lib.isNull(this.table.deleted_at)
            ))
            .groupBy(this.table.id);

        if (lib.resultEmpty(result)) {
            return { error: "No data found for the provided IDs." };
        }

        return { success: "Data retrieved successfully.", entities: result as (Existing & {
            last_relapse_at: Date,
            relapse_count: number
        })[] };
    }

    /**
     * Soft-deletes an addiction and all its associated data.
     * This method bypasses all individual validation logic to force-delete the entire addiction tree.
     * 
     * Deletion order (to avoid foreign key issues):
     * 1. Soft-delete all entries (directly, without triggering relapse deletion)
     * 2. Soft-delete all relapses (directly, without validation)
     * 3. Soft-delete the addiction itself
     */
    async delete(id: number): Promise<{ success: string; } | { error: string; }> {
        const now = new Date();
        
        // Step 1: Soft-delete all entries for this addiction directly
        // We update the database directly to avoid triggering Entry.delete() which would
        // try to delete relapses and hit the "last relapse" validation
        await lib.db
            .update(lib.Schema.AddictionTracker.Entry.table)
            .set({ deleted_at: now })
            .where(lib.and(
                lib.eq(lib.Schema.AddictionTracker.Entry.table.addiction_id, id),
                lib.isNull(lib.Schema.AddictionTracker.Entry.table.deleted_at)
            ));

        // Step 2: Soft-delete all relapses for this addiction directly
        // We bypass the RelapseQueries.delete() method to avoid the "last relapse" validation
        // since we're deleting the entire addiction anyway
        await lib.db
            .update(lib.Schema.AddictionTracker.Relapse.table)
            .set({ deleted_at: now })
            .where(lib.and(
                lib.eq(lib.Schema.AddictionTracker.Relapse.table.addiction_id, id),
                lib.isNull(lib.Schema.AddictionTracker.Relapse.table.deleted_at)
            ));

        // Step 3: Soft-delete the addiction itself
        const result = await super.delete(id);

        if ("error" in result) {
            return { error: "The entries and relapses have been deleted, but there was an error deleting the addiction: " + result.error };
        }

        return { success: "Addiction and all associated data deleted successfully." };
    }

    /**
     * Hard-deletes an addiction and all its associated data from the database.
     * This method bypasses all individual validation logic to force-delete the entire addiction tree.
     * 
     * Deletion order (to respect foreign key constraints):
     * 1. Hard-delete all entries (they reference relapses)
     * 2. Hard-delete all relapses (they reference the addiction)
     * 3. Hard-delete the addiction itself
     */
    async hardDelete(id: number): Promise<{ success: string; } | { error: string; }> {
        // Step 1: Hard-delete all entries for this addiction directly
        // Entries must be deleted first because they have foreign keys to relapses
        await lib.db
            .delete(lib.Schema.AddictionTracker.Entry.table)
            .where(lib.eq(lib.Schema.AddictionTracker.Entry.table.addiction_id, id));

        // Step 2: Hard-delete all relapses for this addiction directly
        // We bypass the RelapseQueries.hardDelete() method to avoid the "last relapse" validation
        // since we're deleting the entire addiction anyway
        await lib.db
            .delete(lib.Schema.AddictionTracker.Relapse.table)
            .where(lib.eq(lib.Schema.AddictionTracker.Relapse.table.addiction_id, id));

        // Step 3: Hard-delete the addiction itself
        const result = await super.hardDelete(id);

        if ("error" in result) {
            return { error: "The entries and relapses have been deleted, but there was an error deleting the addiction: " + result.error };
        }

        return { success: "Addiction and all associated data permanently deleted." };
    }
}
