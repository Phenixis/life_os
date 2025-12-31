"use client"

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { useUpdateEntry, useDeleteEntry, useUpdateRelapse, type Entry } from "@/hooks/use-addiction-tracker";

interface EntryDisplayProps {
    entry: Entry;
    addictionId: number;
}

export function EntryDisplay({ entry, addictionId }: EntryDisplayProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(entry.content);
    const [editedRelapseDate, setEditedRelapseDate] = useState(
        entry.created_at ? new Date(entry.created_at).toISOString().slice(0, 16) : ""
    );
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const updateEntry = useUpdateEntry();
    const deleteEntry = useDeleteEntry();
    const updateRelapse = useUpdateRelapse();

    const handleSave = () => {
        if (!editedContent.trim()) return;
        
        setIsEditing(false);

        const newDate = new Date(editedRelapseDate);
        const oldDate = new Date(entry.created_at);
        const dateChanged = newDate.getTime() !== oldDate.getTime();

        // Update entry content
        updateEntry.mutate(
            { id: entry.id, addictionId, data: { content: editedContent } },
            {
                onSuccess: () => {
                    // If entry has relapse_id and date changed, update relapse
                    // The RelapseQueries.update will automatically sync the entry's timestamp
                    if (entry.relapse_id && dateChanged) {
                        updateRelapse.mutate({
                            id: entry.relapse_id,
                            addictionId,
                            data: { created_at: newDate }
                        });
                    }
                },
            }
        );
    };

    const handleDelete = () => {
        setIsDeleteDialogOpen(false)
        deleteEntry.mutate(
            { id: entry.id, addictionId }
        );
    };

    const entryDate = new Date(entry.created_at);

    return (
        <div className={cn("group/entry relative pl-8 pb-6 first:pt-6 pt-1 last:pb-0")}>
            {/* Timeline line */}
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 last:hidden" />

            {/* Timeline dot */}
            <div className={cn(
                "absolute left-px w-4 h-4 rounded-full border-2 border-background top-3 group-first/entry:top-8",
                entry.relapse_id ? "bg-red-500" : "bg-primary"
            )} />

            <div className="flex flex-col justify-between lg:flex-row lg:items-start gap-4 bg-gray-100 dark:bg-gray-900 rounded-md p-2">
                <div className="flex-1">
                    <h4 className="font-medium mb-1 text-sm text-gray-500 dark:text-gray-400">
                        {entryDate.toLocaleDateString()} {entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {entry.relapse_id && (
                            <span className="ml-2 text-red-500 dark:text-red-400 text-xs font-semibold">
                                RELAPSE
                            </span>
                        )}
                    </h4>
                    {isEditing ? (
                        <div className="flex flex-col gap-2">
                            {entry.relapse_id && (
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                        Relapse time:
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        value={editedRelapseDate}
                                        onChange={(e) => setEditedRelapseDate(e.target.value)}
                                        className="flex-1 text-sm"
                                        disabled={updateEntry.isPending || updateRelapse.isPending}
                                    />
                                </div>
                            )}
                            <div className="flex gap-2 items-start">
                                <Input
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    className="flex-1 text-sm"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSave();
                                        if (e.key === "Escape") {
                                            setIsEditing(false);
                                            setEditedContent(entry.content);
                                            setEditedRelapseDate(
                                                entry.created_at ? new Date(entry.created_at).toISOString().slice(0, 16) : ""
                                            );
                                        }
                                    }}
                                    disabled={updateEntry.isPending || updateRelapse.isPending}
                                />
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={handleSave}
                                    disabled={updateEntry.isPending || updateRelapse.isPending}
                                >
                                    {updateEntry.isPending || updateRelapse.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="h-4 w-4 text-green-600" />
                                    )}
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditedContent(entry.content);
                                        setEditedRelapseDate(
                                            entry.created_at ? new Date(entry.created_at).toISOString().slice(0, 16) : ""
                                        );
                                    }}
                                    disabled={updateEntry.isPending || updateRelapse.isPending}
                                >
                                    <X className="h-4 w-4 text-red-600" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            {entry.content}
                        </p>
                    )}
                </div>
                {!isEditing && (
                    <div className="self-end lg:opacity-0 lg:group-hover/entry:opacity-100 flex lg:flex-col lg:items-end">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                        >
                            Edit
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600"
                            onClick={() => setIsDeleteDialogOpen(true)}
                        >
                            Delete
                        </Button>
                    </div>
                )}
            </div>

            <ConfirmationDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete Entry"
                description={`Are you sure you want to delete this entry?${entry.relapse_id ? "\n\nThis entry is associated with a relapse, so the relapse will also be deleted." : ""}\n\nThis action cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
                onConfirm={handleDelete}
            />
        </div>
    );
}
