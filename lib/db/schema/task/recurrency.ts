import * as lib from "../lib";
import * as Task from "./task";

export const table = lib.pgTable('task_recurrency', {
    task_id: lib.integer('task_id').notNull()
    .references(() => Task.table.id).primaryKey(),

    cycle: lib.varchar('cycle', { length: 50 }).notNull(),
    interval: lib.integer('interval').notNull(),

    until: lib.timestamp('until'),
    count: lib.integer('count'),

    current_count: lib.integer('current_count').notNull().default(0),
});

export const relations = lib.relations(table, ({ one }) => ({
    task: one(Task.table, {
        fields: [table.task_id],
        references: [Task.table.id]
    })
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;

export enum Cycle {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly",
    YEARLY = "yearly"
}

export type RecurrentTask = {task_recurrency: Select, task: Task.Select};