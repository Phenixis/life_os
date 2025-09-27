import * as lib from "../lib";
import * as User from "../user/user";
import * as Importance from "./importance";
import * as Duration from "./duration";
import * as Project from "../project";
import * as TaskToDoAfter from "./to-do-after";

export const table = lib.pgTable('task', {
    user_id: lib.char('user_id', { length: 8 }).default("00000000").notNull()
        .references(() => User.table.id),
    id: lib.serial('id').primaryKey(),
    title: lib.varchar('title', { length: 255 }).notNull(),
    importance: lib.integer('importance')
        .notNull()
        .default(0)
        .references(() => Importance.table.level),
    urgency: lib.integer('urgency').notNull().default(0),
    duration: lib.integer('duration')
        .notNull()
        .default(0)
        .references(() => Duration.table.level),
    score: lib.integer('score').notNull().default(0),
    due: lib.timestamp('due').notNull().defaultNow(),
    project_title: lib.varchar('project_title', { length: 255 })
        .references(() => Project.table.title),
    completed_at: lib.timestamp('completed_at'),
    created_at: lib.timestamp('created_at').notNull().defaultNow(),
    updated_at: lib.timestamp('updated_at').notNull().defaultNow(),
    deleted_at: lib.timestamp('deleted_at'),
});

export const relations = lib.relations(table, ({ one, many }) => ({
    project: one(Project.table, {
        fields: [table.project_title],
        references: [Project.table.title]
    }),
    taskAfter: many(TaskToDoAfter.table),
    taskBefore: many(TaskToDoAfter.table),
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id]
    })
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;
export type TaskWithNonRecursiveRelations = Select & { project: Project.Select | null; importanceDetails: Importance.Select; durationDetails: Duration.Select; tasksToDoAfter: TaskToDoAfter.Select[] | null, tasksToDoBefore: TaskToDoAfter.Select[] | null, recursive: false };
export type TaskWithRelations = Select & { project: Project.Select | null; importanceDetails: Importance.Select; durationDetails: Duration.Select; tasksToDoAfter: TaskWithNonRecursiveRelations[] | null, tasksToDoBefore: TaskWithNonRecursiveRelations[] | null, recursive: true };
