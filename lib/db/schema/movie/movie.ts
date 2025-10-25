import * as lib from "../lib";
import * as User from "../user/user"

export const table = lib.pgTable('movie', {
    id: lib.serial('id').primaryKey(),
    user_id: lib.char('user_id', { length: 8 })
        .default("00000000")
        .notNull()
        .references(() => User.table.id),
    tmdb_id: lib.integer('tmdb_id').notNull(),
    media_type: lib.varchar('media_type', { length: 10 }).notNull(), // 'movie' or 'tv'
    title: lib.varchar('title', { length: 500 }).notNull(),
    overview: lib.text('overview'),
    poster_path: lib.varchar('poster_path', { length: 500 }),
    backdrop_path: lib.varchar('backdrop_path', { length: 500 }),
    release_date: lib.varchar('release_date', { length: 20 }),
    vote_average: lib.real('vote_average'),
    vote_count: lib.integer('vote_count'),
    popularity: lib.real('popularity'),
    original_language: lib.varchar('original_language', { length: 10 }),
    genres: lib.text('genres'), // JSON string array
    runtime: lib.integer('runtime'), // in minutes
    status: lib.varchar('status', { length: 50 }), // released, upcoming, etc.

    // User tracking fields
    user_rating: lib.real('user_rating'), // 0.5 to 5.0 by 0.5 increments
    user_comment: lib.text('user_comment'),
    watch_status: lib.varchar('watch_status', { length: 20 }).notNull().default('will_watch'), // 'will_watch', 'watched', 'watch_again'
    watched_date: lib.timestamp('watched_date'),

    created_at: lib.timestamp('created_at').notNull().defaultNow(),
    updated_at: lib.timestamp('updated_at').notNull().defaultNow(),
    deleted_at: lib.timestamp('deleted_at')
});

export const relations = lib.relations(table, ({ one }) => ({
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id],
    }),
}))

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;