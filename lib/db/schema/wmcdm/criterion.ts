import * as lib from "../lib";
import * as Matrix from "./matrix";
import * as Score from "./score";

export const table = lib.pgTable('wmcdm_criterion', {
    id: lib.serial('id').primaryKey(),
    matrix_id: lib.integer('matrix_id')
        .notNull()
        .references(() => Matrix.table.id, { onDelete: 'cascade' }),
    name: lib.varchar('name', { length: 255 }).notNull(),
    weight: lib.integer('weight').notNull().default(1),
    description: lib.text('description'),
    position: lib.integer('position').notNull(),
    created_at: lib.timestamp('created_at').notNull().defaultNow(),
    updated_at: lib.timestamp('updated_at').notNull().defaultNow(),
    deleted_at: lib.timestamp('deleted_at')
});

export const relations = lib.relations(table, ({ one, many }) => ({
    matrix: one(Matrix.table, {
        fields: [table.matrix_id],
        references: [Matrix.table.id],
    }),
    scores: many(Score.table)
}))

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;