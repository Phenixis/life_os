import * as lib from "../lib"

const workoutTable = lib.Schema.Workout.Workout.table
const setTable = lib.Schema.Workout.WorkoutSet.table
const exerciceTable = lib.Schema.Workout.Exercice.table
const setWorkoutTable = lib.Schema.Workout.Set_Workout.table

export type PastWorkout = {
    id: number
    title: string
    date: Date
    difficulty: 1 | 2 | 3 | 4 | 5
    exercices: {
        name: string,
        sets: {
            weight: number,
            nb_rep: number,
        }[]
    }[]
}

export async function getPastWorkouts(userId: string, limit: number = 50): Promise<PastWorkout[]> {
    const workouts = await lib.db
        .select()
        .from(workoutTable)
        .where(lib.and(
            lib.eq(workoutTable.user_id, userId),
            lib.isNull(workoutTable.deleted_at)
        ))
        .orderBy(lib.desc(workoutTable.date))
        .limit(limit);
    
    const result: PastWorkout[] = [];
    
    for (const workout of workouts) {
        // Get all set-to-workout links for this workout
        const setLinks = await lib.db
            .select({
                set_id: setWorkoutTable.set_id,
            })
            .from(setWorkoutTable)
            .where(lib.and(
                lib.eq(setWorkoutTable.workout_id, workout.id),
                lib.isNull(setWorkoutTable.deleted_at)
            ));
        
        const setIds = setLinks.map(link => link.set_id);
        
        if (setIds.length === 0) {
            result.push({
                id: workout.id,
                title: workout.name,
                date: workout.date,
                difficulty: workout.difficulty as 1 | 2 | 3 | 4 | 5,
                exercices: []
            });
            continue;
        }
        
        // Get all sets with their exercises
        const setsWithExercises = await lib.db
            .select({
                weight: setTable.weight,
                nb_reps: setTable.nb_reps,
                exercice_name: exerciceTable.name,
            })
            .from(setTable)
            .leftJoin(exerciceTable, lib.eq(setTable.exercice_id, exerciceTable.id))
            .where(lib.and(
                lib.inArray(setTable.id, setIds),
                lib.isNull(setTable.deleted_at)
            ));
        
        // Group sets by exercise
        const exerciseMap = new Map<string, { name: string, sets: { weight: number, nb_rep: number }[] }>();
        
        for (const set of setsWithExercises) {
            const exerciseName = set.exercice_name || 'Unknown Exercise';
            
            if (!exerciseMap.has(exerciseName)) {
                exerciseMap.set(exerciseName, {
                    name: exerciseName,
                    sets: []
                });
            }
            
            exerciseMap.get(exerciseName)!.sets.push({
                weight: set.weight,
                nb_rep: set.nb_reps
            });
        }
        
        result.push({
            id: workout.id,
            title: workout.name,
            date: workout.date,
            difficulty: workout.difficulty as 1 | 2 | 3 | 4 | 5,
            exercices: Array.from(exerciseMap.values())
        });
    }
    
    return result;
}

