import * as lib from "../lib"
import { User } from "../user";
import * as Addiction from "./addiction";
import * as Entry from "./entry";

export const table = lib.pgTable("addiction_relapses", {
    id: lib.serial("id").primaryKey(),
    user_id: lib.varchar("user_id", { length: 8 }).notNull().references(
        () => User.table.id
    ),
    addiction_id: lib.integer("addiction_id").notNull().references(() => Addiction.table.id),

    created_at: lib.timestamp("created_at").notNull().defaultNow(), // date of the relapse
    updated_at: lib.timestamp("updated_at").notNull().defaultNow(),
    deleted_at: lib.timestamp("deleted_at"),
})

export const relations = lib.relations(table, ({ one, many }) => ({
    addiction: one(Addiction.table, {
        fields: [table.addiction_id],
        references: [Addiction.table.id]
    }),
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id]
    }),
    entry: many(Entry.table),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;