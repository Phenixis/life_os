import * as lib from "../lib";
import * as User from "../user/user";
import * as Project from "../project";

export const table = lib.pgTable('note', {
    id: lib.serial('id').primaryKey(),
    user_id: lib.char('user_id', { length: 8 })
        .default("00000000")
        .notNull()
        .references(() => User.table.id),
    project_title: lib.varchar('project_title', { length: 255 })
        .references(() => Project.table.title),
    title: lib.varchar('title', { length: 255 }).notNull(),
    content: lib.text('content').notNull(),
    salt: lib.char('salt', { length: 24 }),
    iv: lib.char('iv', { length: 16 }),
    created_at: lib.timestamp('created_at').notNull().defaultNow(),
    updated_at: lib.timestamp('updated_at').notNull().defaultNow(),
    deleted_at: lib.timestamp('deleted_at'),
})

export const relations = lib.relations(table, ({ one }) => ({
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id],
    }),
    project: one(Project.table, {
        fields: [table.project_title],
        references: [Project.table.title],
    }),
}))

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;