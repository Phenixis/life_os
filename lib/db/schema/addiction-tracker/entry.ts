import * as lib from "../lib"
import { User } from "../user";
import * as Addiction from "./addiction";
import * as Relapse from "./relapse";

export const table = lib.pgTable("addiction_entries", {
    id: lib.serial("id").primaryKey(),
    user_id: lib.varchar("user_id", { length: 8 }).notNull().references(
        () => User.table.id
    ),
    addiction_id: lib.integer("addiction_id").notNull().references(() => Addiction.table.id),

    content: lib.varchar("content", { length: 250 }).notNull(),
    relapse_id: lib.integer("relapse_id").references(() => Relapse.table.id),

    created_at: lib.timestamp("created_at").notNull().defaultNow(), // date of the entry
    updated_at: lib.timestamp("updated_at").notNull().defaultNow(),
    deleted_at: lib.timestamp("deleted_at"),
})

export const relations = lib.relations(table, ({ one, many }) => ({
    addiction: one(Addiction.table, {
        fields: [table.addiction_id],
        references: [Addiction.table.id]
    }),
    relapse: one(Relapse.table, {
        fields: [table.relapse_id],
        references: [Relapse.table.id]
    }),
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id]
    })
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;