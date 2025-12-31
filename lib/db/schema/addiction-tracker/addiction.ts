import * as lib from "../lib"
import { User } from "../user";
import * as Relapse from "./relapse";
import * as Entry from "./entry";

export const table = lib.pgTable("addiction", {
    id: lib.serial("id").primaryKey(),
    user_id: lib.varchar("user_id", { length: 8 }).notNull().references(
        () => User.table.id
    ),

    title: lib.varchar("title", { length: 255 }).notNull(),
    description: lib.varchar("description", { length: 1000 }),

    created_at: lib.timestamp("created_at").notNull().defaultNow(),
    updated_at: lib.timestamp("updated_at").notNull().defaultNow(),
    deleted_at: lib.timestamp("deleted_at"),
})

export const relations = lib.relations(table, ({ one, many }) => ({
    relapses: many(Relapse.table),
    entries: many(Entry.table),
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id]
    })
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;