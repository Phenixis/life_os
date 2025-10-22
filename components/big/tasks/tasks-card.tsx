"use client"

import {RadioButtons} from "@/components/big/filtering/radio-buttons";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {cn} from "@/lib/utils"
import type {Task} from "@/lib/db/schema"
import {useCallback, useEffect, useMemo, useRef, useState, useTransition} from "react"
import {Button} from "@/components/ui/button"
import {Calendar, Filter, FolderTree, PlusIcon, Square, SquareMinus} from "lucide-react"
import TaskDisplay from "./task-display"
import {useTasks} from "@/hooks/use-tasks"
import {useDeletedTasks} from "@/hooks/use-deleted-tasks"
import {useProjects} from "@/hooks/use-projects"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Calendar as CalendarComponent} from "@/components/ui/calendar"
import {format} from "date-fns"
import {useNumberOfTasks} from "@/hooks/use-number-of-tasks"
import {ProjectsMultipleSelects} from "@/components/big/filtering/projects-multiple-selects";
import {useTaskModal} from "@/contexts/modal-commands-context";

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

export type simplifiedProject = { title: string, id: number };

export type tasksFilters = {
    completed: boolean;
    limit: number;
    orderBy: keyof Task.Task.Select;
    orderingDirection: "asc" | "desc";
    selectedProjects: simplifiedProject[];
    removedProjects: simplifiedProject[];
    dueBeforeDate: string;
    groupByProject: boolean;
}

