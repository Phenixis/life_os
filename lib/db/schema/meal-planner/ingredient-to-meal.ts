import * as lib from "../lib"
import * as Meal from "./meal";
import * as Ingredient from "./ingredient";

export const table = lib.pgTable("meal_planner-ingredient_to_meal", {
    id: lib.serial("id").primaryKey(),
    
    meal_id: lib.integer("meal_id").notNull().references(
        () => Meal.table.id,
        { onDelete: "cascade" }
    ),
    ingredient_id: lib.integer("ingredient_id").notNull().references(
        () => Ingredient.table.id,
        { onDelete: "cascade" }
    ),

    quantity: lib.real("quantity").notNull().default(1),
    unit: lib.varchar("unit", { length: 50 }).notNull().default("unit"),
    
    created_at: lib.timestamp("created_at").notNull().defaultNow(),
    updated_at: lib.timestamp("updated_at").notNull().defaultNow(),
    deleted_at: lib.timestamp("deleted_at"),
}, (table) => ({
    mealIdIdx: lib.index("meal_planner_ingredient_to_meal_meal_id_idx").on(table.meal_id),
    ingredientIdIdx: lib.index("meal_planner_ingredient_to_meal_ingredient_id_idx").on(table.ingredient_id),
    mealIdDeletedAtIdx: lib.index("meal_planner_ingredient_to_meal_meal_id_deleted_at_idx").on(table.meal_id, table.deleted_at),
}))

export const relations = lib.relations(table, ({ one }) => ({
    meal: one(Meal.table, {
        fields: [table.meal_id],
        references: [Meal.table.id]
    }),
    ingredient: one(Ingredient.table, {
        fields: [table.ingredient_id],
        references: [Ingredient.table.id]
    })
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;