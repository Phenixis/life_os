"use client"

import {useState} from "react"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import useSWR, {useSWRConfig} from "swr"
import {useUser} from "@/hooks/use-user"
import {Skeleton} from "@/components/ui/skeleton"
import type {Note, Task} from "@/lib/db/schema"
import {Button} from "@/components/ui/button"
import {toast} from "sonner"
import {Trash2, Undo2} from "lucide-react"
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
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

const fetcher = async (url: string, apiKey: string) => {
    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${apiKey}`
        }
    })
    if (!response.ok) throw new Error("Failed to fetch")
    return response.json()
}

function DeletedTasksList() {
    const user = useUser().user
    const {mutate} = useSWRConfig()
    const [page, setPage] = useState(1)
    const [taskToDelete, setTaskToDelete] = useState<number | null>(null)
    const limit = 15

    const {data: tasksData, error, isLoading} = useSWR(
        user?.api_key ? [`/api/task/recover?limit=${limit}&page=${page}`, user.api_key] : null,
        ([url, apiKey]) => fetcher(url, apiKey)
    )

    const recoverTask = async (taskId: number) => {
        if (!user?.api_key) return

        try {
            const response = await fetch("/api/task/recover", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.api_key}`
                },
                body: JSON.stringify({id: taskId})
            })

            if (!response.ok) throw new Error("Failed to recover task")

            toast.success("Task recovered successfully")
            mutate([`/api/task/recover?limit=${limit}&page=${page}`, user.api_key])
            mutate((key) => typeof key === "string" && key.startsWith("/api/task"))
        } catch (error) {
            console.error("Error recovering task:", error)
            toast.error("Failed to recover task")
        }
    }

    const permanentlyDeleteTask = async (taskId: number) => {
        if (!user?.api_key) return

        try {
            const response = await fetch(`/api/task/recover?id=${taskId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${user.api_key}`
                }
            })

            if (!response.ok) throw new Error("Failed to permanently delete task")

            toast.success("Task permanently deleted")
            mutate([`/api/task/recover?limit=${limit}&page=${page}`, user.api_key])
            mutate((key) => typeof key === "string" && key.startsWith("/api/task"))
        } catch (error) {
            console.error("Error permanently deleting task:", error)
            toast.error("Failed to permanently delete task")
        } finally {
            setTaskToDelete(null)
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-1">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full"/>
                ))}
            </div>
        )
    }

    if (error) {
        return <p className="text-destructive text-sm p-2">Failed to load deleted tasks</p>
    }

    const tasks = tasksData?.tasks || []
    const totalPages = tasksData?.totalPages || 1

    if (tasks.length === 0) {
        return <p className="text-muted-foreground text-sm p-2 text-center">No deleted tasks found</p>
    }

    return (
        <>
            {totalPages > 1 && (
                <div className="mt-4 px-2 flex justify-between">
                    <Pagination>
                        <PaginationPrevious
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                        <PaginationContent className="w-full gap-6 justify-center">
                            <PaginationItem>
                                <PaginationLink
                                    onClick={() => setPage(1)}
                                    isActive={page === 1}
                                >
                                    1
                                </PaginationLink>
                            </PaginationItem>
                            {page > 1 && (
                                <>
                                    <PaginationItem>
                                        <PaginationEllipsis/>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationLink isActive>{page}</PaginationLink>
                                    </PaginationItem>
                                </>
                            )}
                            {page < totalPages && (
                                <>
                                    <PaginationItem>
                                        <PaginationEllipsis/>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationLink
                                            onClick={() => setPage(totalPages)}
                                            isActive={page === totalPages}
                                        >
                                            {totalPages}
                                        </PaginationLink>
                                    </PaginationItem>
                                </>
                            )}
                        </PaginationContent>
                        <PaginationNext
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                    </Pagination>
                </div>
            )}
            <div className="space-y-1">
                {tasks.map((task: Task.Task.TaskWithNonRecursiveRelations) => (
                    <div key={task.id}
                         className="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                                <p className="font-medium text-sm truncate">{task.title}</p>
                                {task.deleted_at && (
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {new Date(task.deleted_at).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                                {task.project && <span>Project: {task.project.title}</span>}
                                {task.importanceDetails && <span>• {task.importanceDetails.name}</span>}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => recoverTask(task.id)}
                                className="flex items-center gap-1.5 h-8"
                            >
                                <Undo2 className="size-3.5"/>
                                <span className="text-xs">Recover</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setTaskToDelete(task.id)}
                                className="flex items-center gap-1.5 h-8 text-destructive hover:text-destructive"
                            >
                                <Trash2 className="size-3.5"/>
                                <span className="text-xs">Delete</span>
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <AlertDialog open={taskToDelete !== null} onOpenChange={(open) => !open && setTaskToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Permanently delete task?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the task from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => taskToDelete && permanentlyDeleteTask(taskToDelete)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

function DeletedNotesList() {
    const user = useUser().user
    const {mutate} = useSWRConfig()
    const [page, setPage] = useState(1)
    const [noteToDelete, setNoteToDelete] = useState<number | null>(null)
    const limit = 15

    const {data: notesData, error, isLoading} = useSWR(
        user?.api_key ? [`/api/note/recover?limit=${limit}&page=${page}`, user.api_key] : null,
        ([url, apiKey]) => fetcher(url, apiKey)
    )

    const recoverNote = async (noteId: number) => {
        if (!user?.api_key) return

        try {
            const response = await fetch("/api/note/recover", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.api_key}`
                },
                body: JSON.stringify({id: noteId})
            })

            if (!response.ok) throw new Error("Failed to recover note")

            toast.success("Note recovered successfully")
            mutate([`/api/note/recover?limit=${limit}&page=${page}`, user.api_key])
            mutate((key) => typeof key === "string" && key.startsWith("/api/note"))
        } catch (error) {
            console.error("Error recovering note:", error)
            toast.error("Failed to recover note")
        }
    }

    const permanentlyDeleteNote = async (noteId: number) => {
        if (!user?.api_key) return

        try {
            const response = await fetch(`/api/note/recover?id=${noteId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${user.api_key}`
                }
            })

            if (!response.ok) throw new Error("Failed to permanently delete note")

            toast.success("Note permanently deleted")
            mutate([`/api/note/recover?limit=${limit}&page=${page}`, user.api_key])
            mutate((key) => typeof key === "string" && key.startsWith("/api/note"))
        } catch (error) {
            console.error("Error permanently deleting note:", error)
            toast.error("Failed to permanently delete note")
        } finally {
            setNoteToDelete(null)
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-1">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full"/>
                ))}
            </div>
        )
    }

    if (error) {
        return <p className="text-destructive text-sm p-2">Failed to load deleted notes</p>
    }

    const notes = notesData?.notes || []
    const totalPages = notesData?.totalPages || 1

    if (notes.length === 0) {
        return <p className="text-muted-foreground text-sm p-2 text-center">No deleted notes found</p>
    }

    return (
        <>
            {totalPages > 1 && (
                <div className="mt-4 px-2 flex justify-between">
                    <Pagination>
                        <PaginationPrevious
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                        <PaginationContent className="w-full gap-6 justify-center">
                            <PaginationItem>
                                <PaginationLink
                                    onClick={() => setPage(1)}
                                    isActive={page === 1}
                                >
                                    1
                                </PaginationLink>
                            </PaginationItem>
                            {page > 1 && (
                                <>
                                    <PaginationItem>
                                        <PaginationEllipsis/>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationLink isActive>{page}</PaginationLink>
                                    </PaginationItem>
                                </>
                            )}
                            {page < totalPages && (
                                <>
                                    <PaginationItem>
                                        <PaginationEllipsis/>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationLink
                                            onClick={() => setPage(totalPages)}
                                            isActive={page === totalPages}
                                        >
                                            {totalPages}
                                        </PaginationLink>
                                    </PaginationItem>
                                </>
                            )}
                        </PaginationContent>
                        <PaginationNext
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                    </Pagination>
                </div>
            )}
            <div className="space-y-1">
                {notes.map((note: Note.Note.Select) => (
                    <div key={note.id}
                         className="flex items-start justify-between gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap">
                                <p className="font-medium text-sm truncate">{note.title}</p>
                                {note.deleted_at && (
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {new Date(note.deleted_at).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {note.salt && note.iv ? (
                                    <span className="italic">Encrypted content</span>
                                ) : (
                                    note.content
                                )}
                            </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => recoverNote(note.id)}
                                className="flex items-center gap-1.5 h-8"
                            >
                                <Undo2 className="size-3.5"/>
                                <span className="text-xs">Recover</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setNoteToDelete(note.id)}
                                className="flex items-center gap-1.5 h-8 text-destructive hover:text-destructive"
                            >
                                <Trash2 className="size-3.5"/>
                                <span className="text-xs">Delete</span>
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <AlertDialog open={noteToDelete !== null} onOpenChange={(open) => !open && setNoteToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Permanently delete note?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the note from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => noteToDelete && permanentlyDeleteNote(noteToDelete)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export function TrashContent() {
    const [activeTab, setActiveTab] = useState<"tasks" | "notes">("tasks")

    return (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "tasks" | "notes")}>
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="tasks" className="mt-4">
                <DeletedTasksList/>
            </TabsContent>
            <TabsContent value="notes" className="mt-4">
                <DeletedNotesList/>
            </TabsContent>
        </Tabs>
    )
}
