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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {Button} from "@/components/ui/button"
import {useState} from "react"
import {Input} from "@/components/ui/input"
import {InvisibleInput} from "@/components/ui/invisible-input"
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from "@/components/ui/carousel"
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Label} from "@/components/ui/label"
import {Minus, Plus, Pencil, Trash2} from "lucide-react"
import {cn} from "@/lib/utils"
import {useWorkoutActions} from "@/hooks/use-workouts"
import {toast} from "sonner"
import type {SavedWorkout} from "@/lib/db/queries/workout/saved-workout"

type Exercice = {
    name: string,
    sets: {
        id: number,
        weight: number,
        nb_rep: number,
    }[]
}

export function EditSavedWorkout({
    savedWorkout,
    className
}: {
    savedWorkout: SavedWorkout,
    className?: string,
}) {
    const [showDialog, setShowDialog] = useState(false)
    const [exercices, setExercices] = useState<Exercice[]>(savedWorkout.exercices)
    const [workoutName, setWorkoutName] = useState(savedWorkout.title)
    const [isSaving, setIsSaving] = useState(false)
    const { updateSavedWorkout, deleteSavedWorkout } = useWorkoutActions()

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        
        try {
            await updateSavedWorkout({
                saved_workout_id: savedWorkout.id,
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
            setShowDialog(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update workout template")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        try {
            await deleteSavedWorkout(savedWorkout.id)
            toast.success("Workout template deleted successfully!")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete workout template")
        }
    }

    return (
        <div className="flex gap-2">
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                    <Button
                        variant={"ghost"}
                        size={"icon"}
                        className={cn("lg:opacity-0 lg:group-hover/workout:opacity-100", className)}
                    >
                        <Pencil className="size-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent maxHeight="max-h-130">
                    <form onSubmit={handleSave} className={"space-y-4 mx-auto w-full max-w-[calc(100vw-5.25rem)] overflow-y-auto sm:max-w-[462px] lg:max-w-[718px] flex flex-col justify-between"}>
                        <div>
                            <DialogHeader className="flex flex-row justify-between items-center">
                                <DialogTitle>Edit Workout Template</DialogTitle>
                                <Button
                                    variant={"ghost"}
                                    type="button"
                                    onClick={() => {
                                        setExercices([...exercices, {
                                            name: "New Exercice",
                                            sets: [{
                                                id: 0,
                                                weight: 0,
                                                nb_rep: 0,
                                            }],
                                        }])
                                    }}
                                >
                                    <Plus className={"size-4"}/>
                                    <span className={"hidden lg:block"}>Add an Exercice</span>
                                </Button>
                            </DialogHeader>
                            <DialogDescription className={"hidden"}>
                                Edit workout template
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
                            </div>
                            <Carousel className={"my-2 mx-auto lg:w-[80%] pb-12 lg:pb-0"}>
                                <CarouselContent>
                                    {exercices.map((exercice, index) => (
                                        <CarouselItem key={index} className={"flex flex-col items-start justify-start"}>
                                            <Table className={"mx-auto"} captionPosition={"top"}>
                                                <TableCaption className={"mt-0 p-1 flex items-center justify-between text-black dark:text-white"}>
                                                    <span className={"text-lg md:text-lg"}>{index + 1}.</span>
                                                    <InvisibleInput
                                                        id={"exercice-name-" + index}
                                                        value={exercice.name}
                                                        onChange={(e) => {
                                                            const newExercices = [...exercices];
                                                            newExercices[index] = {
                                                                ...exercices[index],
                                                                name: e.target.value
                                                            };
                                                            setExercices(newExercices);
                                                        }}
                                                        className={"text-lg md:text-lg"}
                                                    />
                                                    <Button
                                                        size={"sm"}
                                                        type={"button"}
                                                        className={"font-normal text-gray-700 lg:hover:text-gray-900 dark:text-gray-300 dark:lg:hover:text-gray-100"}
                                                        variant={"ghost-destructive"}
                                                        onClick={() => {
                                                            setExercices([...exercices.slice(0, index), ...exercices.slice(index + 1)])
                                                        }}>
                                                        <Minus className={"size-4"}/>
                                                        <span className={"hidden lg:block"}>Remove Exercice</span>
                                                    </Button>
                                                </TableCaption>
                                                <TableHeader>
                                                    <TableRow className={"group/row"}>
                                                        <TableHead className={"flex justify-between items-center"}>
                                                            N° Set
                                                            <Button
                                                                size={"icon"}
                                                                type={"button"}
                                                                variant={"ghost"}
                                                                onClick={() => {
                                                                    const newExercices = [...exercices];
                                                                    const currentSets = newExercices[index].sets;
                                                                    const nextId = currentSets.length > 0 ? Math.max(...currentSets.map(s => s.id)) + 1 : 0;
                                                                    newExercices[index].sets.push({
                                                                        id: nextId,
                                                                        weight: 0,
                                                                        nb_rep: 0,
                                                                    });
                                                                    setExercices(newExercices);
                                                                }}
                                                            >
                                                                <Plus className={"size-4"}/>
                                                            </Button>
                                                        </TableHead>
                                                        <TableHead>Weight</TableHead>
                                                        <TableHead>Nb Rep</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {exercice.sets.map((set, setIndex) => (
                                                        <TableRow key={setIndex} className={"group/row"}>
                                                            <TableCell className="flex justify-between items-center">
                                                                {setIndex + 1}
                                                                <Button
                                                                    size={"icon"}
                                                                    type={"button"}
                                                                    variant={"ghost"}
                                                                    className={"lg:opacity-0 lg:group-hover/row:opacity-100"}
                                                                    onClick={() => {
                                                                        const newExercices = [...exercices];
                                                                        newExercices[index].sets = exercice.sets.filter(s => s.id !== set.id);
                                                                        setExercices(newExercices);
                                                                    }}
                                                                >
                                                                    <Minus className={"size-4"}/>
                                                                </Button>
                                                            </TableCell>
                                                            <TableCell className="w-2/6">
                                                                <Input
                                                                    type={"number"}
                                                                    placeholder={"Weight"}
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
                                                                    type={"number"}
                                                                    placeholder={"Number of reps"}
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
                                                </TableBody>
                                            </Table>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                {exercices.length > 0 ? (
                                    <>
                                        <CarouselNext/>
                                        <CarouselPrevious/>
                                    </>
                                ) : null}
                            </Carousel>
                        </div>
                        <footer className={"flex justify-end items-center gap-2"}>
                            <Button
                                variant={"outline"}
                                type={"button"}
                                disabled={isSaving}
                                onClick={() => {
                                    setExercices(savedWorkout.exercices)
                                    setWorkoutName(savedWorkout.title)
                                    setShowDialog(false)
                                }}>
                                Cancel
                            </Button>
                            <Button type={"submit"} disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </footer>
                    </form>
                </DialogContent>
            </Dialog>
            
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant={"ghost"}
                        size={"icon"}
                        className={cn("lg:opacity-0 lg:group-hover/workout:opacity-100 text-destructive", className)}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Workout Template</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{savedWorkout.title}&quot;? This action cannot be undone.
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
        </div>
    )
}
