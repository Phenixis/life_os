import * as lib from "../lib";
import * as User from "./user";

export const table = lib.pgTable('password_reset_request', {
    id: lib.varchar('id', { length: 36 }).primaryKey().notNull(),
    user_id: lib.char('user_id', { length: 8 }).notNull().references(() => User.table.id),
    is_initial_setup: lib.boolean('is_initial_setup').notNull().default(false),
    is_resolved: lib.boolean('is_resolved').notNull().default(false),
    created_at: lib.timestamp('created_at').notNull().defaultNow(),
    expires_at: lib.timestamp('expires_at').notNull(),
    resolved_at: lib.timestamp('resolved_at'),
});

export const relations = lib.relations(table, ({ one }) => ({
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id]
    })
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;
