"use client"

import { Project } from "@/lib/db/schema";
import { useTasks } from "@/hooks/use-tasks";
import { useNotes } from "@/hooks/use-notes";
import TaskDisplay from "../tasks/task-display";
import NoteDisplay from "../notes/note-display";

export function ProjectsTasksAndNotesFilterBar({
    project
}: {
    project: Project.Select
}) {

    const { tasks, isLoading: isLoadingTasks, isError: tasksError } = useTasks({
        selectedProjects: [project.id]
    });

    const { notes: notesData, isLoading: isLoadingNotes, isError: notesError } = useNotes({
        selectedProjects: [project.id]
    });

    if (tasksError || notesError) {
        return (
            <div className="text-destructive">
                Error loading data
            </div>
        );
    }

    return (
        <div className="space-y-4 flex flex-col lg:flex-row items-start justify-between gap-6">
            <div className="w-full">
                <h3 className="font-medium mb-2">Tasks ({isLoadingTasks ? '?' : tasks?.length || 0})</h3>
                {isLoadingTasks ? (
                    <div className="text-muted-foreground text-sm">Loading tasks...</div>
                ) : tasks && tasks.length > 0 ? (
                    <ul className="space-y-1">
                        {tasks.map((task) => (
                            <TaskDisplay key={task.id} task={task} />
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground text-sm">No tasks</p>
                )}
            </div>

            <div className="w-full">
                <h3 className="font-medium mb-2">Notes ({isLoadingNotes ? '?' : notesData?.notes?.length || 0})</h3>
                {isLoadingNotes ? (
                    <div className="text-muted-foreground text-sm">Loading notes...</div>
                ) : notesData?.notes && notesData.notes.length > 0 ? (
                    <ul className="space-y-1">
                        {notesData.notes.map((note) => (
                            <NoteDisplay key={note.id} note={note} />
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground text-sm">No notes</p>
                )}
            </div>
        </div>
    )
}