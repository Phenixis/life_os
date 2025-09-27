import * as lib from "../lib";
import { Task, Project, Note, Workout,DailyMood, Meteo, Movie, WMCDM, Habit, Ai } from "..";
import * as Subscription from "./subscription";

export const table = lib.pgTable('user', {
    id: lib.char('id', { length: 8 }).primaryKey().notNull(),
    email: lib.varchar('email', { length: 255 }).notNull(),
    password: lib.varchar('password', { length: 255 }).notNull(),
    first_name: lib.varchar('first_name', { length: 255 }).notNull(),
    last_name: lib.varchar('last_name', { length: 255 }).notNull(),
    api_key: lib.varchar('api_key', { length: 255 }).notNull(),

    has_jarvis_asked_dark_mode: lib.boolean('has_jarvis_asked_dark_mode').notNull().default(false),
    dark_mode_activated: lib.boolean('dark_mode_activated').notNull().default(false),
    auto_dark_mode_enabled: lib.boolean('auto_dark_mode_enabled').notNull().default(true),
    dark_mode_start_hour: lib.integer('dark_mode_start_hour').notNull().default(19),
    dark_mode_end_hour: lib.integer('dark_mode_end_hour').notNull().default(6),
    dark_mode_start_minute: lib.integer('dark_mode_start_minute').notNull().default(0),
    dark_mode_end_minute: lib.integer('dark_mode_end_minute').notNull().default(0),
    dark_mode_override: lib.boolean('dark_mode_override').notNull().default(false),

    note_draft_title: lib.varchar('note_draft_title', { length: 255 }).notNull().default(""),
    note_draft_content: lib.text('note_draft_content').notNull().default(""),
    note_draft_project_title: lib.varchar('note_draft_project_title', { length: 255 }).notNull().default(""),
    
    stripe_customer_id: lib.varchar('stripe_customer_id', { length: 255 }),

    created_at: lib.timestamp('created_at').notNull().defaultNow(),
    updated_at: lib.timestamp('updated_at').notNull().defaultNow(),
    deleted_at: lib.timestamp('deleted_at')
});

export const relations = lib.relations(table, ({ many }) => ({
    tasks: many(Task.Task.table),
    projects: many(Project.table),
    notes: many(Note.Note.table),
    exercices: many(Workout.Exercice.table),
    seances: many(Workout.Seance.table),
    workouts: many(Workout.Workout.table),
    series: many(Workout.Serie.table),
    dailyMoods: many(DailyMood.table),
    meteo: many(Meteo.table),
    seriesGroups: many(Workout.SerieGroup.table),
    seanceExercices: many(Workout.SeanceExercice.table),
    movies: many(Movie.Movie.table),
    notInterestedMovies: many(Movie.NotInterested.table),
    wmcdmMatrices: many(WMCDM.Matrix.table),
    habits: many(Habit.Habit.table),
    habitEntries: many(Habit.Entry.table),
    aiProfiles: many(Ai.Profile.table),
    conversations: many(Ai.Conversation.table),
    subscriptions: many(Subscription.table),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;