"use client"

import {useEffect, useMemo, useState, useCallback} from "react"
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
    const now = new Date()
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [month, setMonth] = useState<Date>(date ? new Date(date.getFullYear(), date.getMonth(), 1) : new Date(now.getFullYear(), now.getMonth(), 1))

    const monthStart = useMemo(() => new Date(month.getFullYear(), month.getMonth(), 1), [month])
    const monthEnd = useMemo(() => new Date(month.getFullYear(), month.getMonth() + 1, 0), [month])

    // Only fetch data when showNumberOfTasks is true
    const {
        data: numberOfTasks,
        isLoading: isTaskCountLoading,
        isError: isTaskCountError,
    } = useNumberOfTasks({
        dueAfter: showNumberOfTasks ? new Date(monthStart.getFullYear(), monthStart.getMonth(), 0) : undefined,
        dueBefore: showNumberOfTasks ? monthEnd : undefined,
        enabled: showNumberOfTasks, // Skip data fetching when not needed
    })

    // Fetch daily moods data
    const {data: dailyMoods} = useDailyMoods({
        startDate: monthStart,
        endDate: monthEnd,
        enabled: showDailyMood,
    })

    const dayStart = useMemo(() => {
        if (!date) return undefined
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
    }, [date])

    const dayEnd = useMemo(() => {
        if (!date) return undefined
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
    }, [date])

    const {
        tasks: uncompletedTasks,
        isLoading: isUncompletedLoading,
        isError: isUncompletedError,
    } = useTasks({
        completed: false,
        dueBefore: dayEnd,
        dueAfter: dayStart,
    })

    const {
        tasks: completedTasks,
        isLoading: isCompletedLoading,
        isError: isCompletedError,
    } = useTasks({
        completed: true,
        dueBefore: dayEnd,
        dueAfter: dayStart,
    })

    const combinedTasks = useMemo(() => {
        const taskMap = new Map<number, (typeof uncompletedTasks)[number]>()
        uncompletedTasks.forEach((task) => {
            taskMap.set(task.id, task)
        })
        completedTasks.forEach((task) => {
            if (!taskMap.has(task.id)) {
                taskMap.set(task.id, task)
            }
        })

        // Keep uncompleted tasks first to highlight remaining work before completed items.
        return Array.from(taskMap.values()).sort((a, b) => {
            const aCompleted = a.completed_at ? 1 : 0
            const bCompleted = b.completed_at ? 1 : 0

            if (aCompleted !== bCompleted) {
                return aCompleted - bCompleted
            }

            return new Date(a.due).getTime() - new Date(b.due).getTime()
        })
    }, [completedTasks, uncompletedTasks])

    const countForSelectedDay = useMemo(() => {
        if (!dayStart) {
            return 0
        }

        if (showNumberOfTasks && !isTaskCountLoading && numberOfTasks) {
            const match = numberOfTasks.find((taskCount) => {
                const dueDate = new Date(taskCount.due)
                return dueDate.getFullYear() === dayStart.getFullYear()
                    && dueDate.getMonth() === dayStart.getMonth()
                    && dueDate.getDate() === dayStart.getDate()
            })

            if (match) {
                return match.uncompleted_count
            }
        }

        return uncompletedTasks.length
    }, [dayStart, showNumberOfTasks, isTaskCountLoading, numberOfTasks, uncompletedTasks])

    const isInitialLoading = (isUncompletedLoading && uncompletedTasks.length === 0) || (isCompletedLoading && completedTasks.length === 0)
    const hasPartialTaskError = (isUncompletedError || isCompletedError) && !(isUncompletedError && isCompletedError)

    const renderDailyTasks = () => {
        if (isUncompletedError && isCompletedError) {
            return <div className="w-full">Error loading tasks</div>
        }

        if (isInitialLoading) {
            if (showNumberOfTasks && !isTaskCountLoading && countForSelectedDay > 0) {
                const skeletonCount = Math.max(countForSelectedDay, 1)
                return (
                    <>
                        {Array.from({length: skeletonCount}).map((_, index) => (
                            <TaskDisplay
                                key={`task-skeleton-${index}`}
                                className="w-full"
                            />
                        ))}
                    </>
                )
            }

            return <div className="w-full">Loading tasks...</div>
        }

        if (combinedTasks.length === 0) {
            return <div className="w-full">No tasks for the day</div>
        }

        return (
            <>
                {combinedTasks.map((task) => (
                    <TaskDisplay
                        key={task.id}
                        task={task}
                        className="w-full"
                    />
                ))}
            </>
        )
    }

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
                    onMonthChange={useCallback((nextMonth: Date) => {
                        setMonth((currentMonth) => {
                            if (!currentMonth) {
                                return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1)
                            }

                            const currentKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`
                            const nextKey = `${nextMonth.getFullYear()}-${nextMonth.getMonth()}`

                            if (currentKey === nextKey) {
                                return currentMonth
                            }

                            return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1)
                        })
                    }, [])}
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
                    <div className="flex flex-col items-start justify-center w-full">
                        <h6>
                            Tasks of the day
                        </h6>
                        {renderDailyTasks()}
                        {hasPartialTaskError && (
                            <div className="w-full text-sm text-amber-600 dark:text-amber-400 mt-2">
                                Some tasks could not be loaded.
                            </div>
                        )}
                        {isTaskCountError && showNumberOfTasks && (
                            <div className="w-full text-sm text-amber-600 dark:text-amber-400 mt-2">
                                Task indicators unavailable.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
