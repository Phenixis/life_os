import * as lib from "../lib"
import * as WorkoutSet from "./set"
import * as Workout from "./workout"

export const table = lib.pgTable("set_to_workout", {
    id: lib.serial("id").primaryKey(),

    set_id: lib.integer("set_id").notNull().references(
        () => WorkoutSet.table.id, {
            onDelete: 'cascade'
        }
    ),
    workout_id: lib.integer("workout_id").notNull().references(
        () => Workout.table.id, {
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
    saved_workouts: one(Workout.table, {
        fields: [table.workout_id],
        references: [Workout.table.id]
    })
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;