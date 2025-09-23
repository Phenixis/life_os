import {
    pgTable,
    serial,
    char,
    varchar,
    text,
    timestamp,
    integer,
    boolean,
    real,
    index
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const user = pgTable('user', {
    id: char('id', { length: 8 }).primaryKey().notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    first_name: varchar('first_name', { length: 255 }).notNull(),
    last_name: varchar('last_name', { length: 255 }).notNull(),
    api_key: varchar('api_key', { length: 255 }).notNull(),

    has_jarvis_asked_dark_mode: boolean('has_jarvis_asked_dark_mode').notNull().default(false),
    dark_mode_activated: boolean('dark_mode_activated').notNull().default(false),
    auto_dark_mode_enabled: boolean('auto_dark_mode_enabled').notNull().default(true),
    dark_mode_start_hour: integer('dark_mode_start_hour').notNull().default(19),
    dark_mode_end_hour: integer('dark_mode_end_hour').notNull().default(6),
    dark_mode_start_minute: integer('dark_mode_start_minute').notNull().default(0),
    dark_mode_end_minute: integer('dark_mode_end_minute').notNull().default(0),
    dark_mode_override: boolean('dark_mode_override').notNull().default(false),

    note_draft_title: varchar('note_draft_title', { length: 255 }).notNull().default(""),
    note_draft_content: text('note_draft_content').notNull().default(""),
    note_draft_project_title: varchar('note_draft_project_title', { length: 255 }).notNull().default(""),
    
    stripe_customer_id: varchar('stripe_customer_id', { length: 255 }),

    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
    deleted_at: timestamp('deleted_at')
});

export const feature = pgTable('feature', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(), // 'movie_tracking', 'decision_tools', etc.
    display_name: varchar('display_name', { length: 150 }).notNull(), // 'Movie & Media Tracking', 'Decision Making Tools'
    description: text('description'), // Detailed description for documentation

    is_paid: boolean('is_paid').notNull().default(false), // Whether this feature is part of a paid plan
    is_active: boolean('is_active').notNull().default(true), // For feature flags

    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
    deleted_at: timestamp('deleted_at')
}, (table) => ([
    index('feature_name_idx').on(table.name),
    index('feature_active_idx').on(table.is_active)
]));

