"use client"

import {RadioButtons} from "@/components/big/filtering/radio-buttons";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import dynamic from "next/dynamic"
import {cn} from "@/lib/utils"
import type {Task} from "@/lib/db/schema"
import {useCallback, useEffect, useMemo, useRef, useState, useTransition} from "react"
import {Button} from "@/components/ui/button"
import {Calendar, Filter, FolderTree, Square, SquareMinus} from "lucide-react"
import TaskDisplay from "./task-display"
import {useTasks} from "@/hooks/use-tasks"
import {useProjects} from "@/hooks/use-projects"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Calendar as CalendarComponent} from "@/components/ui/calendar"
import {format} from "date-fns"
import {useRouter, useSearchParams} from "next/navigation"
import {updateTaskFilterCookieFromClient} from "./task-actions"
import type {TaskFilterCookie} from "@/lib/flags"
import {useNumberOfTasks} from "@/hooks/use-number-of-tasks"
import {ProjectsMultipleSelects} from "@/components/big/filtering/projects-multiple-selects";

const TaskModal = dynamic(() => import("@/components/big/tasks/task-modal"), {ssr: false})

// Constants for URL parameters
export const TASK_PARAMS = {
    COMPLETED: 'task_completed',
    LIMIT: 'task_limit',
    ORDER_BY: 'task_orderBy',
    ORDERING_DIRECTION: 'task_orderingDirection',
    PROJECTS: 'task_projects',
    REMOVED_PROJECTS: 'task_removedProjects',
    DUE_BEFORE: 'task_dueBefore',
    GROUP_BY_PROJECT: 'task_groupByProject',
} as const;

// Type for URL parameters
export type TaskUrlParams = {
    [TASK_PARAMS.COMPLETED]?: string;
    [TASK_PARAMS.LIMIT]?: string;
    [TASK_PARAMS.ORDER_BY]?: keyof Task.Task.Select;
    [TASK_PARAMS.ORDERING_DIRECTION]?: 'asc' | 'desc';
    [TASK_PARAMS.PROJECTS]?: string;
    [TASK_PARAMS.REMOVED_PROJECTS]?: string;
    [TASK_PARAMS.DUE_BEFORE]?: string;
    [TASK_PARAMS.GROUP_BY_PROJECT]?: string;
};

