import * as lib from "../lib";
import * as User from "../user/user";
import * as Seance from "./seance";
import * as SerieGroup from "./serie-group"

export const table = lib.pgTable('workout', {
    user_id: lib.char('user_id', { length: 8 }).default("00000000").notNull()
        .references(() => User.table.id),
    id: lib.serial('id').primaryKey(),
    date: lib.timestamp('date').notNull().defaultNow(),
    note: lib.integer('note'),
    comment: lib.text('comment'),
    seance_id: lib.integer('seance_id').references(() => Seance.table.id),
    created_at: lib.timestamp('created_at').notNull().defaultNow(),
    updated_at: lib.timestamp('updated_at').notNull().defaultNow(),
    deleted_at: lib.timestamp('deleted_at'),
});

export const relations = lib.relations(table, ({ one, many }) => ({
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id],
    }),
    seance: one(Seance.table, {
        fields: [table.seance_id],
        references: [Seance.table.id],
    }),
    seriesGroups: many(SerieGroup.table),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;