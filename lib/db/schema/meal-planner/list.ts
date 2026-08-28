import * as lib from "../lib";
import { User } from "../user";
import * as Project from "../project";

export const table = lib.pgTable("meal_planner-list", {
    id: lib.serial("id").primaryKey(),
    user_id: lib.varchar("user_id", { length: 8 }).notNull().references(
        () => User.table.id
    ),
 
    name: lib.varchar("name", { length: 255 }).notNull(),
    description: lib.varchar("description", { length: 1000 }),

    project_id: lib.integer("project_id").references(
        () => Project.table.id
    ),

    created_at: lib.timestamp("created_at").notNull().defaultNow(),
    updated_at: lib.timestamp("updated_at").notNull().defaultNow(),
    deleted_at: lib.timestamp("deleted_at"),
}, (table) => ({
    userIdIdx: lib.index("meal_planner_list_user_id_idx").on(table.user_id),
    userIdDeletedAtIdx: lib.index("meal_planner_list_user_id_deleted_at_idx").on(table.user_id, table.deleted_at),
    projectIdIdx: lib.index("meal_planner_list_project_id_idx").on(table.project_id),
}))

export const relations = lib.relations(table, ({ one }) => ({
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id]
    })
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;