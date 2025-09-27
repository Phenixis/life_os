"use client"

import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {useState} from "react";
import {Collapsible, CollapsibleContent, CollapsibleTrigger,} from "@/components/ui/collapsible"
import {ChevronDown} from "lucide-react";
import {Skeleton} from "@/components/ui/skeleton";
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious,} from "@/components/ui/carousel"
import {Difficulty} from "./difficulty"

function formatRelativeDate(date: Date, locale: string = 'en-US'): string {
    const now = new Date()
    // Normalize to midnight for day-based diff
    const startOfDay = (d: Date) => {
        const nd = new Date(d)
        nd.setHours(0, 0, 0, 0)
        return nd
    }
    const today = startOfDay(now)
    const target = startOfDay(date)
    const diffMs = today.getTime() - target.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    // Future dates: fallback to locale date
    if (diffDays < 0) {
        return date.toLocaleDateString(locale)
    }

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"

    const weekday = date.toLocaleDateString(locale, {weekday: 'long'})

    if (diffDays <= 6) {
        // Within the last week but not yesterday
        return weekday
    }
    if (diffDays <= 13) {
        // Between 1 and 2 weeks ago
        return `last ${weekday}`
    }

    // More than 2 weeks ago
    return date.toLocaleDateString(locale)
}

export type PastWorkoutProps = {
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

export function PastWorkoutDisplay(
    {
        workout,
    }: {
        workout?: PastWorkoutProps
    }
) {
    const [showDetails, setShowDetails] = useState<boolean>(false)

    return (
        <div
            className={"h-fit w-full border bg-gray-50 dark:bg-gray-950 rounded-lg my-4 p-2 flex flex-col justify-between items-left gap-2 group/workout"}>
            <header className={"flex justify-between items-center gap-4"}>
                {workout ? (
                    <>
                        <h3 className={"text-xl font-bold"}>
                            {workout.title}
                            <span className={"inline-block ml-4 font-normal text-sm text-gray-500"}>
                                {formatRelativeDate(workout.date)}
                            </span>
                        </h3>
                        <Difficulty value={workout.difficulty} />
                    </>
                ) : (
                    <>
                        <Skeleton className={"h-8 w-full"}/>
                    </>
                )}
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