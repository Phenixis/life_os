
import * as lib from "../lib";
import { QueryModel } from "../model";
import { calculateUrgency } from "@/lib/utils/task";

const table = lib.Schema.Task.Task.table;
type New = lib.Schema.Task.Task.Insert
type Existing = lib.Schema.Task.Task.Select

function resultEmpty(result: any): boolean {
    return !result || result.length === 0;
}

export class TaskModel extends QueryModel<New, Existing> {

    // Verifications
    async isExistingForUser(taskId: number, userId: string): Promise<boolean> {
        const task = await lib.db
            .select()
            .from(table)
            .where(lib.and(
                lib.eq(table.id, taskId),
                lib.eq(table.user_id, userId)
            ))
            .limit(1)

        return task.length > 0;
    }

    isCompleted(task: Existing): boolean {
        return task.completed_at !== null;
    }

    isDeleted(task: Existing): boolean {
        return task.deleted_at !== null;
    }

    // C
    async create(creationData: New): Promise<{ success: string; createdEntity: Existing } | { error: string }> {
        const urgency = calculateUrgency(creationData.due)

        const result = await lib.db
            .insert(table)
            .values({
                ...creationData,
                urgency: urgency,
                state: creationData.state || lib.Schema.Task.Task.State.TODO
            })
            .returning()

        if (resultEmpty(result)) {
            return { error: "Failed to create task" };
        }

        const createdTask = result[0]

        return { success: "Task created successfully", createdEntity: createdTask };
    }

    // R
    async getById(id: number): Promise<{ success: string; entity: Existing } | { error: string }> {
        const result = await this.getByIds([id]);

        if ('error' in result) {
            return { error: result.error };
        }

        return { success: "Task retrieved successfully", entity: result.entities[0] };
    }

    /**
     * Get multiple tasks by their IDs
     * 
     * @param ids Array of task IDs
     * @returns Promise resolving to an object containing either a success message and an array of tasks (with at least one task), or an error message
     */
    async getByIds(ids: number[]): Promise<{ success: string; entities: Existing[] } | { error: string }> {
        const tasks = await lib.db
            .select()
            .from(table)
            .where(lib.inArray(table.id, ids))

        if (resultEmpty(tasks)) {
            return {
                error: "No tasks found"
            }
        }

        return { success: "Tasks retrieved successfully", entities: tasks };
    }

    async getMany(userId: string, filters: {
        includedProjectIds?: number[],
        excludedProjectIds?: number[],
        dueBefore?: Date,
        dueAfter?: Date,
        completedBefore?: Date,
        completedAfter?: Date,
        includeCompleted?: boolean,
        includeDeleted?: boolean,
    }, orderParams: {
        orderBy: keyof Existing,
        orderDirection: "asc" | "desc"
    }[], limit?: number, offset?: number): Promise<{ success: string; entities: Existing[] } | { error: string }> {
        const distinctTaskIds = await lib.db
            .select({
                id: table.id,
            })
            .from(table)
            .where(
                lib.and(
                    lib.eq(table.user_id, userId),
                    filters.includedProjectIds
                        ? (filters.includedProjectIds.includes(-1) // with No Project
                            ? lib.or(
                                lib.inArray(table.project_id, filters.includedProjectIds.filter(id => id !== -1)),
                                lib.isNull(table.project_id)
                            )
                            : lib.inArray(table.project_id, filters.includedProjectIds)
                        )
                        : lib.sql`TRUE`,
                    filters.excludedProjectIds
                        ? (filters.excludedProjectIds.includes(-1) // without No Project
                            ? lib.and(
                                lib.notInArray(table.project_id, filters.excludedProjectIds.filter(id => id !== -1)),
                                lib.isNotNull(table.project_id)
                            )
                            : lib.notInArray(table.project_id, filters.excludedProjectIds)
                        )
                        : lib.sql`TRUE`,
                    filters.dueBefore ? lib.lte(table.due, filters.dueBefore) : lib.sql`TRUE`,
                    filters.dueAfter ? lib.gte(table.due, filters.dueAfter) : lib.sql`TRUE`,
                    filters.completedBefore ? lib.lte(table.completed_at, filters.completedBefore) : lib.sql`TRUE`,
                    filters.completedAfter ? lib.gte(table.completed_at, filters.completedAfter) : lib.sql`TRUE`,
                    filters.includeCompleted ? lib.sql`TRUE` : lib.isNull(table.completed_at),
                    filters.includeDeleted ? lib.sql`TRUE` : lib.isNull(table.deleted_at),
                )
            )
            .orderBy(
                ...orderParams.map(param =>
                    param.orderDirection === "asc"
                        ? lib.asc(table[param.orderBy])
                        : lib.desc(table[param.orderBy])
                )
            )
            .limit(limit || 100)
            .offset(offset || 0)

        if (resultEmpty(distinctTaskIds)) {
            return {
                error: "No tasks found. Try adjusting your filters."
            }
        }

        const taskIds = distinctTaskIds.map(t => t.id)

        return this.getByIds(taskIds);
    }

