"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TasksCard } from "@/components/big/tasks/tasks-card"
import { NotesCard } from "@/components/big/notes/notes-card"

export function TrashContent() {
    const [activeTab, setActiveTab] = useState<"tasks" | "notes">("tasks")

    return (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "tasks" | "notes")}>
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="tasks" className="mt-6">
                <TasksCard 
                    initialCompleted={undefined}
                    limit={100}
                    orderBy="deleted_at"
                    orderingDirection="desc"
                    withProject={true}
                    isTrash={true}
                />
            </TabsContent>
            <TabsContent value="notes" className="mt-6">
                <NotesCard 
                    limit={100}
                    orderBy="deleted_at"
                    orderingDirection="desc"
                    isTrash={true}
                />
            </TabsContent>
        </Tabs>
    )
}
