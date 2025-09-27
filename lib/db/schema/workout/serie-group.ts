import * as lib from "../lib";
import * as Workout from "./workout";
import * as Serie from "./serie"

export const table = lib.pgTable('series_group', {
    id: lib.serial('id').primaryKey(),
    workout_id: lib.integer('workout_id').references(() => Workout.table.id).notNull(),
    created_at: lib.timestamp('created_at').notNull().defaultNow(),
    updated_at: lib.timestamp('updated_at').notNull().defaultNow(),
    deleted_at: lib.timestamp('deleted_at'),
});

export const relations = lib.relations(table, ({ one, many }) => ({
    workout: one(Workout.table, {
        fields: [table.workout_id],
        references: [Workout.table.id],
    }),
    series: many(Serie.table),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;