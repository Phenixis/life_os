import * as lib from "./lib";
import * as Feature from "./feature";

export const table = lib.pgTable('plan_feature', {
    id: lib.serial('id').primaryKey(),
    stripe_product_id: lib.varchar('stripe_product_id', { length: 255 }).notNull(),
    feature_id: lib.integer('feature_id').notNull()
        .references(() => Feature.table.id, { onDelete: 'cascade' }),
    created_at: lib.timestamp('created_at').notNull().defaultNow()
}, (table) => ([
    // Composite primary key alternative
    lib.index('plan_feature_unique_idx').on(table.stripe_product_id, table.feature_id),
    lib.index('plan_feature_stripe_product_idx').on(table.stripe_product_id),
    lib.index('plan_feature_feature_idx').on(table.feature_id)
]));

export const relations = lib.relations(table, ({ one }) => ({
    feature: one(Feature.table, {
        fields: [table.feature_id],
        references: [Feature.table.id]
    })
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;