"use client"

import type React from "react"
import {startTransition, useOptimistic, useRef, useState} from "react"
import {Skeleton} from "@/components/ui/skeleton"
import type {Task} from "@/lib/db/schema"
import {ChevronsDownUp, ChevronsUpDown, PenIcon, TrashIcon, Unlink} from "lucide-react"
import {useSWRConfig} from "swr"
import {cn} from "@/lib/utils"
import Tooltip from "@/components/big/tooltip"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {useUser} from "@/hooks/use-user"
import {toast} from "sonner"
import {TaskCount} from "@/components/ui/calendar"
import {Checkbox} from "@/components/ui/checkbox"
import {Label} from "@/components/ui/label"
import {useTaskModal} from "@/contexts/modal-commands-context";

export default function TaskDisplay(
    {
        task,
        orderedBy,
        className,
        currentLimit,
        currentDueBefore,
        otherId,
    }: {
        task?: Task.Task.TaskWithRelations | Task.Task.TaskWithNonRecursiveRelations
        orderedBy?: keyof Task.Task.Select
        className?: string
        currentLimit?: number
        currentDueBefore?: Date
        otherId?: number
    }
) {
    const user = useUser().user;
    const taskModal = useTaskModal();
    const [isToggled, setIsToggled] = useState(task ? task.completed_at !== null : false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isHovering, setIsHovering] = useState(false)
    const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false)
    const [optimisticState, toggleOptimistic] = useOptimistic(isToggled, (prev) => !prev)
    const containerRef = useRef<HTMLDivElement>(null)
    const {mutate} = useSWRConfig()
    const skeleton = task !== undefined
    const daysBeforeDue = task ? Math.ceil((new Date(task.due).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 4

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isDependencyDialogOpen, setIsDependencyDialogOpen] = useState(false)
    const [dependencyToDelete, setDependencyToDelete] = useState<number | null>(null)
    const [deleteRecurrency, setDeleteRecurrency] = useState(false)

    // Add a new state variable for the toggle confirmation dialog
    const [isToggleDialogOpen, setIsToggleDialogOpen] = useState(false)

    // Modify the toggle function to check for prerequisite tasks
    async function toggle() {
        if (!task) return

        // Check if the task has prerequisites and is being marked as complete
        if (!isToggled && task.tasksToDoAfter && task.tasksToDoAfter.length > 0) {
            // Show confirmation dialog
            setIsToggleDialogOpen(true)
            return
        }

        // Proceed with toggling
        performToggle()
    }

    // Extract the actual toggle logic to a separate function
    async function performToggle() {
        if (!task) return

        const newIsToggled = !isToggled

        // Close the dialog if it was open
        setIsToggleDialogOpen(false)

        // Immediately update local state
        setIsToggled(newIsToggled)

        // Also update optimistic state for consistent UI
        startTransition(() => {
            toggleOptimistic(newIsToggled)
        })

        try {
            // Optimistic UI update for SWR cache
            mutate(
                (key: unknown) => typeof key === "string" && (key === "/api/task/count" || key.startsWith("/api/task/count?")),
                async (currentData: unknown): Promise<TaskCount[] | unknown> => {
                    if (!Array.isArray(currentData)) return currentData

                    const updatedData: TaskCount[] = currentData.map((item: TaskCount) => {
                        if (new Date(item.due).getDate() === new Date(task.due).getDate()) {
                            return {
                                ...item,
                                completed_count: Number(item.completed_count) + 1,
                                uncompleted_count: Number(item.uncompleted_count) - 1,
                            }
                        }
                        return item
                    })

                    return updatedData
                },
                {revalidate: false}, // Don't revalidate immediately
            )

            mutate(
                (key: unknown) => typeof key === "string" && (key === "/api/task" || key.startsWith("/api/task?")),
                async (currentData: unknown): Promise<unknown> => {
                    if (!Array.isArray(currentData)) return currentData

                    return currentData.filter((item: Task.Task.Select) => item.id !== task.id)
                },
                {revalidate: false},
            )

            // Store original task state to revert if canceled
            const originalState = {completed: !newIsToggled}

            toast.success(`"${task.title}" ${newIsToggled ? "completed. Well done!" : "uncompleted"}`, {
                action: {
                    label: "Cancel",
                    onClick: async () => {
                        // Revert local state
                        setIsToggled(!newIsToggled)
                        startTransition(() => {
                            toggleOptimistic(!newIsToggled)
                        })

                        // Revert API state
                        try {
                            await fetch("/api/task", {
                                method: "PATCH",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${user?.api_key}`
                                },
                                body: JSON.stringify({id: task.id, completed: originalState.completed}),
                            })
                            mutate((key) => typeof key === "string" && key.startsWith("/api/task"))
                            toast.success(`"${task.title}" restored to ${originalState.completed ? "completed" : "uncompleted"} state`)
                        } catch (error) {
                            console.error("Error canceling task toggle:", error)
                            toast.error("Error canceling. The action may have already been processed.")
                        }
                    }
                }
            })

            // Actual API call
            await fetch("/api/task", {
                method: "PATCH",
                headers: {"Content-Type": "application/json", "Authorization": `Bearer ${user?.api_key}`},
                body: JSON.stringify({id: task.id, completed: !isToggled}),
            })

            // No need to set state again since we already did it optimistically
            // Revalidate after successful toggle
            mutate((key) => typeof key === "string" && key.startsWith("/api/task"))
        } catch (error) {
            console.error("Error toggling task:", error)
            toast.error("Error toggling task. Try again later.")

            // Revert both states on error
            setIsToggled(isToggled)
            startTransition(() => {
                toggleOptimistic(isToggled)
            })

            // Revalidate to restore the correct state
            mutate((key) => typeof key === "string" && key.startsWith("/api/task"))
        }
    }

    // Fonction améliorée pour supprimer une task avec SWR
    async function deleteTask(e?: React.MouseEvent) {
        if (e) e.stopPropagation() // Empêche le clic de se propager

        if (!task) return

        // If called without confirmation, show the dialog
        if (!isDeleteDialogOpen) {
            setIsDeleteDialogOpen(true)
            return
        }

        // Close the dialog
        setIsDeleteDialogOpen(false)

        try {
            setIsDeleting(true)

            mutate(
                (key: unknown) => typeof key === "string" && (key === "/api/task/count" || key.startsWith("/api/task/count?")),
                async (currentData: unknown): Promise<TaskCount[] | unknown> => {
                    if (!Array.isArray(currentData)) return currentData

                    const updatedData: TaskCount[] = currentData.map((item: TaskCount) => {
                        if (new Date(item.due).getDate() === new Date(task.due).getDate()) {
                            if (task.completed_at) {
                                return {
                                    ...item,
                                    completed_count: Number(item.completed_count) - 1,
                                }
                            } else {
                                return {
                                    ...item,
                                    uncompleted_count: Number(item.uncompleted_count) - 1,
                                }
                            }
                        }
                        return item
                    })

                    return updatedData
                },
                {revalidate: false}, // Don't revalidate immediately
            )

            // Optimistic UI update - remove the task from all lists
            mutate(
                (key: unknown) => typeof key === "string" && (key === "/api/task" || key.startsWith("/api/task?")),
                async (currentData: unknown): Promise<unknown> => {
                    // Filter out the task being deleted from all cached lists
                    if (Array.isArray(currentData)) {
                        return currentData
                            .filter((item: Task.Task.TaskWithRelations | Task.Task.TaskWithNonRecursiveRelations) => item.id !== task.id)
                            .sort(
                                (
                                    a: Task.Task.TaskWithRelations | Task.Task.TaskWithNonRecursiveRelations,
                                    b: Task.Task.TaskWithRelations | Task.Task.TaskWithNonRecursiveRelations,
                                ) => b.score - a.score || (a.title || "").localeCompare(b.title),
                            )
                            .slice(0, currentLimit || Number.MAX_SAFE_INTEGER)
                    }
                    return currentData
                },
                {revalidate: false}, // Don't revalidate immediately
            )

            // Store original task state to revert if canceled
            const originalState = {id: task.id, completed_at: task.completed_at}

            toast.success(`"${task.title}" deleted successfully`, {
                action: {
                    label: "Cancel",
                    onClick: async () => {
                        // Revert API state
                        try {
                            await fetch("/api/task", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${user?.api_key}`
                                },
                                body: JSON.stringify(originalState),
                            })
                            mutate((key) => typeof key === "string" && key.startsWith("/api/task"))
                            toast.success(`"${task.title}" restored successfully`)
                        } catch (error) {
                            console.error("Error canceling task deletion:", error)
                            toast.error("Error canceling. The action may have already been processed.")
                        }
                    }
                }
            })

            // Actual deletion
            await fetch(`/api/task?id=${task.id}`, {
                method: "DELETE",
                headers: {"Content-Type": "application/json", "Authorization": `Bearer ${user?.api_key}`},
            })

            // Revalidate after successful deletion
            mutate((key) => typeof key === "string" && key.startsWith("/api/task"))
        } catch (error) {
            console.error("Error deleting task:", error)
            toast.error("Error deleting task. Try again later.")

            // Revalidate to restore the correct state
            mutate((key) => typeof key === "string" && key.startsWith("/api/task"))
        } finally {
            setIsDeleting(false)
        }
    }

    async function deleteDependency(id: number) {
        if (!task) return

        // If called without confirmation, show the dialog
        if (!isDependencyDialogOpen) {
            setDependencyToDelete(id)
            setIsDependencyDialogOpen(true)
            return
        }

        // Close the dialog
        setIsDependencyDialogOpen(false)

        // Reset the dependency to delete
        const idToDelete = dependencyToDelete
        setDependencyToDelete(null)

        if (idToDelete === null) return

        try {
            // Optimistic UI update - update the task's dependencies in all lists
            mutate(
                (key: unknown) => typeof key === "string" && (key === "/api/task" || key.startsWith("/api/task?")),
                async (currentData: unknown): Promise<unknown> => {
                    // Find the task and update its dependencies
                    if (Array.isArray(currentData)) {
                        const filteredData = currentData.map((item: Task.Task.TaskWithRelations | Task.Task.TaskWithNonRecursiveRelations) => {
                            if (item.id === task.id || item.id === idToDelete) {
                                if (item.recursive) {
                                    return {
                                        ...item,
                                        tasksToDoBefore: item.tasksToDoBefore?.filter(
                                            (task) => task.id !== idToDelete && task.id !== task.id,
                                        ),
                                        tasksToDoAfter: item.tasksToDoAfter?.filter(
                                            (task) => task.id !== idToDelete && task.id !== task.id,
                                        ),
                                    }
                                } else {
                                    return {
                                        ...item,
                                        tasksToDoBefore: item.tasksToDoBefore?.filter(
                                            (dep) =>
                                                dep.task_id !== task.id &&
                                                dep.after_task_id !== idToDelete &&
                                                dep.task_id !== idToDelete &&
                                                dep.after_task_id !== task.id,
                                        ),
                                        tasksToDoAfter: item.tasksToDoAfter?.filter(
                                            (dep) =>
                                                dep.task_id !== task.id &&
                                                dep.after_task_id !== idToDelete &&
                                                dep.task_id !== idToDelete &&
                                                dep.after_task_id !== task.id,
                                        ),
                                    }
                                }
                            }
                            return item
                        })
                        return filteredData
                    }
                    return currentData
                },
                {revalidate: false}, // Don't revalidate immediately
            )
            toast.success("Dependency removed successfully")

            // Actual deletion
            await fetch(`/api/task/dependency?id1=${task.id}&id2=${idToDelete}`, {
                method: "DELETE",
                headers: {"Content-Type": "application/json", "Authorization": `Bearer ${user?.api_key}`},
            })

            // Revalidate after successful deletion
            mutate((key) => typeof key === "string" && key.startsWith("/api/task"))
        } catch (error) {
            console.error("Error deleting dependency:", error)
            toast.error("Error deleting dependency. Try again later.")
            // Revalidate to restore the correct state
            mutate((key) => typeof key === "string" && key.startsWith("/api/task"))
        } finally {
            setIsDeleting(false)
        }
    }

    function handleMouseEnter() {
        if (window.innerWidth >= 1024) {
            setIsHovering(true)
        }
    }

    function handleMouseLeave() {
        if (window.innerWidth >= 1024) {
            setIsHovering(false)
        }
    }

    return (
        <div
            ref={containerRef}
            className={cn(
                `flex flex-col group/task p-1 duration-300 text-xs xl:text-sm rounded mb-1 ${daysBeforeDue < 0 ? "bg-red-500/10 dark:bg-red-500/15 lg:hover:bg-red-500/25" : daysBeforeDue <= 3 ? "bg-orange-500/10 dark:bg-orange-500/15 lg:hover:bg-orange-500/25" : "lg:hover:bg-primary/10"} ${isDeleting ? "opacity-50" : ""}`,
                className,
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {skeleton ? (
                <>
                    <div className="flex items-center justify-between w-full text-xs md:text-sm">
                        <div className="flex items-center w-full">
                            <div
                                className={cn(
                                    "overflow-hidden transition-all duration-300 ease-in-out flex items-center justify-center ",
                                    isHovering
                                        ? "w-fit xl:w-full xl:max-w-[18px] xl:opacity-100 mx-1"
                                        : "w-fit xl:w-0 xl:max-w-0 xl:opacity-0",
                                )}
                            >
                                {/* Only this div is clickable for toggling */}
                                <div
                                    className={`relative p-2 ml-1 lg:ml-0 mr-2 lg:mr-0 size-1 border border-neutral-400 dark:border-neutral-600 rounded cursor-pointer group/Clickable ${optimisticState ? "bg-primary" : ""}`}
                                    onClick={() => toggle()}
                                    role="checkbox"
                                    aria-checked={optimisticState}
                                    tabIndex={0}
                                >
                                    <div
                                        className={`absolute inset-0 w-1/2 h-1/2 z-20 m-auto duration-300 rounded-xs ${optimisticState ? "lg:group-hover/Clickable:bg-background" : "lg:group-hover/Clickable:bg-primary"}`}
                                    />
                                </div>
                            </div>
                            <p
                                className={`w-full hyphens-auto text-xs md:text-sm ${optimisticState ? "line-through text-muted-foreground" : ""}`}
                                lang="en"
                            >
                                {task.title}
                            </p>
                        </div>
                        <div
                            className={cn(
                                "overflow-hidden transition-all duration-300 ease-in-out flex items-center justify-center",
                                isHovering
                                    ? "w-fit xl:w-full xl:max-w-[16px] xl:opacity-100 ml-1"
                                    : "w-fit xl:w-0 xl:max-w-0 xl:opacity-0",
                            )}
                        >
                            {task.recursive ? (
                                isCollapsibleOpen ? (
                                    <Tooltip tooltip="Collapse">
                                        <ChevronsDownUp
                                            className="min-w-[16px] max-w-[16px] min-h-[24px] max-h-[24px] text-black dark:text-white cursor-pointer duration-300"
                                            onClick={() => setIsCollapsibleOpen(!isCollapsibleOpen)}
                                        />
                                    </Tooltip>
                                ) : (
                                    <Tooltip tooltip="Expand">
                                        <ChevronsUpDown
                                            className="min-w-[16px] max-w-[16px] min-h-[24px] max-h-[24px] text-black dark:text-white cursor-pointer duration-300"
                                            onClick={() => setIsCollapsibleOpen(!isCollapsibleOpen)}
                                        />
                                    </Tooltip>
                                )
                            ) : (
                                <Tooltip tooltip="Remove dependency between the tasks">
                                    <Unlink
                                        className="min-w-[16px] max-w-[16px] min-h-[24px] max-h-[24px] text-destructive cursor-pointer lg:hover:text-destructive/80 duration-300"
                                        onClick={() => {
                                            deleteDependency(otherId || -1)
                                        }}
                                    />
                                </Tooltip>
                            )}
                        </div>
                    </div>
                    {task.recursive && (
                        <div className={`flex flex-col space-y-1 ${!isCollapsibleOpen && "hidden"}`}>
                            {task.tasksToDoAfter && task.tasksToDoAfter.length > 0 && (
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                        Task{task.tasksToDoAfter.length > 1 ? "s" : ""} to do before:
                                    </p>
                                    {task.tasksToDoAfter.map((afterTask) => (
                                        <TaskDisplay
                                            key={afterTask.id}
                                            task={afterTask}
                                            orderedBy={orderedBy}
                                            currentLimit={currentLimit}
                                            currentDueBefore={currentDueBefore}
                                            className="ml-6"
                                            otherId={task.id}
                                        />
                                    ))}
                                </div>
                            )}
                            {task.tasksToDoBefore && task.tasksToDoBefore.length > 0 && (
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                        Task{task.tasksToDoBefore.length > 1 ? "s" : ""} to do after:
                                    </p>
                                    {task.tasksToDoBefore.map((beforeTask) => (
                                        <TaskDisplay
                                            key={beforeTask.id}
                                            task={beforeTask}
                                            orderedBy={orderedBy}
                                            currentLimit={currentLimit}
                                            currentDueBefore={currentDueBefore}
                                            className="ml-6"
                                            otherId={task.id}
                                        />
                                    ))}
                                </div>
                            )}
                            <div className={`flex space-x-4 justify-between`}>
                                <div className="space-y-1">
                                    <Tooltip
                                        tooltip={`(Urgency * Importance) - Duration = Score<br/>(${task.urgency} * ${task.importance}) - ${task.duration} = ${task.score}`}>
                                        <p className="text-muted-foreground">
                                            Score: <span className="text-black dark:text-white">{task.score}</span>
                                        </p>
                                    </Tooltip>
                                    {task.project && task.project.title !== "" && (
                                        <p className="text-muted-foreground">
                                            Project: <span
                                            className="text-black dark:text-white">{task.project.title}</span>
                                        </p>
                                    )}
                                    {task.importance !== null && (
                                        <p className="text-muted-foreground">
                                            Importance: <span
                                            className="text-black dark:text-white">{task.importanceDetails.name}</span>
                                        </p>
                                    )}
                                    {task.due && (
                                        <Tooltip tooltip={`${new Date(task.due).toLocaleDateString()}`}
                                                 cursor="cursor-auto">
                                            <p className="text-muted-foreground">
                                                Due:{" "}
                                                <span className="text-black dark:text-white">
													{(() => {
                                                        const daysDifference = Math.ceil(
                                                            (new Date(task.due).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                                                        )
                                                        const formatter = new Intl.RelativeTimeFormat(navigator.language || "fr-FR", {
                                                            numeric: "auto",
                                                        })
                                                        return formatter.format(daysDifference, "day")
                                                    })()}
												</span>
                                            </p>
                                        </Tooltip>
                                    )}
                                    {task.duration !== undefined && (
                                        <p className="text-muted-foreground">
                                            Duration: <span
                                            className="text-black dark:text-white">{task.durationDetails.name}</span>
                                        </p>
                                    )}
                                </div>
                                <div
                                    className={cn(
                                        "overflow-hidden transition-all duration-300 ease-in-out flex flex-col items-center justify-between",
                                        isHovering
                                            ? "w-fit xl:w-full xl:max-w-[16px] xl:opacity-100 ml-1"
                                            : "w-fit xl:w-0 xl:max-w-0 xl:opacity-0",
                                    )}
                                >
                                    <div onClick={() => {
                                        setIsCollapsibleOpen(false)
                                        setIsHovering(false)
                                    }}>
                                        <Tooltip tooltip="Edit task">
                                            <PenIcon
                                                className="min-w-[16px] max-w-[16px] min-h-[24px] max-h-[24px] cursor-pointer"
                                                onClick={() => {
                                                    taskModal.setTask(task);
                                                    taskModal.openModal();
                                                }}
                                            />
                                        </Tooltip>
                                    </div>

                                    <Tooltip tooltip="Delete task">
                                        <TrashIcon
                                            className="min-w-[16px] max-w-[16px] min-h-[24px] max-h-[24px] text-destructive cursor-pointer lg:hover:text-destructive/80 duration-300"
                                            onClick={deleteTask}
                                        />
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex space-x-2 items-center w-full">
                    <Skeleton className="w-5 h-5"/>
                    <Skeleton className="w-full h-4"/>
                </div>
            )}
            {/* Delete Task Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md" maxHeight={"max-h-64 lg:max-h-54"}>
                    <DialogHeader>
                        <DialogTitle>Delete Task</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this task?<br/><br/>You will be able to find it back in your
                            Trash (Settings &gt; Trash &gt; Tasks).
                        </DialogDescription>
                        {
                            task?.recursive && (
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <Checkbox
                                        id="delete-recurrency"
                                        className="border-muted-foreground"
                                        checked={deleteRecurrency}
                                        onClick={() => setDeleteRecurrency(!deleteRecurrency)}
                                    />
                                    <Label htmlFor="delete-recurrency" className="cursor-pointer">
                                        Delete task recurrency ?
                                    </Label>
                                </div>
                            )
                        }
                    </DialogHeader>
                    <DialogFooter className="flex justify-between sm:justify-between">
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={() => deleteTask()}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dependency Confirmation Dialog */}
            <Dialog open={isDependencyDialogOpen} onOpenChange={setIsDependencyDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Remove Dependency</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove this dependency?<br/><br/>This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-between sm:justify-between">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDependencyDialogOpen(false)
                                setDependencyToDelete(null)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={() => deleteDependency(dependencyToDelete || -1)}>
                            Remove
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Add the Toggle Confirmation Dialog */}
            <Dialog open={isToggleDialogOpen} onOpenChange={setIsToggleDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Mark Task as Complete</DialogTitle>
                        <DialogDescription>
                            This task has tasks that should be done before that haven&apos;t been completed
                            yet.<br/><br/>{
                            task && task.recursive && task.tasksToDoAfter && task.tasksToDoAfter.length > 0 && (
                                <div className="flex flex-col space-y-1">
                                    {task.tasksToDoAfter.map((afterTask) => (
                                        <TaskDisplay
                                            key={afterTask.id}
                                            task={afterTask}
                                            orderedBy={orderedBy}
                                            currentLimit={currentLimit}
                                            currentDueBefore={currentDueBefore}
                                            otherId={task.id}
                                        />
                                    ))}
                                </div>
                            )}<br/>Are you sure you want to mark it as
                            complete?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-between sm:justify-between">
                        <Button variant="outline" onClick={() => setIsToggleDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => performToggle()}>Mark as Complete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