export function TasksCard(
    {
        className,
        initialCompleted = false,
        limit: initialLimit = 5,
        orderBy: initialOrderBy = "score",
        orderingDirection: initialOrderingDirection = "desc",
        withProject = true,
        isTrash = false
    }: {
        className?: string
        initialCompleted?: boolean
        limit?: number
        orderBy?: keyof Task.Task.Select
        orderingDirection?: "asc" | "desc"
        withProject?: boolean
        isTrash?: boolean
    }
) {
    const taskModal = useTaskModal()
    // -------------------- Imports & Hooks --------------------
    const today = useMemo(() => new Date(), [])
    const tomorrow = useMemo(() => {
        const date = new Date()
        date.setDate(date.getDate() + 1)
        return date
    }, [])

    const [isPending, startTransition] = useTransition()

    // -------------------- State --------------------
    const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false)

    const [completed, setCompleted] = useState<boolean | undefined>(initialCompleted)

    const [limit, setLimit] = useState<number>(initialLimit)

    const [orderBy, setOrderBy] = useState<keyof Task.Task.Select>(initialOrderBy)

    const [orderingDirection, setOrderingDirection] = useState<"asc" | "desc">(initialOrderingDirection)

    const [selectedProjects, setSelectedProjects] = useState<simplifiedProject[]>([])

    const [removedProjects, setRemovedProjects] = useState<simplifiedProject[]>([])

    const [dueBeforeDate, setDueBeforeDate] = useState<Date | undefined>(undefined)

    const [groupByProject, setGroupByProject] = useState<boolean>(false)

    const [tasksCompleted, setTasksCompleted] = useState(0)

    const [tasksUncompleted, setTasksUncompleted] = useState(0)

    const [tasksTotal, setTasksTotal] = useState(0)

    const [progression, setProgression] = useState(0)

    // Add a ref to track if this is the first render
    const isSavedFiltersBeenUser = useRef(false);

    // -------------------- Data Fetching --------------------
    const {projects, isLoading: projectsLoading} = useProjects({
        completed: false,
        taskCompleted: completed,
        taskDueDate: dueBeforeDate,
        taskDeleted: false,
    })

    const {tasks: regularTasks, isLoading: regularLoading} = useTasks({
        completed,
        orderBy,
        limit,
        orderingDirection,
        withProject,
        projects: groupByProject && selectedProjects.length > 0 ? selectedProjects.map(project => project.id) : undefined,
        excludedProjects: groupByProject && removedProjects.length > 0 ? removedProjects.map(project => project.id) : undefined,
        dueBefore: dueBeforeDate,
    })

    const {tasks: deletedTasksList, isLoading: deletedLoading} = useDeletedTasks({
        limit,
    })

    const tasks = isTrash ? deletedTasksList : regularTasks
    const isLoading = isTrash ? deletedLoading : regularLoading

    // Memoize the numberOfTasks parameters to prevent unnecessary re-renders
    const numberOfTasksParams = useMemo(() => ({
        projects: groupByProject && selectedProjects.length > 0 ? selectedProjects : undefined,
        excludedProjects: groupByProject && removedProjects.length > 0 ? removedProjects : undefined,
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
    }, [dueBeforeDate, numberOfTasks, tomorrow])

    // Update localStorage when filters change
    useEffect(() => {
        if (!isSavedFiltersBeenUser.current) {
            return;
        }

        const serialized = JSON.stringify({
            completed,
            limit,
            orderBy,
            orderingDirection,
            selectedProjects,
            removedProjects,
            dueBeforeDate: dueBeforeDate?.toISOString(),
            groupByProject
        } as tasksFilters)
        // Write to both keys to be backward-compatible with legacy storage
        window.localStorage.setItem("tasks_filters", serialized)
    }, [completed, limit, orderBy, orderingDirection, selectedProjects, removedProjects, dueBeforeDate, groupByProject]);

    useEffect(() => {
        const raw = window.localStorage.getItem("tasks_filters")
        if (raw) {
            try {
                const savedFilters = JSON.parse(raw) as Partial<tasksFilters>

                if (typeof savedFilters.completed === "boolean") {
                    console.log('completed filter:', savedFilters.completed);
                    setCompleted(savedFilters.completed)
                }
                if (typeof savedFilters.limit === "number" && Number.isFinite(savedFilters.limit)) {
                    console.log('limit filter:', savedFilters.limit);
                    setLimit(savedFilters.limit)
                }
                if (typeof savedFilters.orderBy === "string") {
                    console.log('orderBy filter:', savedFilters.orderBy);
                    setOrderBy(savedFilters.orderBy as keyof Task.Task.Select)
                }
                if (savedFilters.orderingDirection === "asc" || savedFilters.orderingDirection === "desc") {
                    console.log('ordering direction filter:', savedFilters.orderingDirection);
                    setOrderingDirection(savedFilters.orderingDirection)
                }
                if (Array.isArray(savedFilters.selectedProjects)) {
                    console.log('selected projects filter:', savedFilters.selectedProjects);
                    setSelectedProjects(savedFilters.selectedProjects)
                }
                if (Array.isArray(savedFilters.removedProjects)) {
                    console.log('removed projects filter:', savedFilters.removedProjects);
                    setRemovedProjects(savedFilters.removedProjects)
                }
                if (typeof savedFilters.dueBeforeDate === "string") {
                    const d = new Date(savedFilters.dueBeforeDate)
                    if (!isNaN(d.getTime())) {
                        console.log('due before date filter:', d);
                        setDueBeforeDate(d)
                    }
                }
                if (typeof savedFilters.groupByProject === "boolean") {
                    console.log('group by project filter:', savedFilters.groupByProject);
                    setGroupByProject(savedFilters.groupByProject)
                }
            } catch (e) {
                // ignore malformed JSON
                console.error("Error parsing saved filters:", e)
            }
        }

        isSavedFiltersBeenUser.current = true;
    }, [])

    // -------------------- Callbacks --------------------

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
    const toggleProject = useCallback((project: simplifiedProject) => {
        // Avoid startTransition here to prevent disabling all filters via isPending
        if (selectedProjects.some(p => p.id === project.id)) {
            // In selectedProjects: remove it; if it was the only one, move it to removed
            if (selectedProjects.length === 1) {
                setRemovedProjects(prev => [...prev, project])
            }
            setSelectedProjects(prev => prev.filter(p => p.id !== project.id))
        } else if (removedProjects.some(p => p.id === project.id)) {
            // In removedProjects: un-exclude it (back to neutral)
            setRemovedProjects(prev => prev.filter(p => p.id !== project.id))
        } else {
            // Neutral: select it
            if (selectedProjects.length === 0) {
                setRemovedProjects(prev => prev.filter(p => p.id !== project.id))
            }
            setSelectedProjects(prev => [...prev, project])
        }
    }, [selectedProjects, removedProjects])

    // -------------------- Derived Data --------------------
    const groupedTodos = useMemo(() => {
        if (!tasks) return {}

        return tasks.slice(0, limit).reduce(
            (acc, task) => {
                const projectId = task.project_id || -1
                const projectName = projects?.find((p) => p.id === task.project_id)?.title || "No Project"

                if (!acc[projectId]) {
                    acc[projectId] = {name: projectName, tasks: []}
                }

                acc[projectId].tasks.push(task)
                return acc
            },
            {} as Record<string, { name: string; tasks: (Task.Task.TaskWithRelations | Task.Task.TaskWithNonRecursiveRelations)[] }>
        )
    }, [tasks, projects, limit]) as Record<string, { name: string; tasks: (Task.Task.TaskWithRelations | Task.Task.TaskWithNonRecursiveRelations)[] }>

    return (
        <Card
            className={cn(`w-full md:max-w-xl group/TodoCard h-fit max-h-screen overflow-y-auto scrollbar-hide`, className)}
        >
            <CardHeader className="flex flex-col sticky top-0 bg-background z-10 pt-6 md:pt-6">
                {!isTrash && (
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
                )}
                <div className="flex flex-row items-center justify-between w-full gap-2">
                    <CardTitle>
                        {isTrash ? "Deleted Tasks" : "Your Tasks"}
                    </CardTitle>
                    {!isTrash && (
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
                            {/*<TaskModal />*/}
                            <Button
                                variant="outline"
                                size="sm"
                                tooltip="Create a new task"
                                className="h-10 px-2 flex items-center border-none"
                                onClick={() => {
                                    taskModal.openModal()
                                }}
                            >
                                <PlusIcon className="min-w-[24px] max-w-[24px] min-h-[24px]"/>
                            </Button>
                        </div>
                    )}
                </div>
                {!isTrash && (
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
                                    projects={projects.map((project) => {
                                        return {
                                            title: project.title,
                                            id: project.id
                                        }
                                    })}
                                    selectedProjects={selectedProjects}
                                    removedProjects={removedProjects}
                                    onChange={toggleProject}
                                    loading={projectsLoading}
                                />
                            </div>
                        )}
                    </div>
                </div>
                )}
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
                        Object.entries(groupedTodos)
                            .sort(([, a], [, b]) => (a.name || "").localeCompare(b.name))
                            .map(([projectId, {
                                name,
                                tasks
                            }]) => (
                                <div key={projectId} className="mb-2 ">
                                    <h3 className="font-medium text-sm rounded-md">{tasks.length > 0 ? tasks[0].project?.title : name}</h3>
                                    <div className="border-l ml-1 pl-1">
                                        {tasks.map(
                                            (
                                                task: Task.Task.TaskWithRelations | Task.Task.TaskWithNonRecursiveRelations,
                                            ) => (
                                                <TaskDisplay
                                                    key={task.id}
                                                    task={task}
                                                    orderedBy={orderBy}
                                                    currentLimit={limit}
                                                    currentDueBefore={dueBeforeDate}
                                                    isTrash={isTrash}
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
                                    task: Task.Task.TaskWithRelations | Task.Task.TaskWithNonRecursiveRelations
                                ) => (
                                    <TaskDisplay
                                        key={task.id}
                                        task={task}
                                        orderedBy={orderBy}
                                        currentLimit={limit}
                                        currentDueBefore={dueBeforeDate}
                                        isTrash={isTrash}
                                    />
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
