import * as lib from "../lib";
import * as User from "../user/user"
import * as Profile from "./profile"
import * as Message from "./message"

export const table = lib.pgTable(
    "conversation",
    {
        id: lib.char("id", { length: 12 }).primaryKey().notNull(),
        user_id: lib.char("user_id", { length: 8 })
            .notNull()
            .references(() => User.table.id, { onDelete: "cascade" }),
        profile_id: lib.char("profile_id", { length: 12 })
            .notNull()
            .references(() => Profile.table.id, { onDelete: "cascade" }),
        title: lib.varchar("title", { length: 255 }).notNull(),
        is_archived: lib.boolean("is_archived").notNull().default(false),
        created_at: lib.timestamp("created_at").notNull().defaultNow(),
        updated_at: lib.timestamp("updated_at").notNull().defaultNow(),
        deleted_at: lib.timestamp("deleted_at"),
    },
    (table) => ({
        userIdIdx: lib.index("conversation_user_id_idx").on(table.user_id),
        profileIdIdx: lib.index("conversation_profile_id_idx").on(table.profile_id),
        updatedAtIdx: lib.index("conversation_updated_at_idx").on(table.updated_at),
    }),
)

export const relations = lib.relations(table, ({ one, many }) => ({
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id],
    }),
    profile: one(Profile.table, {
        fields: [table.profile_id],
        references: [Profile.table.id],
    }),
    messages: many(Message.table),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;