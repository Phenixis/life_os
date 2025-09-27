"use client"

import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {useState} from "react";
import {Collapsible, CollapsibleContent, CollapsibleTrigger,} from "@/components/ui/collapsible"
import {ChevronDown} from "lucide-react";
import {Skeleton} from "@/components/ui/skeleton";
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious,} from "@/components/ui/carousel"
import {NewWorkout} from "@/app/(back-office)/my/tools/workout/new-workout";

export type SavedWorkoutProps = {
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

export function SavedWorkoutDisplay(
    {
        workout,
    }: {
        workout?: SavedWorkoutProps
    }
) {
    const [showDetails, setShowDetails] = useState<boolean>(false)

    return (
        <div
            className={"h-fit w-full border bg-gray-50 dark:bg-gray-950 rounded-lg my-4 p-2 flex flex-col justify-between items-left gap-2 group/workout"}>
            <header className={"flex justify-between items-center space-x-12"}>
                {workout ? (
                    <>
                        <h3 className={"text-xl font-bold"}>
                            {workout.title}
                        </h3>
                        <NewWorkout defaultExercices={workout.exercices}/>
                    </>
                ) : (
                    <>
                        <Skeleton className={"h-8 w-full"}/>
                        <Skeleton className={"h-8 w-48"}/>
                    </>
                )
                }
            </header>
            <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                <div className="flex justify-between items-end text-gray-600 dark:text-gray-400 space-x-8">
                    {
                        workout ? (
                            <>
                                <p>
                                    {
                                        workout.exercices.map((exercice, index) => (
                                            <span key={index}>
                                                {index + 1}. {exercice.name}{index !== workout.exercices.length - 1 ? (
                                                <br/>) : ""}
                                            </span>
                                        ))
                                    }
                                </p>
                                <CollapsibleTrigger asChild className={"lg:hidden lg:group-hover/workout:flex"}>
                                    <Button size="sm" variant="ghost">
                                        Details
                                        <ChevronDown
                                            className={"size-4 duration-200 " + (showDetails ? "rotate-180" : "")}/>
                                    </Button>
                                </CollapsibleTrigger>
                            </>
                        ) : (
                            <>
                                <div className={"size-full flex flex-col gap-2"}>
                                    <Skeleton className={"h-4 w-full"}/>
                                    <Skeleton className={"h-4 w-full"}/>
                                    <Skeleton className={"h-4 w-full"}/>
                                </div>
                                <Skeleton className={"h-8 w-36"}/>
                            </>
                        )
                    }
                </div>
                <CollapsibleContent className={"my-2"}>
                    {
                        workout ? (
                            <Carousel className={"my-2 mx-auto w-[70%] lg:w-[80%]"}>
                                <CarouselContent>
                                    {
                                        workout.exercices.map((exercice, index) => (
                                            <CarouselItem key={index}
                                                          className={"flex flex-col items-center justify-start"}>
                                                <Table className={"mx-auto"}>
                                                    <TableCaption>{exercice.name}</TableCaption>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>N° Set</TableHead>
                                                            <TableHead>Weight</TableHead>
                                                            <TableHead>Nb Rep</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody className={"w-full"}>
                                                        {
                                                            exercice.sets.map((exercice, index) => (
                                                                <TableRow key={index} className={"w-full"}>
                                                                    <TableCell>{index + 1}</TableCell>
                                                                    <TableCell>{exercice.weight}</TableCell>
                                                                    <TableCell>{exercice.nb_rep}</TableCell>
                                                                </TableRow>
                                                            ))
                                                        }
                                                    </TableBody>
                                                </Table>
                                            </CarouselItem>
                                        ))
                                    }
                                </CarouselContent>
                                <CarouselNext className={"lg:hidden lg:group-hover/workout:flex"}/>
                                <CarouselPrevious className={"lg:hidden lg:group-hover/workout:flex"}/>
                            </Carousel>
                        ) : (
                            <p>
                                skeleton
                            </p>
                        )
                    }
                </CollapsibleContent>
            </Collapsible>
        </div>
    )
}