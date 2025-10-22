"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useSWR from "swr"
import { useUser } from "@/hooks/use-user"
import { Skeleton } from "@/components/ui/skeleton"
import type { Task, Note } from "@/lib/db/schema"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useSWRConfig } from "swr"
import { Undo2 } from "lucide-react"

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
    const { mutate } = useSWRConfig()
    const { data: tasks, error, isLoading } = useSWR(
        user?.api_key ? ["/api/task/recover?limit=100", user.api_key] : null,
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
                body: JSON.stringify({ id: taskId })
            })

            if (!response.ok) throw new Error("Failed to recover task")

            toast.success("Task recovered successfully")
            mutate(["/api/task/recover?limit=100", user.api_key])
            mutate((key) => typeof key === "string" && key.startsWith("/api/task"))
        } catch (error) {
            console.error("Error recovering task:", error)
            toast.error("Failed to recover task")
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-1">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        )
    }

    if (error) {
        return <p className="text-destructive text-sm p-2">Failed to load deleted tasks</p>
    }

    if (!tasks || tasks.length === 0) {
        return <p className="text-muted-foreground text-sm p-2 text-center">No deleted tasks found</p>
    }

    return (
        <div className="space-y-1">
            {tasks.map((task: Task.Task.TaskWithNonRecursiveRelations) => (
                <div key={task.id} className="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <p className="font-medium truncate">{task.title}</p>
                            {task.deleted_at && (
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                    (Deleted: {new Date(task.deleted_at).toLocaleDateString()})
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                            {task.project && <span>Project: {task.project.title}</span>}
                            {task.importanceDetails && <span>Importance: {task.importanceDetails.name}</span>}
                            {task.due && <span>Due: {new Date(task.due).toLocaleDateString()}</span>}
                            {task.duration !== undefined ? <span>Duration: {task.durationDetails.name}</span> : null}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => recoverTask(task.id)}
                        className="flex items-center gap-1.5 h-8 shrink-0"
                    >
                        <Undo2 className="size-3.5" />
                        <span className="text-xs">Recover</span>
                    </Button>
                </div>
            ))}
        </div>
    )
}

function DeletedNotesList() {
    const user = useUser().user
    const { mutate } = useSWRConfig()
    const { data: notesData, error, isLoading } = useSWR(
        user?.api_key ? ["/api/note/recover?limit=100", user.api_key] : null,
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
                body: JSON.stringify({ id: noteId })
            })

            if (!response.ok) throw new Error("Failed to recover note")

            toast.success("Note recovered successfully")
            mutate(["/api/note/recover?limit=100", user.api_key])
            mutate((key) => typeof key === "string" && key.startsWith("/api/note"))
        } catch (error) {
            console.error("Error recovering note:", error)
            toast.error("Failed to recover note")
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-1">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        )
    }

    if (error) {
        return <p className="text-destructive text-sm p-2">Failed to load deleted notes</p>
    }

    const notes = notesData?.notes || []

    if (notes.length === 0) {
        return <p className="text-muted-foreground text-sm p-2 text-center">No deleted notes found</p>
    }

    return (
        <div className="space-y-1">
            {notes.map((note: Note.Note.Select) => (
                <div key={note.id} className="flex items-start justify-between gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
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
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => recoverNote(note.id)}
                        className="flex items-center gap-1.5 h-8 shrink-0"
                    >
                        <Undo2 className="size-3.5" />
                        <span className="text-xs">Recover</span>
                    </Button>
                </div>
            ))}
        </div>
    )
}

export function TrashContent() {
    const [activeTab, setActiveTab] = useState<"tasks" | "notes">("tasks")

    return (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "tasks" | "notes")}>
            <TabsList className="w-full h-fit md:h-10 flex-col md:flex-row">
                <TabsTrigger value="tasks" className={"w-full"}>Tasks</TabsTrigger>
                <TabsTrigger value="notes" className={"w-full"}>Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="tasks" className="mt-4">
                <DeletedTasksList />
            </TabsContent>
            <TabsContent value="notes" className="mt-4">
                <DeletedNotesList />
            </TabsContent>
        </Tabs>
    )
}
