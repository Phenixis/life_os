"use client"

import {useEffect, useState} from "react"
import {Calendar as CalendarComponent} from "@/components/ui/calendar"
import {cn} from "@/lib/utils"
import {useSearchParams} from "next/navigation"
import {TASK_PARAMS} from "../tasks/tasks-card"
import {useNumberOfTasks} from "@/hooks/use-number-of-tasks"
import {useDailyMoods} from "@/hooks/use-daily-moods"
import {useTasks} from "@/hooks/use-tasks"
import TaskDisplay from "@/components/big/tasks/task-display"
import DailyMoodModal from "@/components/big/dailyMood/dailyMood-modal"

export default function Calendar(
    {
        className,
        showNumberOfTasks = true,
        showDailyMood = true,
    }: {
        className: string,
        showNumberOfTasks?: boolean
        showDailyMood?: boolean
    }
) {
    const searchParams = useSearchParams()
    const now = new Date()
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [month, setMonth] = useState<Date>(date ? new Date(date.getFullYear(), date.getMonth(), 1) : new Date(now.getFullYear(), now.getMonth(), 1))

    // Only fetch data when showNumberOfTasks is true
    const {data: numberOfTasks, isLoading} = useNumberOfTasks({
        projects: searchParams.get(TASK_PARAMS.PROJECTS)
            ? searchParams.get(TASK_PARAMS.PROJECTS)!.split(",").map(title => ({title, id: -1}))
            : undefined,
        excludedProjects: searchParams.get(TASK_PARAMS.REMOVED_PROJECTS)
            ? searchParams.get(TASK_PARAMS.REMOVED_PROJECTS)!.split(",").map(title => ({title, id: -1}))
            : undefined,
        dueAfter: month ? new Date(month.getFullYear(), month.getMonth(), 0) : undefined,
        dueBefore: month ? new Date(month.getFullYear(), month.getMonth() + 1, 0) : undefined,
        enabled: showNumberOfTasks, // Skip data fetching when not needed
    })

    // Fetch daily moods data
    const {data: dailyMoods} = useDailyMoods({
        startDate: new Date(month.getFullYear(), month.getMonth(), 1),
        endDate: new Date(month.getFullYear(), month.getMonth() + 1, 0),
        enabled: showDailyMood,
    })

    const {tasks, isLoading: isTaskLoading, isError: isTaskError} = useTasks({
        completed: false,
        dueBefore: date ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59) : undefined,
        dueAfter: date ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0) : undefined,
    })

    useEffect(() => {
        if (!date) {
            setDate(new Date())
        }
        if (date) {
            date.setHours(0, 0, 0, 0)
        }
    }, [date])

    // Get the mood for the currently selected date
    const getCurrentDateMood = () => {
        if (!date || !dailyMoods || dailyMoods.length === 0) return null

        const normalizedSelectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

        return dailyMoods.find(mood => {
            const moodDate = new Date(mood.date)
            const normalizedMoodDate = new Date(moodDate.getFullYear(), moodDate.getMonth(), moodDate.getDate())
            return normalizedMoodDate.getTime() === normalizedSelectedDate.getTime()
        })
    }

    const currentMood = getCurrentDateMood()

    return (
        <div
            className={cn(
                "flex flex-row md:flex-col justify-start items-start md:items-center border-l border-gray-100 dark:border-gray-800 md:w-full md:h-screen md:max-w-[300px] md:p-2",
                className,
            )}
        >
            <div className="w-full flex flex-col items-center justify-center">
                <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    onDayClick={(day) => {
                        console.log(day)
                    }}
                    taskCounts={showNumberOfTasks ? numberOfTasks : []}
                    dailyMoods={showDailyMood ? dailyMoods : []}
                    onMonthChange={(month) => {
                        setMonth(month)
                    }}
                />
                <div className="flex items-center justify-center w-full text-2xl">
                    <div className="flex flex-col items-center justify-center w-fit text-xl p-2">{date?.getDate()}</div>
                    <div className="flex flex-col items-center justify-center w-full text-xl">
                        <div className="w-full">
                            {date?.toLocaleDateString(undefined, {
                                weekday: "short",
                            })}
                        </div>
                        <div className="w-full text-base flex flex-row gap-2">
                            <div>
                                {date?.toLocaleDateString(undefined, {
                                    month: "long",
                                    year: "numeric",
                                })}
                            </div>
                            <div>
                                {(() => {
                                    if (!date) return ""
                                    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
                                    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
                                    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
                                    const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
                                    return (
                                        <span>
                                            W<span className="hidden lg:inline">eek </span>
                                            {weekNumber}
                                        </span>
                                    )
                                })()}
                            </div>
                        </div>
                    </div>
                    <DailyMoodModal date={date}/>
                </div>
                {currentMood && currentMood.comment && (
                    <div className="w-full mt-2 px-2 pb-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 italic break-words text-justify">
                            &quot;{currentMood.comment}&quot;
                        </div>
                    </div>
                )}
            </div>
            <div className="w-full h-full flex flex-col items-start justify-between">
                <div className="w-full flex flex-col items-center justify-center">
                    {
                        !isTaskError && !isLoading ? (
                            <div className="flex flex-col items-start justify-center w-full">
                                <h6>
                                    Tasks of the day
                                </h6>
                                {isTaskLoading ? (
                                    isLoading || numberOfTasks.filter((task) => task.due === date?.toISOString()).length === 0 ? (
                                        <div className="w-full">Loading tasks...</div>
                                    ) : (
                                        <>
                                            {
                                                Array.from({length: numberOfTasks.filter((task) => task.due === date?.toISOString())[0].uncompleted_count || 1}).map((_, i) => (
                                                    <TaskDisplay
                                                        key={i}
                                                        className="w-full"
                                                    />
                                                ))
                                            }
                                        </>
                                    )
                                ) : isTaskError ? (
                                    <div className="w-full">Error loading tasks</div>
                                ) : tasks.length === 0 ? (
                                    <div className="w-full">No tasks for the day</div>
                                ) : (
                                    <>
                                        {tasks.map((task) => (
                                            <TaskDisplay
                                                key={task.id}
                                                task={task}
                                                className="w-full"
                                            />
                                        ))}
                                    </>
                                )}
                            </div>
                        ) : isLoading ? (
                            <div className="w-full">Loading tasks...</div>
                        ) : (
                            <div className="w-full">Error loading tasks</div>
                        )
                    }
                </div>
            </div>
        </div>
    )
}
