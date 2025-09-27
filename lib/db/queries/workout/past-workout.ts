type PastWorkout = {
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

export async function getPastWorkouts(): Promise<PastWorkout[]> {
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