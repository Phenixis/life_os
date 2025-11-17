"use client"

import {Button} from "@/components/ui/button"
import {Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {useState} from "react"
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible"
import {ChevronDown} from "lucide-react"
import {Skeleton} from "@/components/ui/skeleton"
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from "@/components/ui/carousel"
import {Difficulty} from "./difficulty"
import {WorkoutModal} from "@/components/big/workout/workout-modal"
import {WorkoutProgressionDisplay, ProgressionBadge} from "./workout-progression-display"
import {useWorkoutProgression} from "@/hooks/use-workouts"
import { cn } from "@/lib/utils"

function formatRelativeDate(date: Date, locale: string = 'en-US'): string {
    const now = new Date()
    const dateObj = new Date(date)
    // Normalize to midnight for day-based diff
    const startOfDay = (d: Date) => {
        const nd = new Date(d)
        nd.setHours(0, 0, 0, 0)
        return nd
    }
    const today = startOfDay(now)
    const target = startOfDay(dateObj)
    const diffMs = today.getTime() - target.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    // Future dates: fallback to locale date
    if (diffDays < 0) {
        return dateObj.toLocaleDateString(locale)
    }

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"

    const weekday = dateObj.toLocaleDateString(locale, {weekday: 'long'})

    if (diffDays <= 6) {
        // Within the last week but not yesterday
        return weekday
    }
    if (diffDays <= 13) {
        // Between 1 and 2 weeks ago
        return `last ${weekday}`
    }

    // More than 2 weeks ago
    return dateObj.toLocaleDateString(locale)
}

export type PastWorkoutProps = {
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

export function PastWorkoutDisplay(
    {
        workout,
        showActions = true,
        className = "",
    }: {
        workout?: PastWorkoutProps
        showActions?: boolean
        className?: string
    }
) {
    const [showDetails, setShowDetails] = useState<boolean>(false)
    const {progression, isLoading: progressionLoading, error: progressionError} = useWorkoutProgression(workout ? workout.id : null)

    return (
        <div
            className={cn("h-fit w-full lg:hover:bg-gray-100 dark:lg:hover:bg-gray-900 rounded-lg my-4 p-2 flex flex-col justify-between items-left gap-2 group/workout", className)}>
            <header className={"flex justify-between items-center gap-4"}>
                {workout ? (
                    <>
                        <h3 className={"line-clamp-1 flex-1"}>
                            <span className={"inline-block text-xl font-bold"}>
                                {workout.title}
                            </span>
                            <span className={"inline-block ml-2 font-normal text-sm text-gray-500"}>
                                {formatRelativeDate(workout.date)}
                            </span>
                        </h3>
                        <div className="flex items-center gap-2">
                            {showActions && <WorkoutModal data={workout}/>}
                            <Difficulty value={workout.difficulty}/>
                        </div>
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
                                <p className="space-y-1 w-full">
                                    {
                                        workout.exercices.map((exercice, index) => {
                                            const progItem = progression?.exercises.find(e => e.exerciseName === exercice.name)
                                            return (
                                                <span key={index} className={"flex justify-between items-center w-full"}>
                                                    <span className={"flex-1 truncate"}>{index + 1}. {exercice.name}</span>
                                                    <span className={"ml-4 flex-shrink-0"}>
                                                        {progressionLoading ? (
                                                            <span className={"text-sm text-gray-500 dark:text-gray-400"}>Analyzing...</span>
                                                        ) : (
                                                            progItem ? <ProgressionBadge progression={progItem}/> : null
                                                        )}
                                                    </span>
                                                </span>
                                            )
                                        })
                                    }
                                </p>
                                {showActions && (
                                    <CollapsibleTrigger asChild className={"flex lg:opacity-0 lg:group-hover/workout:opacity-100"}>
                                        <Button size="sm" variant="ghost">
                                            Details
                                            <ChevronDown
                                                className={"size-4 duration-200 " + (showDetails ? "rotate-180" : "")}/>
                                        </Button>
                                    </CollapsibleTrigger>
                                )}
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
                            <>
                                <Carousel className={"my-2 mx-auto w-[70%] lg:w-[80%]"}>
                                    <CarouselContent>
                                        {
                                            workout.exercices.map((exercice, index) => (
                                                <CarouselItem key={index}
                                                              className={"flex flex-col items-center justify-start"}>
                                                    <Table className={"mx-auto"}>
                                                        <TableCaption>
                                                            <div className="flex items-center justify-center gap-2">
                                                                <span>{exercice.name}</span>
                                                            </div>
                                                        </TableCaption>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>N° Set</TableHead>
                                                                <TableHead>Nb Rep</TableHead>
                                                                <TableHead>Weight</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody className={"w-full"}>
                                                            {
                                                                exercice.sets.map((exercice, index) => (
                                                                    <TableRow key={index} className={"w-full"}>
                                                                        <TableCell>{index + 1}</TableCell>
                                                                        <TableCell>{exercice.nb_rep}</TableCell>
                                                                        <TableCell>{exercice.weight}</TableCell>
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
                                {/* Progression badges are now shown inline beside each exercise in the header */}
                            </>
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