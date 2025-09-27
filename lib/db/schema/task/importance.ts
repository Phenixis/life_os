import * as lib from "../lib";

export const table = lib.pgTable('importance', {
    level: lib.integer("level").primaryKey(),
    name: lib.varchar("name", { length: 50 }).notNull(),
})

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;