export function TasksCard({
                              className,
                              initialCompleted = false,
                              limit: initialLimit,
                              orderBy: initialOrderBy = "score",
                              orderingDirection: initialOrderingDirection = "desc",
                              withProject = true,
                              initialTaskFilterCookie,
                          }: {
    className?: string
    initialCompleted?: boolean
    limit?: number
    orderBy?: keyof Task.Task.Select
    orderingDirection?: "asc" | "desc"
    withProject?: boolean
    initialTaskFilterCookie?: TaskFilterCookie
}) {
    // -------------------- Imports & Hooks --------------------
    const router = useRouter()
    const searchParams = useSearchParams()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const [isPending, startTransition] = useTransition()

    // -------------------- State --------------------
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    // Priority: URL params > Cookie > Props
    const [completed, setCompleted] = useState<boolean | undefined>(
        searchParams.has(TASK_PARAMS.COMPLETED)
            ? searchParams.get(TASK_PARAMS.COMPLETED) === "true"
                ? true
                : searchParams.get(TASK_PARAMS.COMPLETED) === "false"
                    ? false
                    : undefined
            : initialTaskFilterCookie?.completed !== undefined
                ? initialTaskFilterCookie.completed
                : initialCompleted
    )

    const [limit, setLimit] = useState<number | undefined>(
        searchParams.has(TASK_PARAMS.LIMIT)
            ? Number.parseInt(searchParams.get(TASK_PARAMS.LIMIT) || "") || initialLimit
            : initialTaskFilterCookie?.limit !== undefined
                ? initialTaskFilterCookie.limit
                : initialLimit
    )

    const [orderBy] = useState<keyof Task.Task.Select | undefined>(
        (searchParams.get(TASK_PARAMS.ORDER_BY) as keyof Task.Task.Select) ||
        initialTaskFilterCookie?.orderBy ||
        initialOrderBy
    )

    const [orderingDirection] = useState<"asc" | "desc" | undefined>(
        (searchParams.get(TASK_PARAMS.ORDERING_DIRECTION) as "asc" | "desc") ||
        initialTaskFilterCookie?.orderingDirection ||
        initialOrderingDirection
    )

    const [selectedProjects, setSelectedProjects] = useState<string[]>(
        searchParams.has(TASK_PARAMS.PROJECTS)
            ? searchParams.get(TASK_PARAMS.PROJECTS)?.split(",") || []
            : initialTaskFilterCookie?.projects || []
    )

    const [removedProjects, setRemovedProjects] = useState<string[]>(
        searchParams.has(TASK_PARAMS.REMOVED_PROJECTS)
            ? searchParams.get(TASK_PARAMS.REMOVED_PROJECTS)?.split(",") || []
            : initialTaskFilterCookie?.removedProjects || []
    )

    const [dueBeforeDate, setDueBeforeDate] = useState<Date | undefined>(
        searchParams.has(TASK_PARAMS.DUE_BEFORE)
            ? new Date(searchParams.get(TASK_PARAMS.DUE_BEFORE) || "")
            : initialTaskFilterCookie?.dueBeforeDate
                ? new Date(initialTaskFilterCookie.dueBeforeDate)
                : undefined
    )

    const [groupByProject, setGroupByProject] = useState(
        searchParams.get(TASK_PARAMS.GROUP_BY_PROJECT) === "true" ||
        (searchParams.get(TASK_PARAMS.GROUP_BY_PROJECT) !== "false" &&
            initialTaskFilterCookie?.groupByProject === true)
    )

    const [tasksCompleted, setTasksCompleted] = useState(0)
    const [tasksUncompleted, setTasksUncompleted] = useState(0)
    const [tasksTotal, setTasksTotal] = useState(0)
    const [progression, setProgression] = useState(0)

    // Add a ref to track if this is the first render
    const isFirstRender = useRef(true);

    // -------------------- Data Fetching --------------------
    const {projects, isLoading: projectsLoading} = useProjects({
        completed: false,
        taskCompleted: completed,
        taskDueDate: dueBeforeDate,
        taskDeleted: false,
    })

    const {tasks, isLoading} = useTasks({
        completed,
        orderBy,
        limit,
        orderingDirection,
        withProject,
        projectTitles: groupByProject && selectedProjects.length > 0 ? selectedProjects : undefined,
        excludedProjectTitles: groupByProject && removedProjects.length > 0 ? removedProjects : undefined,
        dueBefore: dueBeforeDate,
    })

    // Memoize the numberOfTasks parameters to prevent unnecessary re-renders
    const numberOfTasksParams = useMemo(() => ({
        projectTitles: groupByProject && selectedProjects.length > 0 ? selectedProjects : undefined,
        excludedProjectTitles: groupByProject && removedProjects.length > 0 ? removedProjects : undefined,
        dueAfter: today,
        dueBefore: dueBeforeDate !== undefined ? dueBeforeDate : tomorrow,
    }), [groupByProject, selectedProjects, removedProjects, dueBeforeDate, today, tomorrow])

    const {
        data: numberOfTasks,
        isLoading: isCountLoading,
        isError: isCountError
    } = useNumberOfTasks(numberOfTasksParams)

    // -------------------- Effects --------------------

    useEffect(() => {
        if (numberOfTasks && numberOfTasks.length > 0) {
            // Filter tasks by due date if dueBeforeDate is set
            const filteredTasks = numberOfTasks.filter(task => {
                // Ensure task.due is a valid date before comparison
                if (!task.due) return false;
                const taskDueDate = new Date(task.due);
                return taskDueDate <= (dueBeforeDate !== undefined ? dueBeforeDate : tomorrow);
            })

            const completedCount = filteredTasks.reduce((sum, task) => sum + Number(task.completed_count), 0);
            const uncompletedCount = filteredTasks.reduce((sum, task) => sum + Number(task.uncompleted_count), 0);
            const totalCount = completedCount + uncompletedCount

            setTasksCompleted(completedCount)
            setTasksUncompleted(uncompletedCount)
            setTasksTotal(totalCount)
            setProgression(Math.round((completedCount / totalCount) * 100))
        }
    }, [numberOfTasks])

    // Clean up project selections when projects data changes
    useEffect(() => {
        // Only update if we have actual project data and it's not the first render
        if (projects && projects.length > 0) {
            // Skip the first render to avoid resetting on initial load
            if (isFirstRender.current) {
                isFirstRender.current = false;
                return;
            }

            // Get all project titles from the current projects data
            const currentProjectTitles = new Set(projects.map(project => project.title));

            // Filter selected projects to only include those that exist
            setSelectedProjects((prev) => {
                const filtered = prev.filter((title) => currentProjectTitles.has(title));
                return filtered.length !== prev.length ? filtered : prev;
            });

            // Filter removed projects to only include those that exist
            setRemovedProjects((prev) => {
                const filtered = prev.filter((title) => currentProjectTitles.has(title));
                return filtered.length !== prev.length ? filtered : prev;
            });
        }
    }, [projects]); // Only depend on projects to avoid infinite loops

    // Update cookie when filters change
    useEffect(() => {
        const updateCookie = async () => {
            await updateTaskFilterCookieFromClient({
                completed,
                limit,
                orderBy,
                orderingDirection,
                projects: selectedProjects,
                removedProjects,
                dueBeforeDate: dueBeforeDate?.toISOString(),
                groupByProject
            });
        };

        updateCookie();
    }, [completed, limit, orderBy, orderingDirection, selectedProjects, removedProjects, dueBeforeDate, groupByProject]);

    // -------------------- Callbacks --------------------

    useEffect(() => {
        // Debounce URL updates to prevent excessive navigation
        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams()

            if (completed !== undefined) params.set(TASK_PARAMS.COMPLETED, completed.toString())
            if (limit) params.set(TASK_PARAMS.LIMIT, limit.toString())
            if (orderBy) params.set(TASK_PARAMS.ORDER_BY, orderBy as string)
            if (orderingDirection) params.set(TASK_PARAMS.ORDERING_DIRECTION, orderingDirection)
            if (selectedProjects.length > 0) params.set(TASK_PARAMS.PROJECTS, selectedProjects.join(","))
            if (removedProjects.length > 0) params.set(TASK_PARAMS.REMOVED_PROJECTS, removedProjects.join(","))
            if (dueBeforeDate) params.set(TASK_PARAMS.DUE_BEFORE, dueBeforeDate.toISOString())
            if (groupByProject) params.set(TASK_PARAMS.GROUP_BY_PROJECT, "true")

            router.push(`?${params.toString()}`, {scroll: false})
        }, 200)

        return () => clearTimeout(timeoutId)
    }, [completed, limit, orderBy, orderingDirection, selectedProjects, removedProjects, dueBeforeDate, groupByProject, router])

    const cycleCompletedFilter = useCallback(() => {
        startTransition(() => {
            if (completed === true) setCompleted(undefined)
            else if (completed === false) setCompleted(true)
            else setCompleted(false)
        })
    }, [completed])

    /**
     * Toggles a project through three states:
     * 1. Include only this project
     * 2. Exclude this project
     * 3. Reset to neutral state
     *
     * @param projectTitle - The title of the project to toggle
     */
    const toggleProject = useCallback((projectTitle: string) => {
        startTransition(() => {
            if (selectedProjects.includes(projectTitle)) {
                if (selectedProjects.length === 1) {
                    setRemovedProjects(prev => [...prev, projectTitle]);
                }
                setSelectedProjects(prev => prev.filter(title => title !== projectTitle));
            } else if (removedProjects.includes(projectTitle)) {
                setRemovedProjects(prev => prev.filter(title => title !== projectTitle));
            } else {
                if (selectedProjects.length === 0) {
                    setRemovedProjects(prev => prev.filter(title => title !== projectTitle));
                }
                setSelectedProjects(prev => [...prev, projectTitle]);
            }
        });
    }, [selectedProjects, removedProjects])

    // -------------------- Derived Data --------------------
    const groupedTodos = useMemo(() => {
        if (!tasks) return {}

        return tasks.slice(0, limit).reduce(
            (acc, task) => {
                const projectId = task.project_title || "no-project"
                const projectName = projects?.find((p) => p.title === task.project_title)?.title || "No Project"

                if (!acc[projectId]) {
                    acc[projectId] = {name: projectName, tasks: []}
                }

                acc[projectId].tasks.push(task)
                return acc
            },
            {} as Record<string, { name: string; tasks: Task.Task.TaskWithRelations[] }>
        )
    }, [tasks, projects, limit]) as Record<string, { name: string; tasks: Task.Task.TaskWithRelations[] }>

    return (
        <Card
            className={cn(`w-full md:max-w-xl group/TodoCard h-fit max-h-screen overflow-y-auto scrollbar-hide`, className)}
        >
            <CardHeader className="flex flex-col sticky top-0 bg-background z-10 pt-6 md:pt-6">
                <div className="absolute top-0 left-0 w-full h-1 bg-muted"
                     title={`${tasksCompleted} task${tasksCompleted > 1 ? 's' : ''} completed out of ${tasksTotal} task${tasksTotal > 1 ? 's' : ''}`}>
                    <div
                        className={cn(
                            "absolute top-0 left-0 h-full transition-all duration-300",
                            isCountLoading ? "bg-muted animate-pulse" : "bg-primary"
                        )}
                        style={{width: isCountLoading ? "100%" : `${progression}%`}}
                    />
                    <div className="w-full flex justify-between items-center pt-2 px-1">
                        {isCountLoading || isCountError ? null : (
                            <>
                                <p className="text-muted-foreground text-xs">
                                    {tasksCompleted} task{tasksCompleted > 1 ? 's' : ''} completed
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    {tasksUncompleted} task{tasksUncompleted > 1 ? 's' : ''} to complete
                                </p>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex flex-row items-center justify-between w-full gap-2">
                    <CardTitle>
                        Your Tasks
                    </CardTitle>
                    <div className="flex gap-2 xl:opacity-0 duration-300 lg:group-hover/TodoCard:opacity-100">
                        <Button
                            variant={isFilterOpen ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsFilterOpen((prev) => !prev)}
                            disabled={isPending || isLoading}
                            tooltip="Filter/group the tasks"
                            className="h-10 py-2 flex items-center border-none"
                        >
                            <Filter className="h-4 w-4"/>
                        </Button>
                        <TaskModal/>
                    </div>
                </div>
                <div className={`${!isFilterOpen && "hidden"} flex flex-col gap-2`}>
                    <div className="flex flex-row justify-between items-center gap-4 flex-wrap">
                        {/* Due Before Date Filter */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={dueBeforeDate ? "default" : "outline"}
                                    size="sm"
                                    disabled={isPending || isLoading}
                                    tooltip="Filter by due date"
                                    className="flex items-center gap-1"
                                >
                                    <Calendar className="h-4 w-4"/>
                                    {dueBeforeDate ? format(dueBeforeDate, "MMM d") : "Due Before"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                    mode="single"
                                    selected={dueBeforeDate}
                                    onSelect={(date) => {
                                        setDueBeforeDate(date)
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={cycleCompletedFilter}
                            disabled={isPending || isLoading}
                            className={cn("flex items-center gap-1")}
                            tooltip={`
                  ${completed === true ? "Completed" : completed === false ? "Uncompleted" : "All"} tasks
                `}
                        >
                            {completed === true ? (
                                <Square className="rounded-xs bg-card-foreground h-4 w-4"/>
                            ) : completed === false ? (
                                <Square className="h-4 w-4"/>
                            ) : (
                                <SquareMinus className="h-4 w-4"/>
                            )}
                        </Button>
                        <RadioButtons
                            values={[5, 10, 25, 50]}
                            currentValue={limit}
                            onChange={setLimit}
                            disabled={isPending || isLoading}/>
                        <Button
                            variant={groupByProject ? "default" : "outline"}
                            size="sm"
                            onClick={() => setGroupByProject(!groupByProject)}
                            disabled={isPending || isLoading}
                            tooltip="Group by project"
                        >
                            <FolderTree className="h-4 w-4"/>
                        </Button>
                    </div>
                    <div className="flex items-center justify-between w-full">
                        {groupByProject && (
                            <div className="w-full flex flex-col space-y-2">
                                <ProjectsMultipleSelects
                                    projects={projects.map((project) => project.title)}
                                    selectedProjects={selectedProjects}
                                    removedProjects={removedProjects}
                                    onChange={toggleProject}
                                    loading={projectsLoading}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    // Show loading state
                    Array(5)
                        .fill(null)
                        .map((_, i) => <TaskDisplay key={i}/>)
                ) : tasks?.length > 0 ? (
                    // Show tasks, grouped or ungrouped based on the groupByProject state
                    groupByProject ? (
                        // Grouped by project
                        Object.entries(groupedTodos).sort(([, a], [, b]) => (a.name || "").localeCompare(b.name)).map(([projectId, {
                            name,
                            tasks
                        }]) => (
                            <div key={projectId} className="mb-2">
                                <h3 className="font-medium text-sm rounded-md">{tasks.length > 0 ? tasks[0].project_title : name}</h3>
                                <div className="">
                                    {tasks.map(
                                        (
                                            task: Task.Task.TaskWithRelations,
                                        ) => (
                                            <TaskDisplay
                                                key={task.id}
                                                task={task}
                                                orderedBy={orderBy}
                                                currentLimit={limit}
                                                currentDueBefore={dueBeforeDate}
                                                currentProjects={selectedProjects}
                                            />
                                        ),
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        // Not grouped
                        tasks
                            .slice(0, limit)
                            .map(
                                (
                                    task: Task.Task.TaskWithRelations
                                ) => (
                                    <TaskDisplay key={task.id} task={task} orderedBy={orderBy} currentLimit={limit}
                                                 currentDueBefore={dueBeforeDate} currentProjects={selectedProjects}/>
                                ),
                            )
                    )
                ) : (
                    // Show empty state
                    <div className="text-center py-4">Amazing! You have no tasks to do.</div>
                )}
            </CardContent>
        </Card>
    )
}
