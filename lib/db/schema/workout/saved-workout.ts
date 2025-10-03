import * as lib from "../lib"
import * as Set_SavedWorkout from "./set_saved-workout";
import * as User from "../user/user";

export const table = lib.pgTable("saved_workout", {
    id: lib.serial("id").primaryKey(),

    name: lib.varchar("name", {length: 255}).notNull(),

    user_id: lib.varchar("user_id", {length: 8}).notNull().references(
        () => User.table.id
    ),

    created_at: lib.timestamp("created_at").notNull().defaultNow(),
    updated_at: lib.timestamp("updated_at").notNull().defaultNow(),
    deleted_at: lib.timestamp("deleted_at"),
})

export const relations = lib.relations(table, ({one, many}) => ({
    set_saved_workouts: many(Set_SavedWorkout.table),
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id]
    })
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;