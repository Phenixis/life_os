"use client"

import React, {useCallback, useEffect, useRef, useState} from "react"
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import type {Project, Task} from "@/lib/db/schema"
import {ChevronDown, CircleHelp, Minus, Plus} from "lucide-react"
import {useQueryClient} from '@tanstack/react-query'
import { useCreateTask, useUpdateTask } from '@/hooks/queries/use-task-mutations'
import {Calendar, TaskCount} from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {calculateUrgency} from "@/lib/utils/task"
import {format} from "date-fns"
import {useDebouncedCallback} from "use-debounce"
import {useSearchTasks} from "@/hooks/use-search-tasks"
import {useImportanceAndDuration} from "@/hooks/use-importance-and-duration"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {Collapsible, CollapsibleContent, CollapsibleTrigger,} from "@/components/ui/collapsible"
import Tooltip from "../tooltip"
import {useUser} from "@/hooks/use-user"
import {toast} from "sonner"
import {simplifiedProject, tasksFilters} from "./tasks-card"
import SearchProjectsInput from "../projects/search-projects-input"
import Help from "../help"
import {Checkbox} from "@/components/ui/checkbox";
import {useTaskModal} from "@/contexts/modal-commands-context";
import {DatePicker} from "@/components/big/date-picker";

export default function TaskModal() {
    const user = useUser().user;
    const {isOpen, task, openModal, closeModal, dueDate: contextDueDate} = useTaskModal();

    // State management for the dialog
    const mode = task ? "edit" : "create"
    const [keepCreating, setKeepCreating] = useState(false)

    // State management for form fields
    const [dueDate, setDueDate] = useState<Date>(() => {
        const initialDate = task ? new Date(task.due) : (contextDueDate || new Date())
        initialDate.setHours(0, 0, 0, 0)
        return initialDate
    })
    const [showCalendar, setShowCalendar] = useState(false)

    const [project, setProject] = useState<simplifiedProject>(task && task.project ? {
        title: task.project.title,
        id: task.project.id
    } : {
        title: "",
        id: -1
    })

    // Keep project state in sync when the task prop arrives/changes (e.g., when opening in edit mode)
    useEffect(() => {
        if (task && task.project) {
            setProject({title: task.project.title, id: task.project.id})
        }
        if (task) {
            setImportance(task.importance?.toString() || "0")
            setDuration(task.duration?.toString() || "0")
            if (task.due) {
                const taskDueDate = new Date(task.due)
                taskDueDate.setHours(0, 0, 0, 0)
                setDueDate(taskDueDate)
            }
        } else if (contextDueDate) {
            const initialDate = new Date(contextDueDate)
            initialDate.setHours(0, 0, 0, 0)
            setDueDate(initialDate)
        }
    }, [task, contextDueDate])

    const [toDoAfter, setToDoAfter] = useState<number>(task && task.tasksToDoAfter && task.tasksToDoAfter.length > 0 && task.tasksToDoAfter[0].deleted_at === null ? task.tasksToDoAfter[0].id : -1)
    const [toDoAfterInputValue, setToDoAfterInputValue] = useState<string>(task && task.tasksToDoAfter && task.tasksToDoAfter.length > 0 && task.tasksToDoAfter[0].deleted_at === null ? task.tasksToDoAfter[0].title : "")
    const [toDoAfterDebounceValue, setToDoAfterDebounceValue] = useState<string>(task && task.tasksToDoAfter && task.tasksToDoAfter.length > 0 && task.tasksToDoAfter[0].deleted_at === null ? task.tasksToDoAfter[0].title : "")
    const {tasks, isLoading: isLoadingTasks, isError: isErrorTasks} = useSearchTasks({
        query: toDoAfterDebounceValue, limit: 5, excludeIds: task ? [
            task.id,
            task.tasksToDoBefore ? task.tasksToDoBefore.map((task) => task.id) : -1,
        ].flat() : []
    })

    const {importanceData, durationData} = useImportanceAndDuration()
    
    // Mutation hooks
    const createTaskMutation = useCreateTask()
    const updateTaskMutation = useUpdateTask()
    
    const [formChanged, setFormChanged] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

    // Use refs to access field values
    const closeDialogRef = useRef<() => void>(() => {
    })
    const titleRef = useRef<HTMLInputElement>(null)
    const [importance, setImportance] = useState<string>(task?.importance?.toString() || "0")
    const [duration, setDuration] = useState<string>(task?.duration?.toString() || "0")
    const durationTriggerRef = useRef<HTMLButtonElement>(null)

    // Track if a submission is in progress (to prevent duplicates)
    const isSubmittingRef = useRef(false)

    const resetForm = useCallback(() => {
        setDueDate(() => {
            const initialDate = task ? new Date(task.due) : (contextDueDate || new Date())
            initialDate.setHours(0, 0, 0, 0)
            return initialDate
        })
        setProject({title: "", id: -1})
        setToDoAfter(-1)
        setToDoAfterInputValue("")
        setToDoAfterDebounceValue("")
        setFormChanged(false)
        setShowAdvancedOptions(false)
        setImportance("0")
        setDuration("0")
        if (titleRef.current) {
            titleRef.current.value = ""
        }
    }, [task, contextDueDate])

    useEffect(() => {
        if (isOpen) {
            if (mode === "create") {
                const raw = window.localStorage.getItem("tasks_filters")
                const projectFromSearchParams = (JSON.parse(raw || "{}") as tasksFilters | null)?.selectedProjects

                setProject(projectFromSearchParams && projectFromSearchParams.length === 1 ? projectFromSearchParams[0] : {
                    title: "",
                    id: -1
                })
            }
        } else {
            resetForm()
        }
    }, [isOpen])


    // Reset form state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setFormChanged(false)
        }
    }, [isOpen])

    // Optimized function to handle submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Avoid duplicate submissions
        if (isSubmittingRef.current) return
        isSubmittingRef.current = true

        try {
            const title = titleRef.current?.value || ""
            const importanceValue = Number.parseInt(importance || "0")
            const durationValue = Number.parseInt(duration || "0")

            if (!title.trim()) {
                isSubmittingRef.current = false
                return
            }

            // Prepare data for API
            const taskData = {
                title: title.trim(),
                importance: importanceValue,
                dueDate: dueDate.toISOString(),
                duration: durationValue,
                project: {
                    id: project.id >= 0 ? project.id : -1,
                    title: project.title || ""
                },
                toDoAfterId: toDoAfter > 0 ? toDoAfter : -1,
            }

            // Close modal or reset form based on keepCreating
            if (!keepCreating) {
                closeModal()
            } else {
                resetForm()
            }

            // Use appropriate mutation based on mode
            if (mode === "edit" && task?.id) {
                updateTaskMutation.mutate(
                    { id: task.id, data: taskData },
                    {
                        onSettled: () => {
                            isSubmittingRef.current = false
                        },
                    }
                )
            } else {
                createTaskMutation.mutate(
                    taskData,
                    {
                        onSettled: () => {
                            isSubmittingRef.current = false
                        },
                    }
                )
            }

            resetForm()
        } catch (error) {
            toast.error(`Failed to ${mode === "edit" ? "update" : "create"} task. Try again later.`)
            console.error("Error submitting task:", error)
            isSubmittingRef.current = false
        }
    }

    // Keyboard shortcut handler to submit with Ctrl+Enter
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === "Enter" && isOpen) {
                const form = document.getElementById("task-form") as HTMLFormElement
                if (form) {
                    form.requestSubmit()
                }
            }
        }

        document.addEventListener("keydown", handleKeyPress)
        return () => {
            document.removeEventListener("keydown", handleKeyPress)
        }
    }, [isOpen])

    // Reset submission state when modal opens/closes
    useEffect(() => {
        isSubmittingRef.current = false
    }, [isOpen])

    const handleDateChange = (date: Date | undefined) => {
        if (date) {
            date.setHours(0, 0, 0, 0)
            setDueDate(date)
            setFormChanged(
                (mode === "edit" && task && date.toDateString() !== new Date(task.due).toDateString()) || date.toDateString() !== new Date().toDateString()
            )
        }
        setShowCalendar(false)
    }

    const handleToDoAfterChange = useDebouncedCallback((value: string) => {
        setToDoAfterDebounceValue(value)
    }, 200)

    // Handle dialog close attempt
    const handleCloseAttempt = () => {
        if (formChanged) {
            // Store the close function for later use
            closeDialogRef.current = () => closeModal()
            // Show confirmation dialog
            setShowConfirmDialog(true)
        } else {
            // No changes, close immediately
            closeModal()
        }
    }

    // Handle confirmation dialog result
    const handleConfirmDiscard = () => {
        // Close confirmation dialog
        setShowConfirmDialog(false)
        // Execute the stored close function
        setTimeout(() => {
            closeDialogRef.current()
        }, 100)
    }

    return (
        <>
            <Dialog
                open={isOpen}
                onOpenChange={(newOpenState) => {
                    if (isOpen && !newOpenState) {
                        // Attempting to close
                        handleCloseAttempt()
                    } else {
                        // Opening the dialog
                        openModal()
                    }
                }}
            >
                <DialogContent
                    className=""
                    aria-describedby={undefined}
                    maxHeight="max-h-110"
                >
                    <form id="task-form" onSubmit={handleSubmit}
                          className="space-y-4 h-full flex flex-col justify-between">
                        <main className="space-y-4">
                            <DialogHeader>
                                <DialogTitle>{mode === "edit" ? "Edit Task" : "Create Task"}</DialogTitle>
                            </DialogHeader>
                            <div>
                                <Label htmlFor="title" required>Title</Label>
                                <Input
                                    ref={titleRef}
                                    type="text"
                                    id="title"
                                    name="title"
                                    defaultValue={task?.title || ""}
                                    autoFocus
                                    onChange={() => setFormChanged(
                                        (titleRef.current?.value !== task?.title && mode === "edit") || titleRef.current?.value !== ""
                                    )}
                                />
                            </div>
                            <div className="flex flex-col justify-between lg:flex-row lg:space-x-4">
                                <div className="w-full">
                                    <Label htmlFor="importance" required>Importance</Label>
                                    <Select
                                        name="importance"
                                        value={importance}
                                        onValueChange={(value) => {
                                            setImportance(value)
                                            setFormChanged(
                                                (value !== task?.importance?.toString() && mode === "edit") || value !== "0"
                                            )
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select importance"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {importanceData ? (
                                                importanceData.map((item) => (
                                                    <SelectItem key={item.level} value={item.level.toString()}>
                                                        {item.name}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="-1" disabled>
                                                    Loading...
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="dueDate" required>Due date</Label>
                                    <div className="flex gap-1 items-center">
                                        <DatePicker
                                            value={dueDate}
                                            onChange={(date: Date) => {
                                                setDueDate(date)
                                                setFormChanged(
                                                    (mode === "edit" && task && date.toDateString() !== new Date(task.due).toDateString()) || date.toDateString() !== new Date().toDateString()
                                                )
                                            }}
                                            minDate={new Date()}
                                        />
                                    </div>
                                </div>
                                <div className="w-full">
                                    <Label htmlFor="duration" required>
                                        Duration
                                    </Label>
                                    {
                                        duration === "3" && (
                                            <Help className="ml-1" size="sm">
                                                <p>It is not recommended to mark a task as longer than 60 minutes, consider
                                                    divide it into smaller tasks.</p>
                                            </Help>
                                        )
                                    }
                                    <Select
                                        name="duration"
                                        value={duration}
                                        onValueChange={(value) => {
                                            setDuration(value)
                                            setFormChanged(
                                                (value !== task?.duration?.toString() && mode === "edit") || value !== "0"
                                            )
                                        }}
                                    >
                                        <SelectTrigger ref={durationTriggerRef} className="w-full">
                                            <SelectValue placeholder="Select duration"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {durationData ? (
                                                durationData.map((item) => (
                                                    <SelectItem key={item.level} value={item.level.toString()}>
                                                        {item.name}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="-1" disabled>
                                                    Loading...
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex space-x-4">
                                <SearchProjectsInput
                                    project={project}
                                    setProject={setProject}
                                    defaultValue={project.title}
                                    className="w-full"
                                    label="Project"
                                    enabled={isOpen}
                                />
                            </div>
                            <Collapsible className="w-full" open={showAdvancedOptions}
                                         onOpenChange={setShowAdvancedOptions}>
                                <CollapsibleTrigger className="flex text-sm font-medium text-muted-foreground mb-4">
                                    Advanced Options
                                    <ChevronDown
                                        className={`ml-2 h-4 w-4 duration-300 ${showAdvancedOptions && "rotate-180"}`}/>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-4">
                                    <div className="flex space-x-4">
                                        <div className="w-full">
                                            <Label htmlFor="task" className="flex items-center space-x-2 pb-1">
                                                To do before
                                                <Tooltip
                                                    tooltip={`Select a task that needs to be done before this task.<br/>For example, if you are ${mode === 'edit' ? "editing" : "creating"} a Task B that needs to be done after a Task A, enter the title of the Task A here.`}>
                                                    <CircleHelp className="ml-1 size-4 text-muted-foreground"/>
                                                </Tooltip>
                                            </Label>
                                            <Input
                                                type="text"
                                                id="task"
                                                name="task"
                                                value={toDoAfterInputValue}
                                                onChange={(e) => {
                                                    setToDoAfterInputValue(e.target.value)
                                                    handleToDoAfterChange(e.target.value)
                                                    setFormChanged(
                                                        (mode === "edit" && task && e.target.value !== task.project?.title) || e.target.value !== ""
                                                    )
                                                }}
                                            />
                                            {toDoAfterInputValue && !(tasks && tasks.length == 1 && tasks[0].id == toDoAfter) && (
                                                <div
                                                    className="mt-1 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
                                                    {isLoadingTasks ? (
                                                        <div className="p-2 text-sm text-muted-foreground">Loading
                                                            tasks...</div>
                                                    ) : isErrorTasks ? (
                                                        <div className="p-2 text-sm text-destructive">Error loading
                                                            tasks</div>
                                                    ) : tasks && tasks.length > 0 ? (
                                                        <ul className="py-1">
                                                            {tasks.map((currentTask, index) => (
                                                                <li
                                                                    key={index}
                                                                    className="cursor-pointer px-3 py-2 text-sm lg:hover:bg-accent"
                                                                    onClick={() => {
                                                                        setToDoAfterInputValue(currentTask.title)
                                                                        setToDoAfterDebounceValue(currentTask.title)
                                                                        setToDoAfter(currentTask.id)
                                                                        setTimeout(() => {
                                                                            if (durationTriggerRef.current) {
                                                                                durationTriggerRef.current.focus()
                                                                            }
                                                                        }, 0)
                                                                    }}
                                                                >
                                                                    {currentTask.title}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <div className="p-2 text-sm text-muted-foreground">No tasks
                                                            found</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        </main>
                        <DialogFooter className="w-full sm:justify-between">
                            <div className={"flex items-center gap-2"}>
                                <Checkbox
                                    id={"keep-creating"}
                                    checked={keepCreating}
                                    onCheckedChange={() => setKeepCreating(!keepCreating)}
                                />
                                <label htmlFor={"keep-creating"}>
                                    Keep creating tasks ?
                                </label>
                            </div>
                            <Button type="submit">{mode === "edit" ? "Save" : "Create"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Separate confirmation dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Are you sure you want to close without saving?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDiscard}>Discard</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
