import * as lib from "../lib";
import * as User from "../user/user"
import * as Conversation from "./conversation"

export const table = lib.pgTable(
    "ai_profile",
    {
        id: lib.char("id", { length: 12 }).primaryKey().notNull(),
        user_id: lib.char("user_id", { length: 8 })
            .notNull()
            .references(() => User.table.id, { onDelete: "cascade" }),
        name: lib.varchar("name", { length: 255 }).notNull(),
        description: lib.text("description").notNull(),
        system_prompt: lib.text("system_prompt").notNull(),
        avatar_url: lib.varchar("avatar_url", { length: 500 }),
        is_active: lib.boolean("is_active").notNull().default(true),
        created_at: lib.timestamp("created_at").notNull().defaultNow(),
        updated_at: lib.timestamp("updated_at").notNull().defaultNow(),
        deleted_at: lib.timestamp("deleted_at"),
    },
    (table) => ({
        userIdIdx: lib.index("ai_profile_user_id_idx").on(table.user_id),
        nameIdx: lib.index("ai_profile_name_idx").on(table.name),
    }),
)

export const relations = lib.relations(table, ({ one, many }) => ({
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id],
    }),
    conversations: many(Conversation.table),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;