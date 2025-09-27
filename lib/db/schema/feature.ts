import * as lib from "./lib";
import * as PlanFeature from "./plan-feature";

export const table = lib.pgTable('feature', {
    id: lib.serial('id').primaryKey(),
    name: lib.varchar('name', { length: 100 }).notNull().unique(), // 'movie_tracking', 'decision_tools', etc.
    display_name: lib.varchar('display_name', { length: 150 }).notNull(), // 'Movie & Media Tracking', 'Decision Making Tools'
    description: lib.text('description'), // Detailed description for documentation

    is_paid: lib.boolean('is_paid').notNull().default(false), // Whether this feature is part of a paid plan
    is_active: lib.boolean('is_active').notNull().default(true), // For feature flags

    created_at: lib.timestamp('created_at').notNull().defaultNow(),
    updated_at: lib.timestamp('updated_at').notNull().defaultNow(),
    deleted_at: lib.timestamp('deleted_at')
}, (table) => ([
    lib.index('feature_name_idx').on(table.name),
    lib.index('feature_active_idx').on(table.is_active)
]));

export const relations = lib.relations(table, ({ many }) => ({
    plan_features: many(PlanFeature.table)
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;