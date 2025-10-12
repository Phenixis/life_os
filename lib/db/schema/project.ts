import * as lib from "./lib";
import * as User from "./user/user";
import * as Note from "./note";
import * as Task from "./task";

export const table = lib.pgTable('project', {
    id: lib.serial('id').primaryKey(),
    user_id: lib.char('user_id', { length: 8 }).default("00000000").notNull()
        .references(() => User.table.id),
    title: lib.varchar('title', { length: 255 }).notNull(),
    description: lib.text('description'),
    completed: lib.boolean('completed').notNull().default(false),
    created_at: lib.timestamp('created_at').notNull().defaultNow(),
    updated_at: lib.timestamp('updated_at').notNull().defaultNow(),
    deleted_at: lib.timestamp('deleted_at')
});

export const relations = lib.relations(table, ({ one, many }) => ({
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id],
    }),
    notes: many(Note.Note.table),
    tasks: many(Task.Task.table),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;