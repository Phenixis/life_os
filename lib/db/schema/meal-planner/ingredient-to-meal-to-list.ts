import * as lib from "../lib";
import * as IngredientToMeal from "./ingredient-to-meal";
import * as List from "./list";

export const table = lib.pgTable("meal_planner-ingredient_to_meal_to_list", {
    id: lib.serial("id").primaryKey(),
    
    ingredient_to_meal_id: lib.integer("ingredient_to_meal_id").notNull().references(
        () => IngredientToMeal.table.id,
        { onDelete: "cascade" }
    ),
    list_id: lib.integer("list_id").notNull().references(
        () => List.table.id,
        { onDelete: "cascade" }
    ),

    day: lib.timestamp("day"), // Date du repas
    moment_of_day: lib.varchar("moment_of_day", { length: 50 }), // Morning, Noon, AfterNoon, Evening, Night

    created_at: lib.timestamp("created_at").notNull().defaultNow(),
    updated_at: lib.timestamp("updated_at").notNull().defaultNow(),
    deleted_at: lib.timestamp("deleted_at"),
}, (table) => ({
    ingredientToMealIdIdx: lib.index("meal_planner_itm_to_list_itm_id_idx").on(table.ingredient_to_meal_id),
    listIdIdx: lib.index("meal_planner_itm_to_list_list_id_idx").on(table.list_id),
    listIdDayIdx: lib.index("meal_planner_itm_to_list_list_id_day_idx").on(table.list_id, table.day),
}))

export const relations = lib.relations(table, ({ one }) => ({
    ingredient_to_meal: one(IngredientToMeal.table, {
        fields: [table.ingredient_to_meal_id],
        references: [IngredientToMeal.table.id]
    }),
    list: one(List.table, {
        fields: [table.list_id],
        references: [List.table.id]
    })
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;