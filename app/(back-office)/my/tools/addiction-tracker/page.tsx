"use client"

import { AddictionCreator } from "@/components/big/addiction-tracker/addiction-creator";
import { CircularTimer } from "@/components/big/addiction-tracker/circular-timer";
import { EntriesList } from "@/components/big/addiction-tracker/entries-list";
import { JournalEntryForm } from "@/components/big/addiction-tracker/journal-entry-form";
import { RelapseRecorder } from "@/components/big/addiction-tracker/relapse-recorder";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { HorizontalList, HorizontalListSkeleton } from "@/components/ui/horizontal-list";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2, Pencil, Plus, Trash2, X, Check } from "lucide-react";
import { useState, useEffect } from "react";
import {
    useAddictionsQuery,
    useUpdateAddiction,
    useDeleteAddiction,
} from "@/hooks/use-addiction-tracker";

export default function AddictionTrackerPage() {
    const [selectedAddictionId, setSelectedAddictionId] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState("");
    const [editedDescription, setEditedDescription] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isRecordingRelapse, setIsRecordingRelapse] = useState(false);

    // Fetch addictions
    const { addictions, isLoading: isLoadingAddictions } = useAddictionsQuery();

    // Get current addiction from fetched data
    const currentAddiction = addictions.find(a => a.id === selectedAddictionId) ?? null;

    // Mutations
    const updateAddiction = useUpdateAddiction();
    const deleteAddiction = useDeleteAddiction();

    // Auto-select first addiction when data loads
    useEffect(() => {
        if (addictions.length > 0 && selectedAddictionId === null) {
            setSelectedAddictionId(addictions[0].id);
        }
    }, [addictions, selectedAddictionId]);

    // Update edited title and description when current addiction changes
    useEffect(() => {
        if (currentAddiction) {
            setEditedTitle(currentAddiction.title);
            setEditedDescription(currentAddiction.description || "");
        }
    }, [currentAddiction]);

    const handleSaveTitle = () => {
        if (!currentAddiction || !editedTitle.trim()) return;
        setIsEditingTitle(false)
        updateAddiction.mutate(
            { id: currentAddiction.id, data: { title: editedTitle, description: editedDescription.trim() || null } }
        );
    };

    const handleDeleteAddiction = () => {
        if (!currentAddiction) return;
        deleteAddiction.mutate(currentAddiction.id, {
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
                setIsEditingTitle(false);
                setSelectedAddictionId(null);
            },
        });
    };

    return (
        <section className="page max-h-screen overflow-hidden flex flex-col pb-20!">
            <h1 className="page-title">
                Addiction Tracker
            </h1>
            <article className="border rounded-md flex-1 min-h-0 overflow-hidden flex flex-col relative">
                {/* Mobile horizontal list */}
                <div className="lg:hidden">
                    <div className="flex">
                        <button
                            className={cn(
                                "sticky right-0 px-3 py-4 border-r border-b bg-background",
                                "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
                                "flex items-center justify-center transition-colors",
                                isCreating && "bg-primary/10"
                            )}
                            onClick={() => {
                                setIsCreating(!isCreating);
                            }}
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                        <div className="flex-1 overflow-hidden">
                            {isLoadingAddictions ? (
                                <HorizontalListSkeleton className="border-b" itemCount={4} />
                            ) : (
                                <HorizontalList
                                    itemsName={addictions.map(a => a.title)}
                                    onClick={(name) => {
                                        const addiction = addictions.find(a => a.title === name);
                                        if (addiction) {
                                            setSelectedAddictionId(addiction.id);
                                            setIsCreating(false);
                                        }
                                    }}
                                    activeItemName={currentAddiction?.title || ""}
                                    className="border-b"
                                />
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-1 min-h-0">
                    <aside className="hidden lg:flex flex-1 max-w-60 flex-col gap-2 border-r overflow-auto scrollbar-hide px-2 py-4">
                        {/* Create addiction button */}
                        <button
                            className={cn(
                                "w-full rounded-md p-2 border-2 border-dashed border-gray-400 dark:border-gray-600",
                                "bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400",
                                "hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:border-gray-500 dark:hover:border-gray-500",
                                "transition-colors cursor-pointer flex items-center justify-center gap-2",
                                isCreating && "bg-primary/10 border-primary/50"
                            )}
                            onClick={() => {
                                setIsCreating(!isCreating);
                            }}
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add addiction</span>
                        </button>
                        {isLoadingAddictions ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            </div>
                        ) : (
                            addictions.map((addiction) => (
                                <p
                                    key={addiction.id}
                                    className={cn(
                                        "w-full bg-gray-200 rounded-md p-2 dark:bg-gray-800 text-center transition-colors cursor-pointer",
                                        selectedAddictionId === addiction.id ? "bg-gray-400 dark:bg-gray-600" : "hover:bg-gray-300 dark:hover:bg-gray-600"
                                    )}
                                    onClick={() => {
                                        if (selectedAddictionId !== addiction.id) {
                                            setSelectedAddictionId(addiction.id);
                                            setIsCreating(false);
                                        } else {
                                            setSelectedAddictionId(null);
                                        }
                                    }}
                                >
                                    {addiction.title}
                                </p>
                            ))
                        )}
                    </aside>
                    <main className="flex-1 overflow-auto">
                        {/* Create addiction form - shown on both mobile and desktop */}
                        {isCreating && (
                            <AddictionCreator
                                onSuccess={(addictionId) => {
                                    setIsCreating(false);
                                    setSelectedAddictionId(addictionId);
                                }}
                                onCancel={() => setIsCreating(false)}
                            />
                        )}
                        {currentAddiction ? (
                            <div className="px-2 py-4">
                                <div className="group/addiction-header">
                                    <div className={cn("flex items-center justify-center gap-3 mb-4 max-w-2xl mx-auto w-full", isEditingTitle ? "flex-col" : "")}>
                                        {isEditingTitle ? (
                                            <>
                                                <div className="flex items-center gap-3 w-full">
                                                    <Input
                                                        value={editedTitle}
                                                        onChange={(e) => setEditedTitle(e.target.value)}
                                                        className="flex-1 text-center text-2xl font-bold"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                handleSaveTitle();
                                                            } else if (e.key === "Escape") {
                                                                setIsEditingTitle(false);
                                                                setEditedTitle(currentAddiction.title);
                                                                setEditedDescription(currentAddiction.description || "");
                                                            }
                                                        }}
                                                        disabled={updateAddiction.isPending}
                                                    />
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8"
                                                        onClick={handleSaveTitle}
                                                        tooltip="Save changes"
                                                        disabled={updateAddiction.isPending}
                                                    >
                                                        {updateAddiction.isPending ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8"
                                                        onClick={() => {
                                                            setIsEditingTitle(false);
                                                            setEditedTitle(currentAddiction.title);
                                                            setEditedDescription(currentAddiction.description || "");
                                                        }}
                                                        tooltip="Cancel and discard changes"
                                                        disabled={updateAddiction.isPending}
                                                    >
                                                        <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8"
                                                        onClick={() => setIsDeleteDialogOpen(true)}
                                                        tooltip="Delete Addiction"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                    </Button>
                                                </div>
                                                <Textarea
                                                    value={editedDescription}
                                                    onChange={(e) => setEditedDescription(e.target.value)}
                                                    placeholder="Description (optional)"
                                                    className="w-full text-center resize-none"
                                                    rows={2}
                                                    disabled={updateAddiction.isPending}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <h2 className="text-2xl font-bold text-center">
                                                    {currentAddiction.title}
                                                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-4">
                                                        {currentAddiction.relapse_count} relapses
                                                    </span>
                                                </h2>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 lg:group-hover/addiction-header:opacity-100 lg:opacity-0 transition-opacity"
                                                    onClick={() => {
                                                        setEditedTitle(currentAddiction.title);
                                                        setIsEditingTitle(true);
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                    {currentAddiction.description && (
                                        <p className="text-gray-400 dark:text-gray-500 text-center">
                                            {currentAddiction.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col items-start justify-center lg:flex-row lg:justify-between gap-6">
                                    <div className="lg:sticky lg:top-4">
                                        <CircularTimer
                                            lastRelapse={currentAddiction.last_relapse_at ? new Date(currentAddiction.last_relapse_at) : new Date()}
                                        />
                                        <div className="">
                                            {isRecordingRelapse ? (
                                                <RelapseRecorder
                                                    addictionId={currentAddiction.id}
                                                    onSuccess={() => {
                                                        setIsRecordingRelapse(false);
                                                    }}
                                                    onCancel={() => setIsRecordingRelapse(false)}
                                                />
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-4 w-full"
                                                    onClick={() => setIsRecordingRelapse(true)}
                                                >
                                                    Record a relapse
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 h-full w-full">
                                        <JournalEntryForm
                                            addictionId={currentAddiction.id}
                                            onSuccess={() => {
                                                // Entries will auto-refresh via React Query
                                            }}
                                        />
                                        <EntriesList addictionId={currentAddiction.id} />
                                    </div>
                                </div>
                            </div>
                        ) : !isCreating && (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-500 dark:text-gray-400 text-center">
                                    {isLoadingAddictions ? (
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                    ) : addictions.length === 0 ? (
                                        "Create your first addiction to start tracking"
                                    ) : (
                                        "Select an addiction to view your progress"
                                    )}
                                </p>
                            </div>
                        )}
                    </main>
                </div>
            </article>

            <ConfirmationDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete Addiction"
                description={`Are you sure you want to delete "${currentAddiction?.title}"?\n\nThis action cannot be undone and will permanently delete all associated entries.`}
                confirmText="Delete"
                variant="destructive"
                onConfirm={handleDeleteAddiction}
            />
        </section>
    );
}
