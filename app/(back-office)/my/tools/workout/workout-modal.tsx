"use client"

import {Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger,} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {Button} from "@/components/ui/button"
import {useEffect, useState} from "react"
import {Input} from "@/components/ui/input"
import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious
} from "@/components/ui/carousel"
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Label} from "@/components/ui/label"
import {Minus, Pencil, Plus, RotateCcw, Save, Trash2} from "lucide-react"
import {cn} from "@/lib/utils"
import {useWorkoutActions} from "@/hooks/use-workouts"
import {toast} from "sonner"
import {ExerciseSearchInput} from "./exercise-search-input"
import {DifficultySelector} from "./difficulty-selector"
import {DatePicker} from "./date-picker"
import type {PastWorkout} from "@/lib/db/queries/workout/past-workout"
import type {SavedWorkout} from "@/lib/db/queries/workout/saved-workout"
import {InvisibleInput} from "@/components/ui/invisible-input";

type Exercice = {
    name: string,
    sets: {
        id: number,
        weight: number,
        nb_rep: number,
    }[]
}

type WorkoutModalProps = {
    data?: Exercice[] | PastWorkout | SavedWorkout
    className?: string
    triggerButton?: React.ReactNode
}

const defaultExercice: Exercice[] = [
    {
        name: "New Exercice",
        sets: [
            {
                id: 0,
                weight: 0,
                nb_rep: 0,
            }
        ]
    }
]

function isPastWorkout(data: Exercice[] | PastWorkout | SavedWorkout | undefined): data is PastWorkout {
    return data !== undefined && !Array.isArray(data) && 'id' in data && 'date' in data && 'difficulty' in data
}

function isSavedWorkout(data: Exercice[] | PastWorkout | SavedWorkout | undefined): data is SavedWorkout {
    return data !== undefined && !Array.isArray(data) && 'id' in data && !('date' in data) && !('difficulty' in data)
}

