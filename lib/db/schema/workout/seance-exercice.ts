import * as lib from "../lib";
import * as Seance from "./seance";
import * as Exercice from "./exercice";

export const table = lib.pgTable('seance_exercice', {
    id: lib.serial('id').primaryKey(),
    seance_id: lib.integer('seance_id').references(() => Seance.table.id).notNull(),
    exercice_id: lib.integer('exercice_id').references(() => Exercice.table.id).notNull(),
    position: lib.integer('position').notNull(),
    nb_series: lib.integer('nb_series').notNull(),
    created_at: lib.timestamp('created_at').notNull().defaultNow(),
    updated_at: lib.timestamp('updated_at').notNull().defaultNow(),
    deleted_at: lib.timestamp('deleted_at'),
});

export const relations = lib.relations(table, ({ one }) => ({
    seance: one(Seance.table, {
        fields: [table.seance_id],
        references: [Seance.table.id]
    }),
    exercice: one(Exercice.table, {
        fields: [table.exercice_id],
        references: [Exercice.table.id]
    })
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;