    async search(userId: string, title: string, limit?: number, offset?: number): Promise<{ success: string; entities: Existing[] } | { error: string }> {

        const tasks = await lib.db
            .select()
            .from(table)
            .where(lib.and(
                lib.sql`LOWER(${table.title}) LIKE LOWER(${`%${title}%`})`,
                lib.eq(table.user_id, userId),
                lib.isNull(table.deleted_at),
                lib.isNull(table.completed_at),
            ))
            .orderBy(lib.asc(table.title))
            .limit(limit || 50)
            .offset(offset || 0)

        if (resultEmpty(tasks)) {
            return { error: "No tasks found matching the title query" };
        }

        return { success: "Tasks retrieved successfully", entities: tasks };
    }

    // U
    async update(id: number, updateData: Partial<Existing>): Promise<{ success: string; updatedEntity: Existing } | { error: string }> {
        const queryResult = await this.getById(id)

        if ("error" in queryResult) {
            return queryResult;
        }

        const old_task = queryResult.entity;
        const urgency = updateData.due ? calculateUrgency(updateData.due) : old_task.urgency

        const result = await lib.db
            .update(table)
            .set({
                ...updateData,
                urgency: urgency,
                updated_at: lib.sql`CURRENT_TIMESTAMP`,
            })
            .where(lib.and(
                lib.eq(table.id, id),
            ))
            .returning()

        if (resultEmpty(result)) {
            return { error: "Failed to update task" };
        }

        return { success: "Task updated successfully", updatedEntity: result[0] };
    }

    async updateTaskUrgency(id: number, userId: string): Promise<{ success: string; updatedEntity: Existing } | { error: string }> {
        const queryResult = await this.getById(id)

        if ("error" in queryResult) {
            return queryResult
        }

        if (this.isCompleted(queryResult.entity) || this.isDeleted(queryResult.entity)) {
            return {
                error: "Cannot update urgency of completed or deleted task"
            }
        }

        const taskData = queryResult.entity

        const urgency = calculateUrgency(taskData.due)

        const result = await lib.db
            .update(table)
            .set({
                urgency: urgency,
                updated_at: lib.sql`CURRENT_TIMESTAMP`,
            })
            .where(lib.and(
                lib.eq(table.id, id),
                lib.eq(table.user_id, userId),
            ))
            .returning()

        if (resultEmpty(result)) {
            return { error: "Failed to update task urgency" };
        }

        return { success: "Task urgency updated successfully", updatedEntity: result[0] };
    }

    async toggleCompletion(id: number, force?: boolean): Promise<{ success: string; updatedEntity: Existing } | { error: string }> {
        const queryResult = await this.getById(id)

        if ("error" in queryResult) {
            return queryResult
        }

        const newState = {
            completed_at: force === undefined ? (this.isCompleted(queryResult.entity) ? null : new Date()) : (force ? new Date() : null),
            updated_at: new Date(),
        }

        return this.update(id, newState);
    }

    // D
    async delete(id: number): Promise<{ success: string } | { error: string }> {
        const result = await lib.db
            .update(table)
            .set({ deleted_at: lib.sql`CURRENT_TIMESTAMP`, updated_at: lib.sql`CURRENT_TIMESTAMP` })
            .where(lib.and(
                lib.eq(table.id, id),
            ))

        if (resultEmpty(result)) {
            return { error: "Failed to delete task" };
        }

        return { success: "Task deleted successfully" };
    }

    async recover(id: number): Promise<{ success: string; recoveredEntity: Existing } | { error: string }> {
        const result = await lib.db
            .update(table)
            .set({ deleted_at: null, updated_at: lib.sql`CURRENT_TIMESTAMP` })
            .where(lib.and(
                lib.eq(table.id, id),
            ))
            .returning()

        if (resultEmpty(result)) {
            return { error: "Failed to recover task" };
        }

        return { success: "Task recovered successfully", recoveredEntity: result[0] };
    }

    async hardDelete(id: number): Promise<{ success: string } | { error: string }> {
        const result = await lib.db
            .delete(table)
            .where(lib.and(
                lib.eq(table.id, id),
            ))

        if (resultEmpty(result)) {
            return { error: "Failed to hard delete task" };
        }

        return { success: "Task hard deleted successfully" };
    }
}