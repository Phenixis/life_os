type SavedWorkout = {
    title: string
    exercices: {
        name: string,
        sets: {
            id: number
            weight: number,
            nb_rep: number,
        }[]
    }[]
}

export async function getSavedWorkouts(): Promise<SavedWorkout[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return [
        {
            title: "Upper body - Pull",
            exercices:
                [
                    {
                        name: "Chin up",
                        sets: [
                            {
                                id: 0,
                                weight: 100,
                                nb_rep: 10
                            },
                            {
                                id: 1,
                                weight: 100,
                                nb_rep: 10
                            },
                            {
                                id: 2,
                                weight: 100,
                                nb_rep: 10
                            }
                        ]
                    },
                    {
                        name: "Rowing barbell",
                        sets: [
                            {
                                id: 0,
                                weight: 50,
                                nb_rep: 12
                            },
                            {
                                id: 1,
                                weight: 50,
                                nb_rep: 12
                            },
                            {
                                id: 2,
                                weight: 50,
                                nb_rep: 12
                            }
                        ]
                    },
                    {
                        name: "Diverging Seated Rowing",
                        sets: [
                            {
                                id: 0,
                                weight: 100,
                                nb_rep: 8
                            },
                            {
                                id: 1,
                                weight: 100,
                                nb_rep: 8
                            },
                            {
                                id: 2,
                                weight: 100,
                                nb_rep: 8
                            }
                        ]
                    }
                ]
        },
        {
            title: "Lower Body - Push",
            exercices: [
                {
                    name: "Squats",
                    sets: [
                        {
                            id: 0,
                            weight: 40,
                            nb_rep: 10
                        },
                        {
                            id: 1,
                            weight: 40,
                            nb_rep: 10
                        },
                        {
                            id: 2,
                            weight: 40,
                            nb_rep: 10
                        }
                    ]
                },
                {
                    name: "Leg Press",
                    sets: [
                        {
                            id: 0,
                            weight: 120,
                            nb_rep: 12
                        },
                        {
                            id: 1,
                            weight: 120,
                            nb_rep: 12
                        },
                        {
                            id: 2,
                            weight: 120,
                            nb_rep: 12
                        }
                    ]
                },
                {
                    name: "Leg Extension",
                    sets: [
                        {
                            id: 0,
                            weight: 60,
                            nb_rep: 15
                        },
                        {
                            id: 1,
                            weight: 60,
                            nb_rep: 15
                        },
                        {
                            id: 2,
                            weight: 60,
                            nb_rep: 15
                        }
                    ]
                },
                {
                    name: "Calf Raises",
                    sets: [
                        {
                            id: 0,
                            weight: 80,
                            nb_rep: 20
                        },
                        {
                            id: 1,
                            weight: 80,
                            nb_rep: 20
                        },
                        {
                            id: 2,
                            weight: 80,
                            nb_rep: 20
                        },
                        {
                            id: 3,
                            weight: 80,
                            nb_rep: 20
                        }
                    ]
                }
            ]
        }
    ]
}