export function WorkoutModal(
    {
        data,
        className,
        triggerButton
    }: WorkoutModalProps
) {
    const [showDialog, setShowDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    // Determine mode and initial data
    const isPastWorkoutEdit = isPastWorkout(data)
    const isSavedWorkoutEdit = isSavedWorkout(data)
    const isTemplateStart = Array.isArray(data)
    const mode = isPastWorkoutEdit ? 'edit-past' : isSavedWorkoutEdit ? 'edit-saved' : 'create'

    // Initialize state based on mode
    const initialExercises = isPastWorkoutEdit
        ? data.exercices.map(ex => ({
            ...ex,
            sets: ex.sets.map((s, idx) => ({...s, id: idx}))
        }))
        : isSavedWorkoutEdit
            ? data.exercices.map(ex => ({
                ...ex,
                sets: ex.sets.map((s, idx) => ({...s, id: idx}))
            }))
            : isTemplateStart
                ? data
                : defaultExercice

    const [exercices, setExercices] = useState<Exercice[]>(initialExercises)
    const [workoutName, setWorkoutName] = useState(
        isPastWorkoutEdit ? data.title : isSavedWorkoutEdit ? data.title : "My Workout"
    )
    const [workoutDate, setWorkoutDate] = useState<Date>(() => {
        const date = isPastWorkoutEdit ? new Date(data.date) : new Date()
        date.setHours(0, 0, 0, 0)
        return date
    })
    const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(isPastWorkoutEdit ? data.difficulty : 3)
    const [isSaving, setIsSaving] = useState(false)
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
    const [carouselApi, setCarouselApi] = useState<CarouselApi>(undefined)

    const {
        createWorkout,
        updateWorkout,
        deleteWorkout,
        createSavedWorkout,
        updateSavedWorkout,
        deleteSavedWorkout
    } = useWorkoutActions()

    useEffect(() => {
        if (!carouselApi) return

        const onSelect = () => {
            setCurrentExerciseIndex(carouselApi.selectedScrollSnap())
        }

        carouselApi.on("select", onSelect)
        onSelect()

        return () => {
            carouselApi.off("select", onSelect)
        }
    }, [carouselApi])

    useEffect(() => {
        if (!showDialog) {
            // Reset to initial state when dialog closes
            setExercices(initialExercises)
            setWorkoutName(
                isPastWorkoutEdit ? data.title : isSavedWorkoutEdit ? data.title : "My Workout"
            )
            setWorkoutDate(() => {
                const date = isPastWorkoutEdit ? new Date(data.date) : new Date()
                date.setHours(0, 0, 0, 0)
                return date
            })
            setDifficulty(isPastWorkoutEdit ? data.difficulty : 3)
            setCurrentExerciseIndex(0)
        }
    }, [showDialog])

    const addExerciseBefore = (index: number) => {
        const newExercices = [...exercices]
        newExercices.splice(index, 0, {
            name: "New Exercice",
            sets: [{
                id: 0,
                weight: 0,
                nb_rep: 0,
            }],
        })
        setExercices(newExercices)

        setTimeout(() => {
            carouselApi?.scrollTo(index + 1, true)
            carouselApi?.scrollTo(index)
        }, 50)
    }

    const addExerciseAfter = (index: number) => {
        const newExercices = [...exercices]
        newExercices.splice(index + 1, 0, {
            name: "New Exercice",
            sets: [{
                id: 0,
                weight: 0,
                nb_rep: 0,
            }],
        })
        setExercices(newExercices)
        setTimeout(() => {
            carouselApi?.scrollTo(index + 1)
        }, 50)
    }

    const resetExercise = (index: number) => {
        const newExercices = [...exercices]
        newExercices[index] = {
            name: "New Exercice",
            sets: [{
                id: 0,
                weight: 0,
                nb_rep: 0,
            }]
        }
        setExercices(newExercices)
    }

    const removeExercise = (index: number) => {
        const newExercices = [...exercices.slice(0, index), ...exercices.slice(index + 1)]
        if (index == exercices.length - 1) {
            carouselApi?.scrollTo(index - 1)

            setTimeout(() => {
                setExercices(newExercices)
            }, 1000)
        } else if (index === 0) {
            carouselApi?.scrollTo(index + 1)

            setTimeout(() => {
                setExercices(newExercices)
                carouselApi?.scrollTo(index, true)
            }, 1000)
        } else {
            setExercices(newExercices)

            setTimeout(() => {
                carouselApi?.scrollTo(index - 1, true)
                carouselApi?.scrollTo(index)
            }, 50)
        }
    }

    const handleDelete = async () => {
        if (isPastWorkoutEdit) {
            try {
                await deleteWorkout(data.id)
                toast.success("Workout deleted successfully!")
                setShowDialog(false)
                setShowDeleteDialog(false)
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to delete workout")
            }
        } else if (isSavedWorkoutEdit) {
            try {
                await deleteSavedWorkout(data.id)
                toast.success("Workout template deleted successfully!")
                setShowDialog(false)
                setShowDeleteDialog(false)
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to delete workout template")
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            if (mode === 'edit-past' && isPastWorkoutEdit) {
                await updateWorkout({
                    workout_id: data.id,
                    name: workoutName,
                    date: workoutDate,
                    difficulty: difficulty,
                    exercises: exercices.map(ex => ({
                        name: ex.name,
                        sets: ex.sets.map(s => ({
                            weight: s.weight,
                            nb_rep: s.nb_rep
                        }))
                    }))
                })
                toast.success("Workout updated successfully!")
            } else if (mode === 'edit-saved' && isSavedWorkoutEdit) {
                await updateSavedWorkout({
                    saved_workout_id: data.id,
                    name: workoutName,
                    exercises: exercices.map(ex => ({
                        name: ex.name,
                        sets: ex.sets.map(s => ({
                            weight: s.weight,
                            nb_rep: s.nb_rep
                        }))
                    }))
                })
                toast.success("Workout template updated successfully!")
            } else {
                await createWorkout({
                    name: workoutName,
                    date: workoutDate,
                    difficulty: difficulty,
                    exercises: exercices.map(ex => ({
                        name: ex.name,
                        sets: ex.sets.map(s => ({
                            weight: s.weight,
                            nb_rep: s.nb_rep
                        }))
                    }))
                })
                toast.success("Workout saved successfully!")
            }

            setShowDialog(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save workout")
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveAsTemplate = async () => {
        setIsSaving(true)
        try {
            await createSavedWorkout({
                name: workoutName,
                exercises: exercices.map(ex => ({
                    name: ex.name,
                    sets: ex.sets.map(s => ({
                        weight: s.weight,
                        nb_rep: s.nb_rep
                    }))
                }))
            })

            toast.success("Workout template saved!")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save template")
        } finally {
            setIsSaving(false)
        }
    }

    const defaultTrigger = mode === 'edit-past' || mode === 'edit-saved' ? (
        <Button
            variant="ghost"
            size="icon"
            className={cn("lg:opacity-0 lg:group-hover/workout:opacity-100", className)}
        >
            <Pencil className="size-4"/>
        </Button>
    ) : isTemplateStart ? (
        <Button
            variant="outline"
            className={cn("", className)}
        >
            Start Workout
        </Button>
    ) : (
        <Button
            className={cn("", className)}
        >
            Start Blank Workout
        </Button>
    )

    return (
        <>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                    {triggerButton || defaultTrigger}
                </DialogTrigger>
                <DialogContent maxHeight="max-h-150">
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4 mx-auto w-full max-w-[calc(100vw-5.25rem)] overflow-y-auto sm:max-w-[462px] lg:max-w-[718px] flex flex-col justify-between"
                    >
                        <div>
                            <DialogTitle className="hidden">
                                {workoutName}
                            </DialogTitle>
                            <DialogDescription className="hidden">
                                {mode === 'edit-past' ? 'Edit your workout' : mode === 'edit-saved' ? 'Edit workout template' : 'Add a new workout'}
                            </DialogDescription>
                            <div className="m-2">
                                <InvisibleInput
                                    id="workout-name"
                                    value={workoutName}
                                    onChange={(e) => setWorkoutName(e.target.value)}
                                    placeholder="Enter workout name"
                                    className={"font-semibold text-base md:text-lg"}
                                />
                            </div>
                            <Carousel setApi={setCarouselApi} className="my-2 mx-auto lg:w-[80%] pb-12 lg:pb-0">
                                <CarouselContent>
                                    {exercices.map((exercice, index) => (
                                        <CarouselItem key={index} className="flex flex-col items-start justify-start">
                                            <Table className="mx-auto" captionPosition="top">
                                                <TableCaption
                                                    className="mt-0 p-1 flex items-center justify-between text-black dark:text-white">
                                                    <span className="text-lg md:text-lg">
                                                        {index + 1}.
                                                    </span>
                                                    <ExerciseSearchInput
                                                        id={`exercice-name-${index}`}
                                                        value={exercice.name}
                                                        onChange={(value) => {
                                                            const newExercices = [...exercices]
                                                            newExercices[index] = {
                                                                ...exercices[index],
                                                                name: value
                                                            }
                                                            setExercices(newExercices)
                                                        }}
                                                        className="text-lg md:text-lg"
                                                    />
                                                    {exercices.length === 1 ? (
                                                        <Button
                                                            size="sm"
                                                            type="button"
                                                            className="font-normal text-gray-700 lg:hover:text-gray-900 dark:text-gray-300 dark:lg:hover:text-gray-100"
                                                            variant="ghost"
                                                            onClick={() => resetExercise(index)}
                                                        >
                                                            <RotateCcw className="size-4"/>
                                                            <span className="hidden lg:block">
                                                                Reset Exercise
                                                            </span>
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            type="button"
                                                            className="font-normal text-gray-700 lg:hover:text-gray-900 dark:text-gray-300 dark:lg:hover:text-gray-100"
                                                            variant="ghost-destructive"
                                                            onClick={() => removeExercise(index)}
                                                        >
                                                            <Minus className="size-4"/>
                                                            <span className="hidden lg:block">
                                                                Remove Exercise
                                                            </span>
                                                        </Button>
                                                    )}
                                                </TableCaption>
                                                <TableHeader>
                                                    <TableRow className="group/row">
                                                        <TableHead>
                                                            N° Set
                                                        </TableHead>
                                                        <TableHead>Weight</TableHead>
                                                        <TableHead>Nb Rep</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {exercice.sets.map((set, setIndex) => (
                                                        <TableRow key={setIndex} className="group/row">
                                                            <TableCell className="flex justify-between items-center">
                                                                <input type="hidden"
                                                                       id={`exercice-${index}-set-id-${set.id}`}/>
                                                                <div
                                                                    className="min-h-10 flex justify-center items-center">
                                                                    <p className={""}>
                                                                        {setIndex + 1}
                                                                    </p>
                                                                </div>
                                                                {exercice.sets.length > 1 && (
                                                                    <Button
                                                                        size="icon"
                                                                        type="button"
                                                                        variant="ghost"
                                                                        className="lg:opacity-0 lg:group-hover/row:opacity-100 lg:group-has-focus/row:opacity-100"
                                                                        onClick={() => {
                                                                            const newExercices = [...exercices]
                                                                            newExercices[index].sets = exercice.sets.filter(s => s.id !== set.id)
                                                                            setExercices(newExercices)
                                                                        }}
                                                                    >
                                                                        <Minus className="size-4"/>
                                                                    </Button>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="w-2/6">
                                                                <Input
                                                                    type="number"
                                                                    placeholder="Weight"
                                                                    id={`exercice-${index}-set-weight-${set.id}`}
                                                                    value={set.weight}
                                                                    onChange={(e) => {
                                                                        const newSets = [...exercice.sets]
                                                                        newSets[setIndex].weight = parseInt(e.target.value) || 0
                                                                        setExercices([...exercices])
                                                                    }}
                                                                    min={0}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="w-2/6">
                                                                <Input
                                                                    type="number"
                                                                    placeholder="Number of reps"
                                                                    id={`exercice-${index}-set-nb-reps-${set.id}`}
                                                                    value={set.nb_rep}
                                                                    onChange={(e) => {
                                                                        const newSets = [...exercice.sets]
                                                                        newSets[setIndex].nb_rep = parseInt(e.target.value) || 0
                                                                        setExercices([...exercices])
                                                                    }}
                                                                    min={0}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {/* Empty row for adding new set */}
                                                    <TableRow
                                                        className="opacity-50 hover:opacity-100 transition-opacity">
                                                        <TableCell>
                                                            {exercice.sets.length + 1}
                                                        </TableCell>
                                                        <TableCell className="w-2/6">
                                                            <Input
                                                                readOnly
                                                                type="number"
                                                                placeholder="Weight"
                                                                onFocus={() => {
                                                                    const newExercices = [...exercices]
                                                                    const currentSets = newExercices[index].sets
                                                                    const nextId = currentSets.length > 0 ? Math.max(...currentSets.map(s => s.id)) + 1 : 0
                                                                    newExercices[index].sets.push({
                                                                        id: nextId,
                                                                        weight: 0,
                                                                        nb_rep: 0,
                                                                    })
                                                                    setExercices(newExercices)
                                                                    setTimeout(() => {
                                                                        const newInput = document.getElementById(`exercice-${index}-set-weight-${nextId}`)
                                                                        if (newInput) newInput.focus()
                                                                    }, 0)
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="w-2/6">
                                                            <Input
                                                                readOnly
                                                                type="number"
                                                                placeholder="Reps"
                                                                onFocus={() => {
                                                                    const newExercices = [...exercices]
                                                                    const currentSets = newExercices[index].sets
                                                                    const nextId = currentSets.length > 0 ? Math.max(...currentSets.map(s => s.id)) + 1 : 0
                                                                    newExercices[index].sets.push({
                                                                        id: nextId,
                                                                        weight: 0,
                                                                        nb_rep: 0,
                                                                    })
                                                                    setExercices(newExercices)
                                                                    setTimeout(() => {
                                                                        const newInput = document.getElementById(`exercice-${index}-set-nb-reps-${nextId}`)
                                                                        if (newInput) newInput.focus()
                                                                    }, 0)
                                                                }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                {exercices.length > 0 && (
                                    <>
                                        <div
                                            className="absolute -left-12 top-[calc(50%-40px)] -translate-y-1/2 z-10 flex flex-col gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-full"
                                                onClick={() => addExerciseBefore(currentExerciseIndex)}
                                            >
                                                <Plus className="h-4 w-4"/>
                                                <span className="sr-only">Add exercise before</span>
                                            </Button>
                                        </div>
                                        <div
                                            className="absolute -right-12 top-[calc(50%-40px)] -translate-y-1/2 z-10 flex flex-col gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-full"
                                                onClick={() => addExerciseAfter(currentExerciseIndex)}
                                            >
                                                <Plus className="h-4 w-4"/>
                                                <span className="sr-only">Add exercise after</span>
                                            </Button>
                                        </div>
                                        <CarouselPrevious/>
                                        <CarouselNext/>
                                    </>
                                )}
                            </Carousel>
                        </div>
                        <footer className="w-full space-y-6">
                            {mode !== 'edit-saved' && (
                                <div className={"flex justify-center items-center gap-4"}>
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <DatePicker
                                            value={workoutDate}
                                            onChange={setWorkoutDate}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Difficulty</Label>
                                        <DifficultySelector
                                            value={difficulty}
                                            onChange={setDifficulty}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className={"w-full flex justify-between items-center gap-2"}>
                                <div className={"flex gap-2"}>
                                    {mode !== 'edit-saved' && (
                                        <Button
                                            variant="outline"
                                            type="button"
                                            disabled={isSaving}
                                            onClick={handleSaveAsTemplate}
                                        >
                                            <Save className="size-4 mr-2"/>
                                            Save as Template
                                        </Button>
                                    )}
                                    {(mode === 'edit-past' || mode === 'edit-saved') && (
                                        <Button
                                            variant="outline"
                                            type="button"
                                            disabled={isSaving}
                                            onClick={() => setShowDeleteDialog(true)}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="size-4 mr-2"/>
                                            Delete
                                        </Button>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        type="button"
                                        disabled={isSaving}
                                        onClick={() => setShowDialog(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving
                                            ? "Saving..."
                                            : mode === 'edit-past'
                                                ? "Update Workout"
                                                : mode === 'edit-saved'
                                                    ? "Update Template"
                                                    : "Complete Workout"
                                        }
                                    </Button>
                                </div>
                            </div>
                        </footer>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {mode === 'edit-saved' ? 'Delete Workout Template' : 'Delete Workout'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {mode === 'edit-saved'
                                ? 'Are you sure you want to delete this workout template? This action cannot be undone.'
                                : 'Are you sure you want to delete this workout? This action cannot be undone.'
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}
                                           className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
