"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
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
            <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-4">
                            <Skeleton className="h-6 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-4">
                    <p className="text-destructive">Failed to load deleted tasks</p>
                </CardContent>
            </Card>
        )
    }

    if (!tasks || tasks.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No deleted tasks found</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {tasks.map((task: Task.Task.TaskWithNonRecursiveRelations) => (
                <Card key={task.id} className="relative">
                    <CardContent className="p-4">
                        <div className="space-y-3">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-1">
                                    <h3 className="font-semibold">{task.title}</h3>
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        {task.project && (
                                            <p>Project: {task.project.title}</p>
                                        )}
                                        {task.due && (
                                            <p>Due: {new Date(task.due).toLocaleDateString()}</p>
                                        )}
                                        {task.importanceDetails && (
                                            <p>Importance: {task.importanceDetails.name}</p>
                                        )}
                                        {task.durationDetails && (
                                            <p>Duration: {task.durationDetails.name}</p>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => recoverTask(task.id)}
                                    className="flex items-center gap-2"
                                >
                                    <Undo2 className="size-4" />
                                    Recover
                                </Button>
                            </div>
                            {task.deleted_at && (
                                <p className="text-xs text-muted-foreground">
                                    Deleted on {new Date(task.deleted_at).toLocaleDateString()} at {new Date(task.deleted_at).toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
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
            <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-4">
                            <Skeleton className="h-20 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-4">
                    <p className="text-destructive">Failed to load deleted notes</p>
                </CardContent>
            </Card>
        )
    }

    const notes = notesData?.notes || []

    if (notes.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No deleted notes found</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {notes.map((note: Note.Note.Select) => (
                <Card key={note.id} className="relative">
                    <CardContent className="p-4">
                        <div className="space-y-3">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                    <h3 className="font-semibold">{note.title}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                        {note.salt && note.iv ? (
                                            <span className="italic">Encrypted content</span>
                                        ) : (
                                            note.content
                                        )}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => recoverNote(note.id)}
                                    className="flex items-center gap-2"
                                >
                                    <Undo2 className="size-4" />
                                    Recover
                                </Button>
                            </div>
                            {note.deleted_at && (
                                <p className="text-xs text-muted-foreground">
                                    Deleted on {new Date(note.deleted_at).toLocaleDateString()} at {new Date(note.deleted_at).toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
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
            <TabsContent value="tasks" className="mt-6">
                <DeletedTasksList />
            </TabsContent>
            <TabsContent value="notes" className="mt-6">
                <DeletedNotesList />
            </TabsContent>
        </Tabs>
    )
}
