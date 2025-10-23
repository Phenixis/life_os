export type WorkoutDifficulty = 1 | 2 | 3 | 4 | 5;

export interface WorkoutSet {
    id?: number;
    weight: number;
    nb_rep: number;
}

export interface WorkoutExercise {
    name: string;
    sets: WorkoutSet[];
}

export interface SavedWorkoutTemplate {
    id?: number;
    name: string;
    exercises: WorkoutExercise[];
}

export interface CompletedWorkout {
    id?: number;
    name: string;
    date: Date;
    difficulty: WorkoutDifficulty;
    exercises: WorkoutExercise[];
}

export interface CreateWorkoutRequest {
    name: string;
    date: Date | string;
    difficulty: WorkoutDifficulty;
    exercises: WorkoutExercise[];
}

export interface UpdateWorkoutRequest {
    workout_id: number;
    name?: string;
    date?: Date | string;
    difficulty?: WorkoutDifficulty;
    exercises?: WorkoutExercise[];
}

export interface CreateSavedWorkoutRequest {
    name: string;
    exercises: WorkoutExercise[];
}

export interface UpdateSavedWorkoutRequest {
    saved_workout_id: number;
    name?: string;
    exercises?: WorkoutExercise[];
}
