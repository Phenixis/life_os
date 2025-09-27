import * as lib from "../lib";
import * as User from "../user/user"
import * as Serie from "./serie";
import * as SeanceExercice from "./seance-exercice"

export const table = lib.pgTable('exercice', {
    user_id: lib.char('user_id', { length: 8 }).default("00000000").notNull()
        .references(() => User.table.id),
    id: lib.serial('id').primaryKey(),
    name: lib.varchar('name', { length: 255 }).notNull(),
    created_at: lib.timestamp('created_at').notNull().defaultNow(),
    updated_at: lib.timestamp('updated_at').notNull().defaultNow(),
    deleted_at: lib.timestamp('deleted_at'),
});

export const relations = lib.relations(table, ({ one, many }) => ({
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id],
    }),
    series: many(Serie.table),
    SeanceExercices: many(SeanceExercice.table),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;