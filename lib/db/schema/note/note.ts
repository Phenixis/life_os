import * as lib from "../lib";
import * as User from "../user/user";
import * as Project from "../project";

export const table = lib.pgTable('note', {
    id: lib.serial('id').primaryKey(),
    user_id: lib.char('user_id', {length: 8})
        .default("00000000")
        .notNull()
        .references(() => User.table.id),

    project_id: lib.integer('project_id')
        .references(() => Project.table.id),

    title: lib.varchar('title', {length: 255}).notNull(),
    content: lib.text('content').notNull(),
    salt: lib.char('salt', {length: 24}),
    iv: lib.char('iv', {length: 16}),
    share_token: lib.varchar('share_token', {length: 32}).unique(),
    created_at: lib.timestamp('created_at').notNull().defaultNow(),
    updated_at: lib.timestamp('updated_at').notNull().defaultNow(),
    deleted_at: lib.timestamp('deleted_at'),
})

export const relations = lib.relations(table, ({one}) => ({
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id],
    }),
    project: one(Project.table, {
        fields: [table.project_id],
        references: [Project.table.id],
    }),
}))

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;