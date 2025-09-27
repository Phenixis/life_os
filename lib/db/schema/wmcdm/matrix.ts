import * as lib from "../lib";
import * as User from "../user/user";
import * as Criterion from "./criterion";
import * as Option from "./option";
import * as Score from "./score";

export const table = lib.pgTable('wmcdm_matrix', {
    id: lib.serial('id').primaryKey(),
    user_id: lib.char('user_id', { length: 8 })
        .notNull()
        .references(() => User.table.id),
    name: lib.varchar('name', { length: 255 }).notNull(),
    description: lib.text('description'),
    created_at: lib.timestamp('created_at').notNull().defaultNow(),
    updated_at: lib.timestamp('updated_at').notNull().defaultNow(),
    deleted_at: lib.timestamp('deleted_at')
});

export const relations = lib.relations(table, ({ one, many }) => ({
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id],
    }),
    criteria: many(Criterion.table),
    options: many(Option.table),
    scores: many(Score.table)
}))

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;