"use client"

import type React from "react"

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Project, Task } from "@/lib/db/schema"
import { PlusIcon, PenIcon, Minus, Plus, ChevronDown, CircleHelp } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import { useSWRConfig } from "swr"
import { Calendar, TaskCount } from "@/components/ui/calendar"
import { calculateUrgency } from "@/lib/utils/task"
import { format } from "date-fns"
import { useDebouncedCallback } from "use-debounce"
import { useSearchTasks } from "@/hooks/use-search-tasks"
import { useImportanceAndDuration } from "@/hooks/use-importance-and-duration"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
import Tooltip from "../tooltip"
import { useSearchParams } from "next/navigation"
import { useUser } from "@/hooks/use-user"
import { toast } from "sonner"
import { TASK_PARAMS } from "./tasks-card"
import SearchProjectsInput from "../projects/search-projects-input"
import Help from "../help"

export default function TaskModal({
	className,
	task,
	isOpen,
	onOpenChange,
	children,
}: {
	className?: string
	task?: Task.Task.TaskWithRelations
	isOpen?: boolean
	onOpenChange?: (open: boolean) => void
	children?: React.ReactNode
}) {
	const user = useUser().user;
	const searchParams = useSearchParams()

	// State management for the dialog
	const mode = task ? "edit" : "create"
	const [internalOpen, setInternalOpen] = useState(false)
	
	// Use external control if provided, otherwise use internal state
	const open = isOpen !== undefined ? isOpen : internalOpen
	const setOpen = onOpenChange || setInternalOpen

	// State management for form fields
	const [dueDate, setDueDate] = useState<Date>(() => {
		const initialDate = task ? new Date(task.due) : new Date()
		initialDate.setHours(0, 0, 0, 0)
		return initialDate
	})
	const [showCalendar, setShowCalendar] = useState(false)
	const calendarRef = useRef<HTMLDivElement>(null)

	const [project, setProject] = useState<string>(task && task.project_title ? task.project_title : "")

	const [toDoAfter, setToDoAfter] = useState<number>(task && task.tasksToDoAfter && task.tasksToDoAfter.length > 0 && task.tasksToDoAfter[0].deleted_at === null ? task.tasksToDoAfter[0].id : -1)
	const [toDoAfterInputValue, setToDoAfterInputValue] = useState<string>(task && task.tasksToDoAfter && task.tasksToDoAfter.length > 0 && task.tasksToDoAfter[0].deleted_at === null ? task.tasksToDoAfter[0].title : "")
	const [toDoAfterDebounceValue, setToDoAfterDebounceValue] = useState<string>(task && task.tasksToDoAfter && task.tasksToDoAfter.length > 0 && task.tasksToDoAfter[0].deleted_at === null ? task.tasksToDoAfter[0].title : "")
	const { tasks, isLoading: isLoadingTasks, isError: isErrorTasks } = useSearchTasks({
		query: toDoAfterDebounceValue, limit: 5, excludeIds: task ? [
			task.id,
			task.tasksToDoBefore ? task.tasksToDoBefore.map((task) => task.id) : -1,
		].flat() : []
	})

	const { importanceData, durationData } = useImportanceAndDuration()
	const { mutate } = useSWRConfig()
	const [formChanged, setFormChanged] = useState(false)
	const [showConfirmDialog, setShowConfirmDialog] = useState(false)
	const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

	// Use refs to access field values
	const closeDialogRef = useRef<() => void>(() => { })
	const titleRef = useRef<HTMLInputElement>(null)
	const importanceRef = useRef<string>(task?.importance?.toString() || "0")
	const durationRef = useRef<string>(task?.duration?.toString() || "0")
	const durationTriggerRef = useRef<HTMLButtonElement>(null)

	// Track if a submission is in progress (to prevent duplicates)
	const isSubmittingRef = useRef(false)

	const resetForm = () => {
		setDueDate(() => {
			const initialDate = task ? new Date(task.due) : new Date()
			initialDate.setHours(0, 0, 0, 0)
			return initialDate
		})
		setProject("")
		setToDoAfter(-1)
		setToDoAfterInputValue("")
		setToDoAfterDebounceValue("")
		setFormChanged(false)
		setShowAdvancedOptions(false)
	}

	useEffect(() => {
		if (open) {
			if (project === "") {
				if (task && task.project_title) {
					setProject(task.project_title)
				} else {
					const projectFromSearchParams = searchParams.get(TASK_PARAMS.PROJECTS) ? searchParams.get(TASK_PARAMS.PROJECTS)?.split(",") : []
					setProject(projectFromSearchParams && projectFromSearchParams.length === 1 ? projectFromSearchParams[0] : "")
				}
			}
		} else {
			resetForm()
		}
	}, [open, searchParams, task, project])

	// Close calendar when clicking outside
	useEffect(() => {
		if (!showCalendar) return

		const handleClickOutside = (event: MouseEvent) => {
			if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
				setShowCalendar(false)
			}
		}

		document.addEventListener("mousedown", handleClickOutside)
		return () => {
			document.removeEventListener("mousedown", handleClickOutside)
		}
	}, [showCalendar])

	// Reset form state when dialog opens
	useEffect(() => {
		if (open) {
			setFormChanged(false)
		}
	}, [open])

	// Optimized function to handle submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		// Avoid duplicate submissions
		if (isSubmittingRef.current) return
		isSubmittingRef.current = true

		try {
			const title = titleRef.current?.value || ""
			const importance = Number.parseInt(importanceRef.current || "0")
			const duration = Number.parseInt(durationRef.current || "0")
			const id = task?.id

			if (!title.trim()) {
				isSubmittingRef.current = false
				return
			}

			const urgency = calculateUrgency(dueDate)
			const score = importance * urgency - duration
			const todoData = {
				id: mode === "edit" ? id : -1,
				title,
				importance,
				urgency,
				duration,
				score,
				due: dueDate,
				project_title: project,
				created_at: mode === "create" ? new Date() : task?.created_at,
				updated_at: new Date(),
				deleted_at: task?.deleted_at || null,
				completed_at: task?.completed_at || null,
				project: {
					title: project,
					completed: false,
					created_at: new Date(),
					updated_at: new Date(),
				} as Project.Select,
				importanceDetails: {
					level: importance,
					name: importanceData?.find((item) => item.level === importance)?.name || "",
				},
				durationDetails: {
					level: duration,
					name: durationData?.find((item) => item.level === duration)?.name || "",
				},
				tasksToDoAfter: tasks?.filter((task) => task.id === toDoAfter).map((task) => ({
					...task
				})) || [],
				tasksToDoBefore: task?.tasksToDoBefore || [],
				recursive: true,
			} as Task.Task.TaskWithRelations

			setOpen(false)

			mutate(
				(key: unknown) => typeof key === "string" && (key === "/api/task/count" || key.startsWith("/api/task/count?")),
				async (currentData: unknown): Promise<TaskCount[] | unknown> => {
					if (!Array.isArray(currentData)) return currentData

					if (mode === "create") {

						const updatedData: TaskCount[] = currentData.map((item: TaskCount) => {
							if (new Date(item.due).toDateString() === new Date(todoData.due).toDateString()) {
								return {
									...item,
									uncompleted_count: Number(item.uncompleted_count) + 1,
								}
							}
							return item
						})

						if (!updatedData.some((item) => new Date(item.due).toDateString() === new Date(todoData.due).toDateString())) {
							updatedData.push({
								due: todoData.due.toISOString(),
								uncompleted_count: 1,
								completed_count: 0,
							})
						}

						return updatedData
					} else {
						let updatedData: TaskCount[]
						if (todoData.completed_at) {
							updatedData = currentData.map((item: TaskCount) => {
								if (new Date(item.due).toDateString() === new Date(todoData.due).toDateString()) {
									return {
										...item,
										completed_count: Number(item.completed_count) + 1,
									}
								} else if (task?.due && new Date(item.due).toDateString() === new Date(task?.due).toDateString()) {
									return {
										...item,
										completed_count: Number(item.completed_count) - 1,
									}
								}
								return item
							})

							if (!updatedData.some((item) => new Date(item.due).toDateString() === new Date(todoData.due).toDateString())) {
								updatedData.push({
									due: todoData.due.toISOString(),
									uncompleted_count: 0,
									completed_count: 1,
								})
							}
						} else {
							updatedData = currentData.map((item: TaskCount) => {
								if (new Date(item.due).toDateString() === new Date(todoData.due).toDateString()) {
									return {
										...item,
										uncompleted_count: Number(item.uncompleted_count) + 1,
									}
								} else if (task?.due && new Date(item.due).toDateString() === new Date(task?.due).toDateString()) {
									return {
										...item,
										uncompleted_count: Number(item.uncompleted_count) - 1,
									}
								}
								return item
							})

							if (!updatedData.some((item) => new Date(item.due).toDateString() === new Date(todoData.due).toDateString())) {
								updatedData.push({
									due: todoData.due.toISOString(),
									uncompleted_count: 1,
									completed_count: 0,
								})
							}
						}

						return updatedData
					}
				},
				{ revalidate: false },
			)

			mutate(
				(key: unknown) => typeof key === "string" && (key === "/api/task" || key.startsWith("/api/task?")),
				async (currentData: unknown): Promise<Task.Task.TaskWithRelations[] | unknown> => {
					if (!Array.isArray(currentData)) return currentData

					let updatedData: Task.Task.TaskWithRelations[]
					if (mode === "edit") {
						updatedData = currentData.map((item: Task.Task.TaskWithRelations) => (item.id === id ? todoData : item.id === toDoAfter ? {
							...item,
							tasksToDoBefore: [
								...(item.tasksToDoBefore ?? []),
								{
									...todoData,
									tasksToDoAfter: todoData.tasksToDoAfter?.map((task) => ({
										id: -1,
										task_id: task.id,
										after_task_id: item.id,
										created_at: new Date(),
										updated_at: new Date(),
										deleted_at: null,
									})),
									recursive: false,
								} as Task.Task.TaskWithNonRecursiveRelations,
							],
						} : item
						))
					} else {
						updatedData = [todoData, ...currentData]
					}

					const filteredData: Task.Task.TaskWithRelations[] = updatedData.filter((item: Task.Task.TaskWithRelations) => {
						const dueBeforeFromSearchParams = searchParams.get(TASK_PARAMS.DUE_BEFORE)
						const projectsFromSearchParams = searchParams.get(TASK_PARAMS.PROJECTS) ? searchParams.get(TASK_PARAMS.PROJECTS)?.split(",") : []
						const completedFromSearchParams = searchParams.get(TASK_PARAMS.COMPLETED)
						if (completedFromSearchParams && completedFromSearchParams === "false") {
							if (item.completed_at) return false
						}
						if (dueBeforeFromSearchParams && item.due > new Date(dueBeforeFromSearchParams)) return false
						if (projectsFromSearchParams && projectsFromSearchParams.length > 0) {
							return projectsFromSearchParams.some((project: string) => item.project_title === project)
						}
						return true
					})

					const orderByFromSearchParams = searchParams.get(TASK_PARAMS.ORDER_BY) as keyof Task.Task.TaskWithRelations
					const orderingDirectionFromSearchParams = searchParams.get(TASK_PARAMS.ORDERING_DIRECTION) === "asc" ? 1 : -1
					const sortedData: Task.Task.TaskWithRelations[] = filteredData.sort(
						(a: Task.Task.TaskWithRelations, b: Task.Task.TaskWithRelations) => {
							if (orderByFromSearchParams) {
								const aValue = a[orderByFromSearchParams]
								const bValue = b[orderByFromSearchParams]

								if (typeof aValue === "string" && typeof bValue === "string") {
									return orderingDirectionFromSearchParams * aValue.localeCompare(bValue)
								} else if (typeof aValue === "number" && typeof bValue === "number") {
									return orderingDirectionFromSearchParams * (aValue - bValue)
								}
							}
							// Default fallback sorting by score and title
							return orderingDirectionFromSearchParams * (b.score - a.score || (a.title || "").localeCompare(b.title || ""))
						}
					)
					const limitFromSearchParams = searchParams.get(TASK_PARAMS.LIMIT)
					return limitFromSearchParams ? sortedData.slice(0, parseInt(limitFromSearchParams)) : sortedData
				},
				{ revalidate: false },
			)

			fetch("/api/task", {
				method: mode === "edit" ? "PUT" : "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${user?.api_key}`
				},
				body: JSON.stringify({
					id: mode === "edit" ? id : undefined,
					title,
					importance,
					dueDate: dueDate.toISOString(),
					duration,
					projectTitle: project,
					toDoAfterId: toDoAfter,
				}),
			})
				.then((response) => {
					if (!response.ok) {
						throw new Error(`Erreur HTTP: ${response.status}`)
					}
					return response.json()
				})
				.then(() => {
				})
				.catch((error) => {
					console.error("Erreur lors de l'opération:", error)
				})

			resetForm();
			toast.success(`Task ${mode === "edit" ? "updated" : "created"} successfully`)
			
			// Invalidate all task-related cache keys to ensure calendar and other components refresh
			mutate((key) => {
				if (typeof key === "string") {
					return key.startsWith("/api/task") || 
						   key.startsWith("/api/number-of-tasks") ||
						   key === "/api/task/count" ||
						   key.startsWith("/api/task/count?")
				}
				return false
			})
		} catch (error) {
			toast.error(`Failed to ${mode === "edit" ? "update" : "create"} task. Try again later.`)
			console.error("Erreur lors de la soumission:", error)
			isSubmittingRef.current = false
		}
	}

	// Keyboard shortcut handler to submit with Ctrl+Enter
	useEffect(() => {
		const handleKeyPress = (event: KeyboardEvent) => {
			if (event.ctrlKey && event.key === "Enter" && open) {
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
	}, [open])

	// Reset submission state when modal opens/closes
	useEffect(() => {
		isSubmittingRef.current = false
	}, [open])

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
			closeDialogRef.current = () => setOpen(false)
			// Show confirmation dialog
			setShowConfirmDialog(true)
		} else {
			// No changes, close immediately
			setOpen(false)
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
				open={open}
				onOpenChange={(newOpenState) => {
					if (open && !newOpenState) {
						// Attempting to close
						handleCloseAttempt()
					} else {
						// Opening the dialog
						setOpen(newOpenState)
					}
				}}
			>
				{children ? (
					<DialogTrigger asChild>
						{children}
					</DialogTrigger>
				) : (
					<DialogTrigger className={cn(mode === "edit" && "h-fit", className)} asChild>
						{mode === "edit" ? (
							<PenIcon className="min-w-[16px] max-w-[16px] min-h-[24px] max-h-[24px] cursor-pointer" />
						) : (
							<Button
								variant="outline"
								size="sm"
								tooltip="Create a new task"
								className="h-10 px-2 flex items-center border-none"
							>
								<PlusIcon className="min-w-[24px] max-w-[24px] min-h-[24px]" />
							</Button>
						)}
					</DialogTrigger>
				)}
				<DialogContent
					className="sm:max-w-2xl"
					aria-describedby={undefined}
				>
					<DialogHeader>
						<DialogTitle>{mode === "edit" ? "Edit Task" : "Create Task"}</DialogTitle>
					</DialogHeader>
					<form id="task-form" onSubmit={handleSubmit} className="space-y-4">
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
									defaultValue={task?.importance?.toString() || "0"}
									onValueChange={(value) => {
										importanceRef.current = value
										setFormChanged(
											(value !== task?.importance?.toString() && mode === "edit") || value !== "0"
										)
									}}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select importance" />
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
							<div className="relative">
								<Label htmlFor="dueDate" required>Due date</Label>
								<div className="flex gap-1">
									<Button
										type="button"
										variant="outline"
										className="px-2"
										onClick={() => {
											const newDate = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000)
											const today = new Date()
											today.setHours(0, 0, 0, 0)
											if (newDate >= today) {
												setDueDate(newDate)
											} else {
												setDueDate(today)
											}
											setFormChanged(
												(mode === "edit" && task && newDate.toDateString() !== new Date(task.due).toDateString()) || newDate.toDateString() !== new Date().toDateString()
											)
										}}
									>
										<Minus />
									</Button>
									<Button
										type="button"
										variant="outline"
										className="w-full"
										onClick={() => setShowCalendar(!showCalendar)}
									>
										{format(dueDate, "dd/MM/yyyy")}
									</Button>
									<Button
										type="button"
										variant="outline"
										className="px-2"
										onClick={() => {
											const nextDate = new Date(dueDate.getTime() + 24 * 60 * 60 * 1000)
											setDueDate(nextDate)
											setFormChanged(
												(mode === "edit" && task && nextDate.toDateString() !== new Date(task.due).toDateString()) || nextDate.toDateString() !== new Date().toDateString()
											)
										}}
									>
										<Plus />
									</Button>
								</div>

								{showCalendar && (
									<div
										ref={calendarRef}
										className="absolute z-50 mt-1 bg-popover p-3 rounded-md shadow-md border border-border"
									>
										<Calendar
											mode="single"
											selected={dueDate}
											onSelect={handleDateChange}
											disabled={(date) => {
												const today = new Date()
												today.setHours(0, 0, 0, 0)
												return date < today
											}}
										/>
									</div>
								)}
							</div>
							<div className="w-full">
								<Label htmlFor="duration" required>
									Duration
								</Label>
								{
									durationRef.current === "3" && (
										<Help className="ml-1" message="It is not recommended to mark a task as longer than 60 minutes, consider divide it into smaller tasks." size="sm" />
									)
								}
								<Select
									name="duration"
									defaultValue={task?.duration?.toString() || "0"}
									onValueChange={(value) => {
										durationRef.current = value
										setFormChanged(
											(value !== task?.duration?.toString() && mode === "edit") || value !== "0"
										)
									}}
								>
									<SelectTrigger ref={durationTriggerRef} className="w-full">
										<SelectValue placeholder="Select duration" />
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
								defaultValue={project}
								className="w-full"
								label="Project"
								enabled={open}
							/>
						</div>
						<Collapsible className="w-full" open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
							<CollapsibleTrigger className="flex text-sm font-medium text-muted-foreground mb-4">
								Advanced Options
								<ChevronDown className={`ml-2 h-4 w-4 duration-300 ${showAdvancedOptions && "rotate-180"}`} />
							</CollapsibleTrigger>
							<CollapsibleContent className="space-y-4">
								<div className="flex space-x-4">
									<div className="w-full">
										<Label htmlFor="task" className="flex items-center space-x-2 pb-1">
											To do before
											<Tooltip tooltip={`Select a task that needs to be done before this task.<br/>For example, if you are ${mode === 'edit' ? "editing" : "creating"} a Task B that needs to be done after a Task A, enter the title of the Task A here.`}>
												<CircleHelp className="ml-1 size-4 text-muted-foreground" />
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
													(mode === "edit" && task && e.target.value !== task.project_title) || e.target.value !== ""
												)
											}}
										/>
										{toDoAfterInputValue && !(tasks && tasks.length == 1 && tasks[0].id == toDoAfter) && (
											<div className="mt-1 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
												{isLoadingTasks ? (
													<div className="p-2 text-sm text-muted-foreground">Loading tasks...</div>
												) : isErrorTasks ? (
													<div className="p-2 text-sm text-destructive">Error loading tasks</div>
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
													<div className="p-2 text-sm text-muted-foreground">No tasks found</div>
												)}
											</div>
										)}
									</div>
								</div>
							</CollapsibleContent>
						</Collapsible>
						<DialogFooter>
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
