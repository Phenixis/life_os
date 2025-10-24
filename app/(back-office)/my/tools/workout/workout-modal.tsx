"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
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
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from "@/components/ui/carousel"
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Label} from "@/components/ui/label"
import {Minus, Plus, Save, RotateCcw, Trash2, Pencil} from "lucide-react"
import {cn} from "@/lib/utils"
import {useWorkoutActions} from "@/hooks/use-workouts"
import {toast} from "sonner"
import {ExerciseSearchInput} from "./exercise-search-input"
import {DifficultySelector} from "./difficulty-selector"
import {DatePicker} from "./date-picker"
import type {PastWorkout} from "@/lib/db/queries/workout/past-workout"

type Exercice = {
    name: string,
    sets: {
        id: number,
        weight: number,
        nb_rep: number,
    }[]
}

type WorkoutModalProps = {
    data?: Exercice[] | PastWorkout
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

function isPastWorkout(data: Exercice[] | PastWorkout | undefined): data is PastWorkout {
    return data !== undefined && !Array.isArray(data) && 'id' in data
}

export function WorkoutModal({
    data,
    className,
    triggerButton
}: WorkoutModalProps) {
    const [showDialog, setShowDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    
    // Determine mode and initial data
    const isPastWorkoutEdit = isPastWorkout(data)
    const isTemplateStart = Array.isArray(data)
    const mode = isPastWorkoutEdit ? 'edit' : 'create'
    
    // Initialize state based on mode
    const initialExercises = isPastWorkoutEdit 
        ? data.exercices.map(ex => ({
            ...ex,
            sets: ex.sets.map((s, idx) => ({ ...s, id: idx }))
          }))
        : isTemplateStart 
        ? data 
        : defaultExercice
    
    const [exercices, setExercices] = useState<Exercice[]>(initialExercises)
    const [workoutName, setWorkoutName] = useState(isPastWorkoutEdit ? data.title : "My Workout")
    const [workoutDate, setWorkoutDate] = useState<Date>(() => {
        const date = isPastWorkoutEdit ? new Date(data.date) : new Date()
        date.setHours(0, 0, 0, 0)
        return date
    })
    const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(isPastWorkoutEdit ? data.difficulty : 3)
    const [isSaving, setIsSaving] = useState(false)
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
    const [carouselApi, setCarouselApi] = useState<any>(null)
    
    const { createWorkout, updateWorkout, deleteWorkout, createSavedWorkout } = useWorkoutActions()

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
            setWorkoutName(isPastWorkoutEdit ? data.title : "My Workout")
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
        // Wait for carousel to update, then scroll to the new exercise with animation
        setTimeout(() => {
            carouselApi?.scrollTo(index, true) // true enables smooth scrolling
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
        // Wait for carousel to update, then scroll to the new exercise with animation
        setTimeout(() => {
            carouselApi?.scrollTo(index + 1, true) // true enables smooth scrolling
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

    const handleDelete = async () => {
        if (!isPastWorkoutEdit) return
        
        try {
            await deleteWorkout(data.id)
            toast.success("Workout deleted successfully!")
            setShowDialog(false)
            setShowDeleteDialog(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete workout")
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        
        try {
            if (mode === 'edit' && isPastWorkoutEdit) {
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

    const defaultTrigger = mode === 'edit' ? (
        <Button
            variant="ghost"
            size="icon"
            className={cn("lg:opacity-0 lg:group-hover/workout:opacity-100", className)}
        >
            <Pencil className="size-4" />
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
                <DialogContent maxHeight="max-h-130">
                    <form
                        onSubmit={handleSubmit}
                        className="space-y-4 mx-auto w-full max-w-[calc(100vw-5.25rem)] overflow-y-auto sm:max-w-[462px] lg:max-w-[718px] flex flex-col justify-between"
                    >
                        <div>
                            <DialogHeader className="flex flex-row justify-between items-center">
                                <DialogTitle>
                                    {mode === 'edit' ? 'Edit Workout' : 'Create New Workout'}
                                </DialogTitle>
                            </DialogHeader>
                            <DialogDescription className="hidden">
                                {mode === 'edit' ? 'Edit your workout' : 'Add a new workout'}
                            </DialogDescription>
                            <div className="space-y-4 my-4">
                                <div className="space-y-2">
                                    <Label htmlFor="workout-name">Workout Name</Label>
                                    <Input
                                        id="workout-name"
                                        value={workoutName}
                                        onChange={(e) => setWorkoutName(e.target.value)}
                                        placeholder="Enter workout name"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="space-y-2 flex-1">
                                        <Label htmlFor="workout-date">Date</Label>
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
                            </div>
                            <Carousel setApi={setCarouselApi} className="my-2 mx-auto lg:w-[80%] pb-12 lg:pb-0">
                                <CarouselContent>
                                    {exercices.map((exercice, index) => (
                                        <CarouselItem key={index} className="flex flex-col items-start justify-start">
                                            <Table className="mx-auto" captionPosition="top">
                                                <TableCaption className="mt-0 p-1 flex items-center justify-between text-black dark:text-white">
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
                                                            <RotateCcw className="size-4" />
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
                                                            onClick={() => {
                                                                setExercices([...exercices.slice(0, index), ...exercices.slice(index + 1)])
                                                            }}
                                                        >
                                                            <Minus className="size-4" />
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
                                                                <input type="hidden" id={`exercice-${index}-set-id-${set.id}`} />
                                                                {setIndex + 1}
                                                                {exercice.sets.length > 1 && (
                                                                    <Button
                                                                        size="icon"
                                                                        type="button"
                                                                        variant="ghost"
                                                                        className="lg:opacity-0 lg:group-hover/row:opacity-100"
                                                                        onClick={() => {
                                                                            const newExercices = [...exercices]
                                                                            newExercices[index].sets = exercice.sets.filter(s => s.id !== set.id)
                                                                            setExercices(newExercices)
                                                                        }}
                                                                    >
                                                                        <Minus className="size-4" />
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
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {/* Empty row for adding new set */}
                                                    <TableRow className="opacity-50 hover:opacity-100 transition-opacity">
                                                        <TableCell>
                                                            {exercice.sets.length + 1}
                                                        </TableCell>
                                                        <TableCell className="w-2/6">
                                                            <Input
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
                                        <div className="absolute left-12 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-full"
                                                onClick={() => addExerciseBefore(currentExerciseIndex)}
                                            >
                                                <Plus className="h-4 w-4" />
                                                <span className="sr-only">Add exercise before</span>
                                            </Button>
                                        </div>
                                        <div className="absolute right-12 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 rounded-full"
                                                onClick={() => addExerciseAfter(currentExerciseIndex)}
                                            >
                                                <Plus className="h-4 w-4" />
                                                <span className="sr-only">Add exercise after</span>
                                            </Button>
                                        </div>
                                        <CarouselPrevious />
                                        <CarouselNext />
                                    </>
                                )}
                            </Carousel>
                        </div>
                        <footer className="flex justify-between items-center gap-2">
                            <Button
                                variant="outline"
                                type="button"
                                disabled={isSaving}
                                onClick={handleSaveAsTemplate}
                            >
                                <Save className="size-4 mr-2" />
                                Save as Template
                            </Button>
                            <div className="flex gap-2">
                                {mode === 'edit' && (
                                    <Button
                                        variant="outline"
                                        type="button"
                                        disabled={isSaving}
                                        onClick={() => setShowDeleteDialog(true)}
                                        className="text-destructive"
                                    >
                                        <Trash2 className="size-4 mr-2" />
                                        Delete
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => setShowDialog(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? "Saving..." : mode === 'edit' ? "Update Workout" : "Complete Workout"}
                                </Button>
                            </div>
                        </footer>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Workout</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this workout? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
