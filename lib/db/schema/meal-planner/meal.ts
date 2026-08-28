import * as lib from "../lib"
import { User } from "../user";
import * as Ingredient from "./ingredient";

export const table = lib.pgTable("meal_planner-meal", {
    id: lib.serial("id").primaryKey(),
    user_id: lib.varchar("user_id", { length: 8 }).notNull().references(
        () => User.table.id
    ),

    image_url: lib.varchar("image_url", { length: 1000 }),
    name: lib.varchar("name", { length: 255 }).notNull(),
    description: lib.varchar("description", { length: 1000 }),

    created_at: lib.timestamp("created_at").notNull().defaultNow(),
    updated_at: lib.timestamp("updated_at").notNull().defaultNow(),
    deleted_at: lib.timestamp("deleted_at"),
}, (table) => ({
    userIdIdx: lib.index("meal_planner_meal_user_id_idx").on(table.user_id),
    userIdDeletedAtIdx: lib.index("meal_planner_meal_user_id_deleted_at_idx").on(table.user_id, table.deleted_at),
}))

export const relations = lib.relations(table, ({ one }) => ({
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id]
    })
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;
export type SelectWithIngredients = Select & {
    ingredients: Ingredient.Select[];
}