export const planFeature = pgTable('plan_feature', {
    id: serial('id').primaryKey(),
    stripe_product_id: varchar('stripe_product_id', { length: 255 }).notNull(),
    feature_id: integer('feature_id').notNull()
        .references(() => feature.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at').notNull().defaultNow()
}, (table) => ([
    // Composite primary key alternative
    index('plan_feature_unique_idx').on(table.stripe_product_id, table.feature_id),
    index('plan_feature_stripe_product_idx').on(table.stripe_product_id),
    index('plan_feature_feature_idx').on(table.feature_id)
]));

export const userSubscription = pgTable('user_subscription', {
    id: serial('id').primaryKey(),
    user_id: char('user_id', { length: 8 }).notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    
    stripe_customer_id: varchar('stripe_customer_id', { length: 255 }).notNull(),
    stripe_subscription_id: varchar('stripe_subscription_id', { length: 255 }).notNull().unique(),
    stripe_product_id: varchar('stripe_product_id', { length: 255 }).notNull(),
    stripe_price_id: varchar('stripe_price_id', { length: 255 }).notNull(),
    
    status: varchar('status', { length: 50 }).notNull(),
    canceled_at: timestamp('canceled_at'),
    cancel_at_period_end: boolean('cancel_at_period_end').notNull().default(false),
    
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow()
}, (table) => ([
    index('user_subscription_user_active_idx')
        .on(table.user_id, table.status),
    index('user_subscription_stripe_idx')
        .on(table.stripe_subscription_id)
]));

export const importance = pgTable('importance', {
    level: integer("level").primaryKey(),
    name: varchar("name", { length: 50 }).notNull(),
})

export const duration = pgTable('duration', {
    level: integer("level").primaryKey(),
    name: varchar("name", { length: 50 }).notNull(),
})

// Table DailyMood
export const dailyMood = pgTable('daily_mood', {
    id: serial('id').primaryKey(),
    user_id: char('user_id', { length: 8 }).default("00000000").notNull()
        .references(() => user.id),
    date: timestamp('date').notNull().defaultNow(),
    mood: integer('mood').notNull().default(-1),
    comment: varchar('comment', { length: 5000 }).notNull().default(""),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
    deleted_at: timestamp('deleted_at')
});

// Table Project
export const project = pgTable('project', {
    user_id: char('user_id', { length: 8 }).default("00000000").notNull()
        .references(() => user.id),
    title: varchar('title', { length: 255 }).primaryKey(),
    description: text('description'),
    completed: boolean('completed').notNull().default(false),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
    deleted_at: timestamp('deleted_at')
});

// Table Task
export const task = pgTable('task', {
    user_id: char('user_id', { length: 8 }).default("00000000").notNull()
        .references(() => user.id),
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    importance: integer('importance')
        .notNull()
        .default(0)
        .references(() => importance.level),
    urgency: integer('urgency').notNull().default(0),
    duration: integer('duration')
        .notNull()
        .default(0)
        .references(() => duration.level),
    score: integer('score').notNull().default(0),
    due: timestamp('due').notNull().defaultNow(),
    project_title: varchar('project_title', { length: 255 })
        .references(() => project.title),
    completed_at: timestamp('completed_at'),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
    deleted_at: timestamp('deleted_at'),
});

// This table is used to manage the tasks that need to be done after a specific task
// So, after_task_id has to be done before task_id
export const taskToDoAfter = pgTable('task_to_do_after', {
    id: serial('id').primaryKey(),
    task_id: integer('task_id')
        .notNull()
        .references(() => task.id),
    after_task_id: integer('after_task_id')
        .notNull()
        .references(() => task.id),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
    deleted_at: timestamp('deleted_at')
});

// Table for task recurrence settings
export const taskRecurrence = pgTable('task_recurrence', {
    id: serial('id').primaryKey(),
    task_id: integer('task_id')
        .notNull()
        .references(() => task.id, { onDelete: 'cascade' }),
    user_id: char('user_id', { length: 8 })
        .notNull()
        .references(() => user.id),
    recurrence_type: varchar('recurrence_type', { length: 20 })
        .notNull()
        .default('none'), // 'none', 'daily', 'weekly', 'monthly', 'yearly'
    recurrence_interval: integer('recurrence_interval')
        .notNull()
        .default(1), // every X days/weeks/months/years
    parent_task_id: integer('parent_task_id')
        .references(() => task.id), // links to the original template task
    is_template: boolean('is_template')
        .notNull()
        .default(false), // marks the original template task
    next_due_date: timestamp('next_due_date'), // when the next occurrence should be created
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
    deleted_at: timestamp('deleted_at')
});


// Table Meteo
export const meteo = pgTable('meteo', {
    user_id: char('user_id', { length: 8 }).default("00000000").notNull()
        .references(() => user.id),
    day: varchar('day', { length: 10 }).primaryKey(),
    latitude: varchar('latitude', { length: 10 }).default("-1").notNull(),
    longitude: varchar('longitude', { length: 10 }).default("-1").notNull(),
    temperature: integer('temperature').notNull(),
    summary: varchar('summary', { length: 255 }).notNull(),
    icon: varchar('icon', { length: 255 }).notNull(),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
    deleted_at: timestamp('deleted_at')
});


// Workouts

// Table Exercice
export const exercice = pgTable('exercice', {
    user_id: char('user_id', { length: 8 }).default("00000000").notNull()
        .references(() => user.id),
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
    deleted_at: timestamp('deleted_at'),
});

// Table Séance (Modèle de Workout)
export const seance = pgTable('seance', {
    user_id: char('user_id', { length: 8 }).default("00000000").notNull()
        .references(() => user.id),
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
    deleted_at: timestamp('deleted_at'),
});

// Table Séance_Exercice (Exercices d'un modèle de séance)
export const seanceExercice = pgTable('seance_exercice', {
    id: serial('id').primaryKey(),
    seance_id: integer('seance_id').references(() => seance.id).notNull(),
    exercice_id: integer('exercice_id').references(() => exercice.id).notNull(),
    position: integer('position').notNull(),
    nb_series: integer('nb_series').notNull(),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
    deleted_at: timestamp('deleted_at'),
});

// Table Workout (Séance Réelle)
export const workout = pgTable('workout', {
    user_id: char('user_id', { length: 8 }).default("00000000").notNull()
        .references(() => user.id),
    id: serial('id').primaryKey(),
    date: timestamp('date').notNull().defaultNow(),
    note: integer('note'),
    comment: text('comment'),
    seance_id: integer('seance_id').references(() => seance.id),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
    deleted_at: timestamp('deleted_at'),
});

// Table Series_Group (Groupe de séries pour super-set, etc.)
export const seriesGroup = pgTable('series_group', {
    id: serial('id').primaryKey(),
    workout_id: integer('workout_id').references(() => workout.id).notNull(),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
    deleted_at: timestamp('deleted_at'),
});

// Table Série (Séries des exercices du workout)
export const serie = pgTable('serie', {
    user_id: char('user_id', { length: 8 }).default("00000000").notNull()
        .references(() => user.id),
    id: serial('id').primaryKey(),
    series_group_id: integer('series_group_id').references(() => seriesGroup.id).notNull(),
    exercice_id: integer('exercice_id').references(() => exercice.id).notNull(),
    poids: integer('poids'),
    reps: integer('reps'),
    exercice_position: integer('exercice_position').notNull(), // Premier, second, etc. exercice de la séance
    serie_position: integer('serie_position').notNull(), // Première, seconde, etc. série de l'exercice
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
    deleted_at: timestamp('deleted_at'),
});

export const note = pgTable('note', {
    id: serial('id').primaryKey(),
    user_id: char('user_id', { length: 8 })
        .default("00000000")
        .notNull()
        .references(() => user.id),
    project_title: varchar('project_title', { length: 255 })
        .references(() => project.title),
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content').notNull(),
    salt: char('salt', { length: 24 }),
    iv: char('iv', { length: 16 }),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
    deleted_at: timestamp('deleted_at'),
});

// Movie Tracker Tables
export const movie = pgTable('movie', {
    id: serial('id').primaryKey(),
    user_id: char('user_id', { length: 8 })
        .default("00000000")
        .notNull()
        .references(() => user.id),
    tmdb_id: integer('tmdb_id').notNull(),
    media_type: varchar('media_type', { length: 10 }).notNull(), // 'movie' or 'tv'
    title: varchar('title', { length: 500 }).notNull(),
    overview: text('overview'),
    poster_path: varchar('poster_path', { length: 500 }),
    backdrop_path: varchar('backdrop_path', { length: 500 }),
    release_date: varchar('release_date', { length: 20 }),
    vote_average: real('vote_average'),
    vote_count: integer('vote_count'),
    popularity: real('popularity'),
    original_language: varchar('original_language', { length: 10 }),
    genres: text('genres'), // JSON string array
    runtime: integer('runtime'), // in minutes
    status: varchar('status', { length: 50 }), // released, upcoming, etc.

    // User tracking fields
    user_rating: real('user_rating'), // 0.5 to 5.0 by 0.5 increments
    user_comment: text('user_comment'),
    watch_status: varchar('watch_status', { length: 20 }).notNull().default('will_watch'), // 'will_watch', 'watched', 'watch_again'
    watched_date: timestamp('watched_date'),

    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
    deleted_at: timestamp('deleted_at')
});

// Table to track movies/shows the user is not interested in
export const notInterestedMovie = pgTable('not_interested_movie', {
    id: serial('id').primaryKey(),
    user_id: char('user_id', { length: 8 })
        .notNull()
        .references(() => user.id),
    tmdb_id: integer('tmdb_id').notNull(),
    media_type: varchar('media_type', { length: 10 }).notNull(), // 'movie' or 'tv'
    title: varchar('title', { length: 500 }).notNull(), // Store title for reference

    created_at: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
    // Unique constraint to prevent duplicates
    uniqueUserMovie: sql`UNIQUE (${table.user_id}, ${table.tmdb_id}, ${table.media_type})`
}));


