import * as lib from "../lib"
import * as User from "../user/user";
import * as Set_Workout from "./set_workout";

export const table = lib.pgTable("workout", {
    id: lib.serial("id").primaryKey(),

    name: lib.varchar("name", {length: 255}).notNull(),
    date: lib.timestamp("date").notNull(),
    difficulty: lib.integer("difficulty").notNull().default(0),

    user_id: lib.varchar("user_id", {length: 8}).notNull().references(
        () => User.table.id
    ),

    created_at: lib.timestamp("created_at").notNull().defaultNow(),
    updated_at: lib.timestamp("updated_at").notNull().defaultNow(),
    deleted_at: lib.timestamp("deleted_at"),
})

export const relations = lib.relations(table, ({one, many}) => ({
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id]
    }),
    set_workouts: many(Set_Workout.table)
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;