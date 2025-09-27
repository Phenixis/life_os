import * as lib from './lib';
import * as User from './user/user';

export const table = lib.pgTable('meteo', {
    user_id: lib.char('user_id', { length: 8 }).default("00000000").notNull()
        .references(() => User.table.id),
    day: lib.varchar('day', { length: 10 }).primaryKey(),
    latitude: lib.varchar('latitude', { length: 10 }).default("-1").notNull(),
    longitude: lib.varchar('longitude', { length: 10 }).default("-1").notNull(),
    temperature: lib.integer('temperature').notNull(),
    summary: lib.varchar('summary', { length: 255 }).notNull(),
    icon: lib.varchar('icon', { length: 255 }).notNull(),
    created_at: lib.timestamp('created_at').notNull().defaultNow(),
    updated_at: lib.timestamp('updated_at').notNull().defaultNow(),
    deleted_at: lib.timestamp('deleted_at')
});

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;