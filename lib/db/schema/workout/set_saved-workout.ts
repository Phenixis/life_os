import * as lib from "../lib"
import * as WorkoutSet from "./set"
import * as SavedWorkout from "./saved-workout"

export const table = lib.pgTable("set_to_saved_workout", {
    id: lib.serial("id").primaryKey(),

    set_id: lib.integer("set_id").notNull().references(
        () => WorkoutSet.table.id, {
            onDelete: 'cascade'
        }
    ),
    saved_workout_id: lib.integer("saved_workout_id").notNull().references(
        () => SavedWorkout.table.id, {
            onDelete: 'cascade'
        }
    ),

    created_at: lib.timestamp("created_at").notNull().defaultNow(),
    updated_at: lib.timestamp("updated_at").notNull().defaultNow(),
    deleted_at: lib.timestamp("deleted_at"),
})

export const relations = lib.relations(table, ({one}) => ({
    sets: one(WorkoutSet.table, {
        fields: [table.set_id],
        references: [WorkoutSet.table.id]
    }),
    saved_workouts: one(SavedWorkout.table, {
        fields: [table.saved_workout_id],
        references: [SavedWorkout.table.id]
    })
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;