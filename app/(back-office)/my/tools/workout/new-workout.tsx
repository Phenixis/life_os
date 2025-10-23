"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {useEffect, useState} from "react"
import {Input} from "@/components/ui/input"
import {InvisibleInput} from "@/components/ui/invisible-input"
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from "@/components/ui/carousel"
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {Label} from "@/components/ui/label"
import {Minus, Plus, Save} from "lucide-react"
import {cn} from "@/lib/utils"
import {useWorkoutActions} from "@/hooks/use-workouts"
import {toast} from "sonner"

type Exercice = {
    name: string,
    sets: {
        id: number,
        weight: number,
        nb_rep: number,
    }[]
}

const defaultExercice = [
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
];

export function NewWorkout(
    {
        defaultExercices = defaultExercice,
        className
    }
    :
    {
        defaultExercices?: Exercice[],
        className?: string,
    }
) {
    const [showDialog, setShowDialog] = useState(false)
    const [exercices, setExercices] = useState<Exercice[]>(defaultExercices)
    const [workoutName, setWorkoutName] = useState("My Workout")
    const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(3)
    const [isSaving, setIsSaving] = useState(false)
    const { createWorkout, createSavedWorkout } = useWorkoutActions()

    useEffect(() => {
        if (!showDialog) {
            setExercices(defaultExercices)
            setWorkoutName("My Workout")
            setDifficulty(3)
        }
    }, [showDialog, defaultExercices]);

    return (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
                {
                    defaultExercices !== defaultExercice ? (
                        <Button
                            variant={"outline"}
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
                }
            </DialogTrigger>
            <DialogContent maxHeight="max-h-130">
                <form
                    onSubmit={async (e) => {
                        e.preventDefault()
                        setIsSaving(true)
                        
                        try {
                            await createWorkout({
                                name: workoutName,
                                date: new Date(),
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
                            setShowDialog(false)
                        } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Failed to save workout")
                        } finally {
                            setIsSaving(false)
                        }
                    }}
                    className={"space-y-4 mx-auto w-full max-w-[calc(100vw-5.25rem)] overflow-y-auto sm:max-w-[462px] lg:max-w-[718px] flex flex-col justify-between"}>
                    <div>
                        <DialogHeader className="flex flex-row justify-between items-center">
                            <DialogTitle>
                                Create New Workout
                            </DialogTitle>
                            <Button
                                variant={"ghost"}
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
                                type="button"
                            >
                                <Plus className={"size-4"}/>
                                <span className={"hidden lg:block"}>
                                Add an Exercice
                            </span>
                            </Button>
                        </DialogHeader>
                        <DialogDescription className={"hidden"}>
                            Add a new workout
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
                            <div className="space-y-2">
                                <Label htmlFor="difficulty">Difficulty (1-5)</Label>
                                <Input
                                    id="difficulty"
                                    type="number"
                                    min={1}
                                    max={5}
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(Math.max(1, Math.min(5, parseInt(e.target.value) || 3)) as 1 | 2 | 3 | 4 | 5)}
                                />
                            </div>
                        </div>
                        <Carousel className={"my-2 mx-auto lg:w-[80%] pb-12 lg:pb-0"}>
                            <CarouselContent>
                                {
                                    exercices.map((exercice, index) => (
                                        <CarouselItem key={index}
                                                      className={"flex flex-col items-start justify-start"}>
                                            <Table className={"mx-auto"} captionPosition={"top"}>
                                                <TableCaption
                                                    className={"mt-0 p-1 flex items-center justify-between text-black dark:text-white"}>
                                                    <span className={"text-lg md:text-lg"}>
                                                        {index + 1}.
                                                    </span>
                                                    <InvisibleInput
                                                        id={"exercice-name-" + index}
                                                        defaultValue={exercice.name}
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
                                                        <span className={"hidden lg:block"}>
                                                        Remove Exercice
                                                    </span>
                                                    </Button>
                                                </TableCaption>
                                                <TableHeader>
                                                    <TableRow className={"group/row"}>
                                                        <TableHead
                                                            className={"flex justify-between items-center"}>
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
                                                    {
                                                        exercice.sets.map((set, setIndex) => (
                                                            <TableRow key={setIndex} className={"group/row"}>
                                                                <TableCell
                                                                    className="flex justify-between items-center">
                                                                    <input type={"hidden"}
                                                                           id={"exercice-" + index + "-set-id-" + set.id}/>
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
                                                                        id={"exercice-" + index + "-set-weight-" + set.id}
                                                                        value={set.weight}
                                                                        onChange={(e) => {
                                                                            const newSets = [...exercice.sets]
                                                                            newSets[setIndex].weight = parseInt(e.target.value)
                                                                            setExercices([...exercices])
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="w-2/6">
                                                                    <Input
                                                                        type={"number"}
                                                                        placeholder={"Number of reps"}
                                                                        id={"exercice-" + index + "-set-nb-reps-" + set.id}
                                                                        value={set.nb_rep}
                                                                        onChange={(e) => {
                                                                            const newSets = [...exercice.sets]
                                                                            newSets[setIndex].nb_rep = parseInt(e.target.value)
                                                                            setExercices([...exercices])
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    }
                                                </TableBody>
                                            </Table>
                                        </CarouselItem>
                                    ))
                                }
                            </CarouselContent>
                            {
                                exercices.length > 0 ? (
                                    <>
                                        <CarouselNext/>
                                        <CarouselPrevious/>
                                    </>
                                ) : null
                            }
                        </Carousel>
                    </div>
                    <footer className={"flex justify-between items-center gap-2"}>
                        <Button
                            variant={"outline"}
                            type={"button"}
                            disabled={isSaving}
                            onClick={async () => {
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
                            }}>
                            <Save className="size-4 mr-2" />
                            Save as Template
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant={"outline"}
                                type={"button"}
                                disabled={isSaving}
                                onClick={() => {
                                    setExercices(defaultExercices)
                                    setShowDialog(false)
                                }}>
                                Cancel
                            </Button>
                            <Button type={"submit"} disabled={isSaving}>
                                {isSaving ? "Saving..." : "Complete Workout"}
                            </Button>
                        </div>
                    </footer>
                </form>
            </DialogContent>
        </Dialog>
    )
}