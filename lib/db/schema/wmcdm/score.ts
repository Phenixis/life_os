import * as lib from "../lib";
import * as Matrix from "./matrix";
import * as Option from "./option";
import * as Criterion from "./criterion";

export const table = lib.pgTable('wmcdm_score', {
    id: lib.serial('id').primaryKey(),
    matrix_id: lib.integer('matrix_id')
        .notNull()
        .references(() => Matrix.table.id, { onDelete: 'cascade' }),
    option_id: lib.integer('option_id')
        .notNull()
        .references(() => Option.table.id, { onDelete: 'cascade' }),
    criterion_id: lib.integer('criterion_id')
        .notNull()
        .references(() => Criterion.table.id, { onDelete: 'cascade' }),
    score: lib.integer('score').notNull().default(0),
    created_at: lib.timestamp('created_at').notNull().defaultNow(),
    updated_at: lib.timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
    // Unique constraint to prevent duplicate scores for the same option-criterion pair
    uniqueOptionCriterion: lib.sql`UNIQUE (${table.option_id}, ${table.criterion_id})`
}));

export const relations = lib.relations(table, ({ one }) => ({
    matrix: one(Matrix.table, {
        fields: [table.matrix_id],
        references: [Matrix.table.id],
    }),
    option: one(Option.table, {
        fields: [table.option_id],
        references: [Option.table.id],
    }),
    criterion: one(Criterion.table, {
        fields: [table.criterion_id],
        references: [Criterion.table.id],
    }),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;