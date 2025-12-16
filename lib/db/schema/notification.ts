import * as lib from "./lib";
import * as User from "./user/user";

export const table = lib.pgTable('notification', {
    id: lib.serial('id').primaryKey(),
    user_id: lib.char('user_id', { length: 8 }).default("00000000").notNull()
        .references(() => User.table.id),
    
    // Notification type: 'daily_mood_morning', 'daily_mood_evening', 'friend_watchlist', etc.
    type: lib.varchar('type', { length: 50 }).notNull(),
    
    title: lib.varchar('title', { length: 255 }).notNull(),
    message: lib.text('message').notNull(),
    
    // For event-based notifications, this can be null (show immediately)
    // For time-based notifications, this is when to show it
    scheduled_for: lib.timestamp('scheduled_for'),
    
    // User interaction flags
    read: lib.boolean('read').notNull().default(false),
    dismissed: lib.boolean('dismissed').notNull().default(false),
    
    // Optional metadata for context (e.g., movie_id, friend_id, etc.)
    metadata: lib.text('metadata'), // JSON string
    
    created_at: lib.timestamp('created_at').notNull().defaultNow(),
    updated_at: lib.timestamp('updated_at').notNull().defaultNow(),
    deleted_at: lib.timestamp('deleted_at')
});

export const relations = lib.relations(table, ({ one }) => ({
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id],
    }),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;
