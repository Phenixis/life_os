import * as lib from "../lib"
import * as Exercice from "./exercice"
import * as Set_SavedWorkout from "./set_saved-workout"
import * as User from "../user/user";
import * as Set_Workout from "./set_workout"

export const table = lib.pgTable("set", {
    id: lib.serial("id").primaryKey(),

    weight: lib.integer("weight").notNull(),
    nb_reps: lib.integer("nb_reps").notNull(),

    exercice_id: lib.integer("exercice_id").references(
        () => Exercice.table.id, {
            onDelete: 'cascade'
        }
    ),
    user_id: lib.varchar("user_id", {length: 8}).notNull().references(
        () => User.table.id
    ),

    created_at: lib.timestamp("created_at").notNull().defaultNow(),
    updated_at: lib.timestamp("updated_at").notNull().defaultNow(),
    deleted_at: lib.timestamp("deleted_at"),
})

export const relations = lib.relations(table, ({one, many}) => ({
    exercice: one(Exercice.table, {
        fields: [table.exercice_id],
        references: [Exercice.table.id],
    }),
    set_saved_workouts: many(Set_SavedWorkout.table),
    set_workouts: many(Set_Workout.table),
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id]
    })
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;