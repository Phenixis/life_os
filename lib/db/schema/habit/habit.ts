import * as lib from "../lib";
import * as User from "../user/user";
import * as Entry from "./entry";

export const table = lib.pgTable('habit', {
    id: lib.serial('id').primaryKey(),
    user_id: lib.char('user_id', { length: 8 })
        .notNull()
        .references(() => User.table.id),
    title: lib.varchar('title', { length: 255 }).notNull(),
    description: lib.text('description'),
    color: lib.varchar('color', { length: 50 }).notNull().default('blue'), // From predefined color set
    icon: lib.varchar('icon', { length: 50 }).notNull().default('star'), // Lucide icon name
    frequency: lib.varchar('frequency', { length: 20 }).notNull().default('daily'), // 'daily', 'weekly', 'monthly', 'yearly'
    target_count: lib.integer('target_count').notNull().default(1), // How many times per frequency period
    is_active: lib.boolean('is_active').notNull().default(true),
    created_at: lib.timestamp('created_at').notNull().defaultNow(),
    updated_at: lib.timestamp('updated_at').notNull().defaultNow(),
    deleted_at: lib.timestamp('deleted_at')
});

export const relations = lib.relations(table, ({ one, many }) => ({
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id],
    }),
    entries: many(Entry.table)
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;