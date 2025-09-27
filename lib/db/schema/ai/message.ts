import * as lib from "../lib";
import * as Conversation from "./conversation"

export const table = lib.pgTable(
    "message",
    {
        id: lib.char("id", { length: 12 }).primaryKey().notNull(),
        conversation_id: lib.char("conversation_id", { length: 12 })
            .notNull()
            .references(() => Conversation.table.id, { onDelete: "cascade" }),
        role: lib.varchar("role", { length: 20 }).notNull(), // 'user' or 'assistant'
        content: lib.text("content").notNull(),
        token_count: lib.integer("token_count"),
        created_at: lib.timestamp("created_at").notNull().defaultNow(),
    },
    (table) => ({
        conversationIdIdx: lib.index("message_conversation_id_idx").on(table.conversation_id),
        createdAtIdx: lib.index("message_created_at_idx").on(table.created_at),
    }),
)

export const relations = lib.relations(table, ({ one }) => ({
    conversation: one(Conversation.table, {
        fields: [table.conversation_id],
        references: [Conversation.table.id],
    }),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;