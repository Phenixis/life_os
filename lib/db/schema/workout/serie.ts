import * as lib from "../lib";
import * as User from "../user/user"
import * as SerieGroup from "./serie-group"
import * as Exercice from "./exercice"

export const table = lib.pgTable('serie', {
    user_id: lib.char('user_id', { length: 8 }).default("00000000").notNull()
        .references(() => User.table.id),
    id: lib.serial('id').primaryKey(),
    series_group_id: lib.integer('series_group_id').references(() => SerieGroup.table.id).notNull(),
    exercice_id: lib.integer('exercice_id').references(() => Exercice.table.id).notNull(),
    poids: lib.integer('poids'),
    reps: lib.integer('reps'),
    exercice_position: lib.integer('exercice_position').notNull(), // Premier, second, etc. exercice de la séance
    serie_position: lib.integer('serie_position').notNull(), // Première, seconde, etc. série de l'exercice
    created_at: lib.timestamp('created_at').notNull().defaultNow(),
    updated_at: lib.timestamp('updated_at').notNull().defaultNow(),
    deleted_at: lib.timestamp('deleted_at'),
});

export const relations = lib.relations(table, ({ one }) => ({
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id],
    }),
    serieGroup: one(SerieGroup.table, {
        fields: [table.series_group_id],
        references: [SerieGroup.table.id],
    }),
    exercice: one(Exercice.table, {
        fields: [table.exercice_id],
        references: [Exercice.table.id],
    }),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;