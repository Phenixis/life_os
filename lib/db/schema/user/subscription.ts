import * as lib from "../lib";
import * as User from "./user";

export const table = lib.pgTable('user_subscription', {
    id: lib.serial('id').primaryKey(),
    user_id: lib.char('user_id', { length: 8 }).notNull()
        .references(() => User.table.id, { onDelete: 'cascade' }),
    
    stripe_customer_id: lib.varchar('stripe_customer_id', { length: 255 }).notNull(),
    stripe_subscription_id: lib.varchar('stripe_subscription_id', { length: 255 }).notNull().unique(),
    stripe_product_id: lib.varchar('stripe_product_id', { length: 255 }).notNull(),
    stripe_price_id: lib.varchar('stripe_price_id', { length: 255 }).notNull(),
    
    status: lib.varchar('status', { length: 50 }).notNull(),
    canceled_at: lib.timestamp('canceled_at'),
    cancel_at_period_end: lib.boolean('cancel_at_period_end').notNull().default(false),
    
    created_at: lib.timestamp('created_at').notNull().defaultNow(),
    updated_at: lib.timestamp('updated_at').notNull().defaultNow()
}, (table) => ([
    lib.index('user_subscription_user_active_idx')
        .on(table.user_id, table.status),
    lib.index('user_subscription_stripe_idx')
        .on(table.stripe_subscription_id)
]));

export const relations = lib.relations(table, ({ one }) => ({
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id],
    }),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;