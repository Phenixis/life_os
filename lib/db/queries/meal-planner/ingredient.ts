import * as lib from "../lib";
import { QueryModel } from "../model";

const table = lib.Schema.MealPlanner.Ingredient.table;
type New = lib.Schema.MealPlanner.Ingredient.Insert
type Existing = lib.Schema.MealPlanner.Ingredient.Select

export class IngredientQuery extends QueryModel<New, Existing> {
    constructor() {
        super(table);
    }

    /**
     * Get ingredients by user ID with optional search
     */
    async getByUserId(
        userId: string,
        options?: {
            searchQuery?: string;
            orderBy?: "created_at" | "updated_at" | "name";
            orderingDirection?: "asc" | "desc";
            limit?: number;
            offset?: number;
        }
    ): Promise<{ success: string; ingredients: Existing[] } | { error: string }> {
        const {
            searchQuery,
            orderBy = "name",
            orderingDirection = "asc",
            limit = 100,
            offset = 0
        } = options || {};

        const orderColumn = table[orderBy];
        const orderFn = orderingDirection === "asc" ? lib.asc : lib.desc;

        const result = await lib.db
            .select()
            .from(table)
            .where(
                lib.and(
                    lib.eq(table.user_id, userId),
                    lib.isNull(table.deleted_at),
                    searchQuery
                        ? lib.sql`LOWER(${table.name}) LIKE LOWER(${'%' + searchQuery + '%'})`
                        : undefined
                )
            )
            .orderBy(orderFn(orderColumn))
            .limit(limit)
            .offset(offset);

        return { success: "Ingredients retrieved successfully.", ingredients: result };
    }

    /**
     * Find or create an ingredient by name
     */
    async findOrCreate(
        userId: string,
        name: string,
        description?: string,
        image_url?: string
    ): Promise<{ success: string; ingredient: Existing; created: boolean } | { error: string }> {
        // Try to find existing ingredient
        const existing = await lib.db
            .select()
            .from(table)
            .where(
                lib.and(
                    lib.eq(table.user_id, userId),
                    lib.sql`LOWER(${table.name}) = LOWER(${name})`,
                    lib.isNull(table.deleted_at)
                )
            )
            .limit(1);

        if (existing.length > 0) {
            return {
                success: "Ingredient found.",
                ingredient: existing[0],
                created: false
            };
        }

        // Create new ingredient
        const createResult = await this.create({
            user_id: userId,
            name,
            description,
            image_url
        });

        if ("error" in createResult) {
            return createResult;
        }

        return {
            success: "Ingredient created successfully.",
            ingredient: createResult.createdEntity,
            created: true
        };
    }
}