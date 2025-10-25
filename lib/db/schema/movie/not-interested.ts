import * as lib from "../lib";
import * as User from "../user/user";

export const table = lib.pgTable('not_interested_movie', {
    id: lib.serial('id').primaryKey(),
    user_id: lib.char('user_id', { length: 8 })
        .notNull()
        .references(() => User.table.id),
    tmdb_id: lib.integer('tmdb_id').notNull(),
    media_type: lib.varchar('media_type', { length: 10 }).notNull(), // 'movie' or 'tv'
    title: lib.varchar('title', { length: 500 }).notNull(), // Store title for reference

    created_at: lib.timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
    // Unique constraint to prevent duplicates
    uniqueUserMovie: lib.sql`UNIQUE (${table.user_id}, ${table.tmdb_id}, ${table.media_type})`
}));

export const relations = lib.relations(table, ({ one }) => ({
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id],
    }),
}))

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;