export async function getPastWorkoutsMockData(): Promise<PastWorkout[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const date = new Date();
    const d2 = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 2);
    const d4 = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 4);
    const d6 = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 6);
    const d8 = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 8);
    const d10 = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 10);
    const d12 = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 12);
    const d14 = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 14);

    return [
        {
            id: 1,
            title: "Upper body - Pull",
            date: date,
            difficulty: 3,
            exercices:
                [
                    {
                        name: "Chin up",
                        sets: [
                            {
                                weight: 100,
                                nb_rep: 10
                            },
                            {
                                weight: 100,
                                nb_rep: 10
                            },
                            {
                                weight: 100,
                                nb_rep: 10
                            }
                        ]
                    },
                    {
                        name: "Rowing barbell",
                        sets: [
                            {
                                weight: 50,
                                nb_rep: 12
                            },
                            {
                                weight: 50,
                                nb_rep: 12
                            },
                            {
                                weight: 50,
                                nb_rep: 12
                            }
                        ]
                    },
                    {
                        name: "Diverging Seated Rowing",
                        sets: [
                            {
                                weight: 100,
                                nb_rep: 8
                            },
                            {
                                weight: 100,
                                nb_rep: 8
                            },
                            {
                                weight: 100,
                                nb_rep: 8
                            }
                        ]
                    }
                ]
        },
        {
            id: 2,
            title: "Lower Body - Push",
            date: d8,
            difficulty: 5,
            exercices: [
                {
                    name: "Squats",
                    sets: [
                        {
                            weight: 40,
                            nb_rep: 10
                        },
                        {
                            weight: 40,
                            nb_rep: 10
                        },
                        {
                            weight: 40,
                            nb_rep: 10
                        }
                    ]
                },
                {
                    name: "Leg Press",
                    sets: [
                        {
                            weight: 120,
                            nb_rep: 12
                        },
                        {
                            weight: 120,
                            nb_rep: 12
                        },
                        {
                            weight: 120,
                            nb_rep: 12
                        }
                    ]
                },
                {
                    name: "Leg Extension",
                    sets: [
                        {
                            weight: 60,
                            nb_rep: 15
                        },
                        {
                            weight: 60,
                            nb_rep: 15
                        },
                        {
                            weight: 60,
                            nb_rep: 15
                        }
                    ]
                },
                {
                    name: "Calf Raises",
                    sets: [
                        {
                            weight: 80,
                            nb_rep: 20
                        },
                        {
                            weight: 80,
                            nb_rep: 20
                        },
                        {
                            weight: 80,
                            nb_rep: 20
                        },
                        {
                            weight: 80,
                            nb_rep: 20
                        }
                    ]
                }
            ]
        },
        {
            id: 3,
            title: "Full Body Conditioning",
            date: d2,
            difficulty: 4,
            exercices: [
                {
                    name: "Burpees",
                    sets: [
                        { weight: 0, nb_rep: 15 },
                        { weight: 0, nb_rep: 15 },
                        { weight: 0, nb_rep: 15 }
                    ]
                },
                {
                    name: "Kettlebell Swings",
                    sets: [
                        { weight: 24, nb_rep: 20 },
                        { weight: 24, nb_rep: 20 },
                        { weight: 24, nb_rep: 20 }
                    ]
                },
                {
                    name: "Plank",
                    sets: [
                        { weight: 0, nb_rep: 60 },
                        { weight: 0, nb_rep: 60 },
                        { weight: 0, nb_rep: 60 }
                    ]
                }
            ]
        },
        {
            id: 4,
            title: "Upper Body - Push",
            date: d4,
            difficulty: 3,
            exercices: [
                {
                    name: "Bench Press",
                    sets: [
                        { weight: 70, nb_rep: 8 },
                        { weight: 70, nb_rep: 8 },
                        { weight: 70, nb_rep: 8 }
                    ]
                },
                {
                    name: "Incline Dumbbell Press",
                    sets: [
                        { weight: 24, nb_rep: 10 },
                        { weight: 24, nb_rep: 10 },
                        { weight: 24, nb_rep: 10 }
                    ]
                },
                {
                    name: "Triceps Dips",
                    sets: [
                        { weight: 0, nb_rep: 12 },
                        { weight: 0, nb_rep: 12 },
                        { weight: 0, nb_rep: 12 }
                    ]
                }
            ]
        },
        {
            id: 5,
            title: "Lower Body - Pull",
            date: d6,
            difficulty: 4,
            exercices: [
                {
                    name: "Deadlift",
                    sets: [
                        { weight: 90, nb_rep: 5 },
                        { weight: 90, nb_rep: 5 },
                        { weight: 90, nb_rep: 5 }
                    ]
                },
                {
                    name: "Romanian Deadlift",
                    sets: [
                        { weight: 60, nb_rep: 10 },
                        { weight: 60, nb_rep: 10 },
                        { weight: 60, nb_rep: 10 }
                    ]
                },
                {
                    name: "Hamstring Curl",
                    sets: [
                        { weight: 45, nb_rep: 12 },
                        { weight: 45, nb_rep: 12 },
                        { weight: 45, nb_rep: 12 }
                    ]
                }
            ]
        },
        {
            id: 6,
            title: "Mobility & Core",
            date: d10,
            difficulty: 2,
            exercices: [
                {
                    name: "Hip Openers",
                    sets: [
                        { weight: 0, nb_rep: 12 },
                        { weight: 0, nb_rep: 12 },
                        { weight: 0, nb_rep: 12 }
                    ]
                },
                {
                    name: "Hollow Body Hold (sec)",
                    sets: [
                        { weight: 0, nb_rep: 30 },
                        { weight: 0, nb_rep: 30 },
                        { weight: 0, nb_rep: 30 }
                    ]
                },
                {
                    name: "Side Plank (sec)",
                    sets: [
                        { weight: 0, nb_rep: 30 },
                        { weight: 0, nb_rep: 30 },
                        { weight: 0, nb_rep: 30 }
                    ]
                }
            ]
        },
        {
            id: 7,
            title: "Upper Body - Pull (Volume)",
            date: d12,
            difficulty: 3,
            exercices: [
                {
                    name: "Lat Pulldown",
                    sets: [
                        { weight: 60, nb_rep: 12 },
                        { weight: 60, nb_rep: 12 },
                        { weight: 60, nb_rep: 12 }
                    ]
                },
                {
                    name: "Seated Cable Row",
                    sets: [
                        { weight: 55, nb_rep: 12 },
                        { weight: 55, nb_rep: 12 },
                        { weight: 55, nb_rep: 12 }
                    ]
                },
                {
                    name: "Face Pull",
                    sets: [
                        { weight: 15, nb_rep: 15 },
                        { weight: 15, nb_rep: 15 },
                        { weight: 15, nb_rep: 15 }
                    ]
                }
            ]
        },
        {
            id: 8,
            title: "Cardio Intervals",
            date: d14,
            difficulty: 2,
            exercices: [
                {
                    name: "Assault Bike (cal)",
                    sets: [
                        { weight: 0, nb_rep: 20 },
                        { weight: 0, nb_rep: 20 },
                        { weight: 0, nb_rep: 20 }
                    ]
                },
                {
                    name: "Row Erg (cal)",
                    sets: [
                        { weight: 0, nb_rep: 20 },
                        { weight: 0, nb_rep: 20 },
                        { weight: 0, nb_rep: 20 }
                    ]
                },
                {
                    name: "Jump Rope",
                    sets: [
                        { weight: 0, nb_rep: 100 },
                        { weight: 0, nb_rep: 100 },
                        { weight: 0, nb_rep: 100 }
                    ]
                }
            ]
        }
    ]
}