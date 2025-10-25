import * as lib from "../lib";
import * as User from "../user/user";
import * as Habit from "./habit";

export const table = lib.pgTable('habit_entry', {
    id: lib.serial('id').primaryKey(),
    habit_id: lib.integer('habit_id')
        .notNull()
        .references(() => Habit.table.id, { onDelete: 'cascade' }),
    user_id: lib.char('user_id', { length: 8 })
        .notNull()
        .references(() => User.table.id),
    date: lib.timestamp('date').notNull(), // The date when the habit was completed
    count: lib.integer('count').notNull().default(1), // How many times completed on this date
    notes: lib.text('notes'), // Optional notes for this entry
    created_at: lib.timestamp('created_at').notNull().defaultNow(),
    updated_at: lib.timestamp('updated_at').notNull().defaultNow()
});

export const relations = lib.relations(table, ({ one }) => ({
    habit: one(Habit.table, {
        fields: [table.habit_id],
        references: [Habit.table.id],
    }),
    user: one(User.table, {
        fields: [table.user_id],
        references: [User.table.id],
    }),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;