// Habit Tracker Tables
export const habit = pgTable('habit', {
    id: serial('id').primaryKey(),
    user_id: char('user_id', { length: 8 })
        .notNull()
        .references(() => user.id),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    color: varchar('color', { length: 50 }).notNull().default('blue'), // From predefined color set
    icon: varchar('icon', { length: 50 }).notNull().default('star'), // Lucide icon name
    frequency: varchar('frequency', { length: 20 }).notNull().default('daily'), // 'daily', 'weekly', 'monthly', 'yearly'
    target_count: integer('target_count').notNull().default(1), // How many times per frequency period
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
    deleted_at: timestamp('deleted_at')
});

export const habitEntry = pgTable('habit_entry', {
    id: serial('id').primaryKey(),
    habit_id: integer('habit_id')
        .notNull()
        .references(() => habit.id, { onDelete: 'cascade' }),
    user_id: char('user_id', { length: 8 })
        .notNull()
        .references(() => user.id),
    date: timestamp('date').notNull(), // The date when the habit was completed
    count: integer('count').notNull().default(1), // How many times completed on this date
    notes: text('notes'), // Optional notes for this entry
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow()
});

// WMCDM (Weighted Multi-Criteria Decision Matrix) Tables
export const wmcdmMatrix = pgTable('wmcdm_matrix', {
    id: serial('id').primaryKey(),
    user_id: char('user_id', { length: 8 })
        .notNull()
        .references(() => user.id),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
    deleted_at: timestamp('deleted_at')
});

