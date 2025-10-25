import * as lib from "./lib";
import * as User from "./user/user";

export const table = lib.pgTable('daily_mood', {
    id: lib.serial('id').primaryKey(),
    user_id: lib.char('user_id', { length: 8 }).default("00000000").notNull()
        .references(() => User.table.id),
    date: lib.timestamp('date').notNull().defaultNow(),
    mood: lib.integer('mood').notNull().default(-1),
    comment: lib.varchar('comment', { length: 5000 }).notNull().default(""),
    created_at: lib.timestamp('created_at').notNull().defaultNow(),
    updated_at: lib.timestamp('updated_at').notNull().defaultNow(),
    deleted_at: lib.timestamp('deleted_at')
});

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;