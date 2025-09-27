import * as lib from "../lib";
import * as Task from "./task";

export const table = lib.pgTable('task_to_do_after', {
    id: lib.serial('id').primaryKey(),
    task_id: lib.integer('task_id')
        .notNull()
        .references(() => Task.table.id),
    after_task_id: lib.integer('after_task_id')
        .notNull()
        .references(() => Task.table.id),
    created_at: lib.timestamp('created_at').notNull().defaultNow(),
    updated_at: lib.timestamp('updated_at').notNull().defaultNow(),
    deleted_at: lib.timestamp('deleted_at')
});

export const relations = lib.relations(table, ({ many }) => ({
    tasks: many(Task.table)
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;