export const wmcdmCriterion = pgTable('wmcdm_criterion', {
    id: serial('id').primaryKey(),
    matrix_id: integer('matrix_id')
        .notNull()
        .references(() => wmcdmMatrix.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    weight: integer('weight').notNull().default(1),
    description: text('description'),
    position: integer('position').notNull(),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
    deleted_at: timestamp('deleted_at')
});

export const wmcdmOption = pgTable('wmcdm_option', {
    id: serial('id').primaryKey(),
    matrix_id: integer('matrix_id')
        .notNull()
        .references(() => wmcdmMatrix.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    position: integer('position').notNull(),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
    deleted_at: timestamp('deleted_at')
});

export const wmcdmScore = pgTable('wmcdm_score', {
    id: serial('id').primaryKey(),
    matrix_id: integer('matrix_id')
        .notNull()
        .references(() => wmcdmMatrix.id, { onDelete: 'cascade' }),
    option_id: integer('option_id')
        .notNull()
        .references(() => wmcdmOption.id, { onDelete: 'cascade' }),
    criterion_id: integer('criterion_id')
        .notNull()
        .references(() => wmcdmCriterion.id, { onDelete: 'cascade' }),
    score: integer('score').notNull().default(0),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
    // Unique constraint to prevent duplicate scores for the same option-criterion pair
    uniqueOptionCriterion: sql`UNIQUE (${table.option_id}, ${table.criterion_id})`
}));

// AI Profiles table
export const aiProfile = pgTable(
    "ai_profile",
    {
        id: char("id", { length: 12 }).primaryKey().notNull(),
        user_id: char("user_id", { length: 8 })
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        name: varchar("name", { length: 255 }).notNull(),
        description: text("description").notNull(),
        system_prompt: text("system_prompt").notNull(),
        avatar_url: varchar("avatar_url", { length: 500 }),
        is_active: boolean("is_active").notNull().default(true),
        created_at: timestamp("created_at").notNull().defaultNow(),
        updated_at: timestamp("updated_at").notNull().defaultNow(),
        deleted_at: timestamp("deleted_at"),
    },
    (table) => ({
        userIdIdx: index("ai_profile_user_id_idx").on(table.user_id),
        nameIdx: index("ai_profile_name_idx").on(table.name),
    }),
)

// Conversations table
export const conversation = pgTable(
    "conversation",
    {
        id: char("id", { length: 12 }).primaryKey().notNull(),
        user_id: char("user_id", { length: 8 })
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        profile_id: char("profile_id", { length: 12 })
            .notNull()
            .references(() => aiProfile.id, { onDelete: "cascade" }),
        title: varchar("title", { length: 255 }).notNull(),
        is_archived: boolean("is_archived").notNull().default(false),
        created_at: timestamp("created_at").notNull().defaultNow(),
        updated_at: timestamp("updated_at").notNull().defaultNow(),
        deleted_at: timestamp("deleted_at"),
    },
    (table) => ({
        userIdIdx: index("conversation_user_id_idx").on(table.user_id),
        profileIdIdx: index("conversation_profile_id_idx").on(table.profile_id),
        updatedAtIdx: index("conversation_updated_at_idx").on(table.updated_at),
    }),
)

// Messages table
export const message = pgTable(
    "message",
    {
        id: char("id", { length: 12 }).primaryKey().notNull(),
        conversation_id: char("conversation_id", { length: 12 })
            .notNull()
            .references(() => conversation.id, { onDelete: "cascade" }),
        role: varchar("role", { length: 20 }).notNull(), // 'user' or 'assistant'
        content: text("content").notNull(),
        token_count: integer("token_count"),
        created_at: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => ({
        conversationIdIdx: index("message_conversation_id_idx").on(table.conversation_id),
        createdAtIdx: index("message_created_at_idx").on(table.created_at),
    }),
)

// Relations
export const userRelations = relations(user, ({ many }) => ({
    tasks: many(task),
    projects: many(project),
    notes: many(note),
    exercices: many(exercice),
    seances: many(seance),
    workouts: many(workout),
    series: many(serie),
    dailyMoods: many(dailyMood),
    meteo: many(meteo),
    seriesGroups: many(seriesGroup),
    seanceExercices: many(seanceExercice),
    movies: many(movie),
    notInterestedMovies: many(notInterestedMovie),
    wmcdmMatrices: many(wmcdmMatrix),
    habits: many(habit),
    habitEntries: many(habitEntry),
    aiProfiles: many(aiProfile),
    conversations: many(conversation),
    subscriptions: many(userSubscription),
}));

export const featureRelations = relations(feature, ({ many }) => ({
    planFeatures: many(planFeature),
}));

export const planFeatureRelations = relations(planFeature, ({ one }) => ({
    feature: one(feature, {
        fields: [planFeature.feature_id],
        references: [feature.id],
    }),
}));

export const userSubscriptionRelations = relations(userSubscription, ({ one }) => ({
    user: one(user, {
        fields: [userSubscription.user_id],
        references: [user.id],
    }),
}));

export const aiProfileRelations = relations(aiProfile, ({ one, many }) => ({
  user: one(user, {
    fields: [aiProfile.user_id],
    references: [user.id],
  }),
  conversations: many(conversation),
}))

export const conversationRelations = relations(conversation, ({ one, many }) => ({
  user: one(user, {
    fields: [conversation.user_id],
    references: [user.id],
  }),
  profile: one(aiProfile, {
    fields: [conversation.profile_id],
    references: [aiProfile.id],
  }),
  messages: many(message),
}))

export const messageRelations = relations(message, ({ one }) => ({
  conversation: one(conversation, {
    fields: [message.conversation_id],
    references: [conversation.id],
  }),
}))

export const projectRelations = relations(project, ({ one, many }) => ({
    tasks: many(task),
    user: one(user, {
        fields: [project.user_id],
        references: [user.id]
    })
}));

export const taskRelations = relations(task, ({ one, many }) => ({
    project: one(project, {
        fields: [task.project_title],
        references: [project.title]
    }),
    taskAfter: many(taskToDoAfter),
    taskBefore: many(taskToDoAfter),
    recurrence: one(taskRecurrence, {
        fields: [task.id],
        references: [taskRecurrence.task_id]
    }),
    user: one(user, {
        fields: [task.user_id],
        references: [user.id]
    })
}));

export const taskToDoAfterRelations = relations(taskToDoAfter, ({ many }) => ({
    tasks: many(task)
}));

export const taskRecurrenceRelations = relations(taskRecurrence, ({ one }) => ({
    task: one(task, {
        fields: [taskRecurrence.task_id],
        references: [task.id]
    }),
    parentTask: one(task, {
        fields: [taskRecurrence.parent_task_id],
        references: [task.id]
    }),
    user: one(user, {
        fields: [taskRecurrence.user_id],
        references: [user.id]
    })
}));

export const seanceRelations = relations(seance, ({ one, many }) => ({
    exercices: many(seanceExercice),
    user: one(user, {
        fields: [seance.user_id],
        references: [user.id]
    })
}));

export const seanceExerciceRelations = relations(seanceExercice, ({ one }) => ({
    seance: one(seance, {
        fields: [seanceExercice.seance_id],
        references: [seance.id]
    }),
    exercice: one(exercice, {
        fields: [seanceExercice.exercice_id],
        references: [exercice.id]
    })
}));

export const workoutRelations = relations(workout, ({ one, many }) => ({
    seance: one(seance, {
        fields: [workout.seance_id],
        references: [seance.id]
    }),
    seriesGroup: many(seriesGroup),
}));

export const seriesGroupRelations = relations(seriesGroup, ({ one, many }) => ({
    workout: one(workout, {
        fields: [seriesGroup.workout_id],
        references: [workout.id]
    }),
    series: many(serie)
}));

export const serieRelations = relations(serie, ({ one }) => ({
    exercice: one(exercice, {
        fields: [serie.exercice_id],
        references: [exercice.id]
    }),
    seriesGroup: one(seriesGroup, {
        fields: [serie.series_group_id],
        references: [seriesGroup.id]
    }),
    user: one(user, {
        fields: [serie.user_id],
        references: [user.id]
    })
}));

export const workoutExerciceRelations = relations(workout, ({ many }) => ({
    exercices: many(serie)
}));

export const exerciceRelations = relations(exercice, ({ one, many }) => ({
    seanceExercices: many(seanceExercice),
    series: many(serie),
    user: one(user, {
        fields: [exercice.user_id],
        references: [user.id]
    })
}));

export const noteRelations = relations(note, ({ one }) => ({
    user: one(user, {
        fields: [note.user_id],
        references: [user.id]
    }),
    project: one(project, {
        fields: [note.project_title],
        references: [project.title]
    })
}));

export const movieRelations = relations(movie, ({ one }) => ({
    user: one(user, {
        fields: [movie.user_id],
        references: [user.id]
    })
}));

export const notInterestedMovieRelations = relations(notInterestedMovie, ({ one }) => ({
    user: one(user, {
        fields: [notInterestedMovie.user_id],
        references: [user.id]
    })
}));

// WMCDM Relations
export const wmcdmMatrixRelations = relations(wmcdmMatrix, ({ one, many }) => ({
    user: one(user, {
        fields: [wmcdmMatrix.user_id],
        references: [user.id]
    }),
    criteria: many(wmcdmCriterion),
    options: many(wmcdmOption),
    scores: many(wmcdmScore)
}));

export const wmcdmCriterionRelations = relations(wmcdmCriterion, ({ one, many }) => ({
    matrix: one(wmcdmMatrix, {
        fields: [wmcdmCriterion.matrix_id],
        references: [wmcdmMatrix.id]
    }),
    scores: many(wmcdmScore)
}));

export const wmcdmOptionRelations = relations(wmcdmOption, ({ one, many }) => ({
    matrix: one(wmcdmMatrix, {
        fields: [wmcdmOption.matrix_id],
        references: [wmcdmMatrix.id]
    }),
    scores: many(wmcdmScore)
}));

export const wmcdmScoreRelations = relations(wmcdmScore, ({ one }) => ({
    matrix: one(wmcdmMatrix, {
        fields: [wmcdmScore.matrix_id],
        references: [wmcdmMatrix.id]
    }),
    option: one(wmcdmOption, {
        fields: [wmcdmScore.option_id],
        references: [wmcdmOption.id]
    }),
    criterion: one(wmcdmCriterion, {
        fields: [wmcdmScore.criterion_id],
        references: [wmcdmCriterion.id]
    })
}));

// Habit Tracker Relations
export const habitRelations = relations(habit, ({ one, many }) => ({
    user: one(user, {
        fields: [habit.user_id],
        references: [user.id]
    }),
    entries: many(habitEntry)
}));

export const habitEntryRelations = relations(habitEntry, ({ one }) => ({
    habit: one(habit, {
        fields: [habitEntry.habit_id],
        references: [habit.id]
    }),
    user: one(user, {
        fields: [habitEntry.user_id],
        references: [user.id]
    })
}));

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Feature = typeof feature.$inferSelect;
export type NewFeature = typeof feature.$inferInsert;
export type PlanFeature = typeof planFeature.$inferSelect;
export type NewPlanFeature = typeof planFeature.$inferInsert;
export type UserSubscription = typeof userSubscription.$inferSelect;
export type NewUserSubscription = typeof userSubscription.$inferInsert;
export type Task = typeof task.$inferSelect;
export type NewTask = typeof task.$inferInsert;
export type TaskRecurrence = typeof taskRecurrence.$inferSelect;
export type NewTaskRecurrence = typeof taskRecurrence.$inferInsert;
export type TaskWithNonRecursiveRelations = Task & { project: Project | null; importanceDetails: Importance; durationDetails: Duration; tasksToDoAfter: TaskToDoAfter[] | null, tasksToDoBefore: TaskToDoAfter[] | null, recurrence: TaskRecurrence | null, recursive: false };
export type TaskWithRelations = Task & { project: Project | null; importanceDetails: Importance; durationDetails: Duration; tasksToDoAfter: TaskWithNonRecursiveRelations[] | null, tasksToDoBefore: TaskWithNonRecursiveRelations[] | null, recurrence: TaskRecurrence | null, recursive: true };
export type TaskToDoAfter = typeof taskToDoAfter.$inferSelect;
export type NewTaskToDoAfter = typeof taskToDoAfter.$inferInsert;
export type Meteo = typeof meteo.$inferSelect;
export type NewMeteo = typeof meteo.$inferInsert;
export type Project = typeof project.$inferSelect;
export type NewProject = typeof project.$inferInsert;
export type Exercice = typeof exercice.$inferSelect;
export type NewExercice = typeof exercice.$inferInsert;
export type Seance = typeof seance.$inferSelect;
export type NewSeance = typeof seance.$inferInsert;
export type SeanceExercice = typeof seanceExercice.$inferSelect;
export type NewSeanceExercice = typeof seanceExercice.$inferInsert;
export type Workout = typeof workout.$inferSelect;
export type NewWorkout = typeof workout.$inferInsert;
export type SeriesGroup = typeof seriesGroup.$inferSelect;
export type NewSeriesGroup = typeof seriesGroup.$inferInsert;
export type Serie = typeof serie.$inferSelect;
export type NewSerie = typeof serie.$inferInsert;
export type Importance = typeof importance.$inferSelect;
export type NewImportance = typeof importance.$inferInsert;
export type Duration = typeof duration.$inferSelect;
export type NewDuration = typeof duration.$inferInsert;
export type Note = typeof note.$inferSelect;
export type NewNote = typeof note.$inferInsert;
export type DailyMood = typeof dailyMood.$inferSelect;
export type NewDailyMood = typeof dailyMood.$inferInsert;
export type Movie = typeof movie.$inferSelect;
export type NewMovie = typeof movie.$inferInsert;
export type NotInterestedMovie = typeof notInterestedMovie.$inferSelect;
export type NewNotInterestedMovie = typeof notInterestedMovie.$inferInsert;
export type WmcdmMatrix = typeof wmcdmMatrix.$inferSelect;
export type NewWmcdmMatrix = typeof wmcdmMatrix.$inferInsert;
export type WmcdmCriterion = typeof wmcdmCriterion.$inferSelect;
export type NewWmcdmCriterion = typeof wmcdmCriterion.$inferInsert;
export type WmcdmOption = typeof wmcdmOption.$inferSelect;
export type NewWmcdmOption = typeof wmcdmOption.$inferInsert;
export type WmcdmScore = typeof wmcdmScore.$inferSelect;
export type NewWmcdmScore = typeof wmcdmScore.$inferInsert;
export type Habit = typeof habit.$inferSelect;
export type NewHabit = typeof habit.$inferInsert;
export type HabitEntry = typeof habitEntry.$inferSelect;
export type NewHabitEntry = typeof habitEntry.$inferInsert;
