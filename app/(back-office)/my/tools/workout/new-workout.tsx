"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button";
import {useState} from "react"
import {Input} from "@/components/ui/input";
import {InvisibleInput} from "@/components/ui/invisible-input";
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious,} from "@/components/ui/carousel"
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {Minus, Plus} from "lucide-react";

type Exercice = {
    name: string,
    sets: {
        id: number,
        weight: number,
        nb_rep: number,
    }[]
}

export function NewWorkout(
    {
        defaultExercices = []
    }
    :
    {
        defaultExercices?: Exercice[]
    }
) {
    const initialExercices = defaultExercices.values();
    const [showDialog, setShowDialog] = useState(false)
    const [exercices, setExercices] = useState<Exercice[]>(defaultExercices)

    return (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
                {
                    defaultExercices.length > 0 ? (
                        <Button variant={"outline"}>
                            Start Workout
                        </Button>
                    ) : (
                        <Button>
                            Start Blank Workout
                        </Button>
                    )
                }
            </DialogTrigger>
            <DialogContent showCloseButton={false}>
                <DialogHeader className="flex flex-row justify-between items-center">
                    <DialogTitle>
                        Create New Workout
                    </DialogTitle>
                    <Button variant={"ghost"} onClick={() => {
                        setExercices([...exercices, {
                            name: "New Exercice",
                            sets: [{
                                id: 0,
                                weight: 0,
                                nb_rep: 0,
                            }],
                        }])
                    }}>
                        <Plus className={"size-4"}/>
                        <span className={"hidden lg:block"}>
                            Add an Exercice
                        </span>
                    </Button>
                </DialogHeader>
                <DialogDescription className={"hidden"}>
                    Add a new workout
                </DialogDescription>
                <form
                    className={"space-y-4 mx-auto w-full max-w-[calc(100vw-5.25rem)] max-h-[calc(100vh-12rem)] overflow-y-auto sm:max-w-[462px] lg:max-w-[718px]"}>
                    <Carousel className={"my-2 mx-auto lg:w-[80%] pb-12 lg:pb-0"}>
                        <CarouselContent>
                            {
                                exercices.map((exercice, index) => (
                                    <CarouselItem key={index}
                                                  className={"flex flex-col items-center justify-start"}>
                                        <Table className={"mx-auto"} captionPosition={"top"}>
                                            <TableCaption
                                                className={"mt-0 p-1 flex items-center justify-between text-white"}>
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
                                                    className={"font-normal text-gray-700 dark:text-gray-300"}
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
                                                            className={"lg:opacity-0 lg:group-hover/row:opacity-100"}
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
                                                                <input type={"hidden"} id={"exercice-" + index + "-set-id-" + set.id}/>
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
                    <footer className={"flex justify-end items-center gap-2"}>
                        <Button
                            variant={"outline"}
                            type={"button"}
                            onClick={() => {
                                setExercices(initialExercices.toArray())
                                setShowDialog(false)
                            }}>
                            Cancel
                        </Button>
                        <Button type={"submit"}>
                            Save
                        </Button>
                    </footer>
                </form>
            </DialogContent>
        </Dialog>
    )
}