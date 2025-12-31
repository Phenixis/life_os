"use client"

import { AddictionCreator } from "@/components/big/addiction-tracker/addiction-creator";
import { CircularTimer } from "@/components/big/addiction-tracker/circular-timer";
import { JournalEntryForm } from "@/components/big/addiction-tracker/journal-entry-form";
import { RelapseRecorder } from "@/components/big/addiction-tracker/relapse-recorder";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { HorizontalList } from "@/components/ui/horizontal-list";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import {
    useAddictionsQuery,
    useInfiniteEntriesQuery,
    useUpdateAddiction,
    useDeleteAddiction,
    useUpdateEntry,
    useDeleteEntry,
    type Entry,
} from "@/hooks/use-addiction-tracker";

function EntryDisplay({
    entry,
    addictionId,
}: {
    entry: Entry;
    addictionId: number;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(entry.content);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const updateEntry = useUpdateEntry();
    const deleteEntry = useDeleteEntry();

    const handleSave = () => {
        if (!editedContent.trim()) return;
        updateEntry.mutate(
            { id: entry.id, addictionId, data: { content: editedContent } },
            {
                onSuccess: () => setIsEditing(false),
            }
        );
    };

    const handleDelete = () => {
        deleteEntry.mutate(
            { id: entry.id, addictionId },
            {
                onSuccess: () => setIsDeleteDialogOpen(false),
            }
        );
    };

    const entryDate = new Date(entry.created_at);

    return (
        <div className="relative group/entry pl-8 pb-6 first:pt-6 pt-1 last:pb-0">
            {/* Timeline line */}
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 last:hidden" />

            {/* Timeline dot */}
            <div className={cn(
                "absolute left-px w-4 h-4 rounded-full border-2 border-background top-3 group-first/entry:top-8",
                entry.relapse_id ? "bg-red-500" : "bg-primary"
            )} />

            {/* Content */}
            <div className="flex flex-col justify-between items-end lg:flex-row lg:items-start gap-4 bg-gray-100 dark:bg-gray-900 rounded-md p-2">
                <div className="min-h-16 flex flex-col justify-between flex-1 w-full">
                    <h4 className="font-medium mb-1 text-sm text-gray-500 dark:text-gray-400">
                        {entryDate.toLocaleDateString()} {entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {entry.relapse_id && (
                            <span className="ml-2 text-red-500 dark:text-red-400 text-xs font-semibold">
                                RELAPSE
                            </span>
                        )}
                    </h4>
                    {isEditing ? (
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
                                    }
                                }}
                                disabled={updateEntry.isPending}
                            />
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={handleSave}
                                disabled={updateEntry.isPending}
                            >
                                {updateEntry.isPending ? (
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
                                }}
                                disabled={updateEntry.isPending}
                            >
                                <X className="h-4 w-4 text-red-600" />
                            </Button>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            {entry.content}
                        </p>
                    )}
                </div>
                {!isEditing && (
                    <div className="lg:opacity-0 lg:group-hover/entry:opacity-100 flex lg:flex-col lg:items-end">
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
                description="Are you sure you want to delete this entry? This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
                onConfirm={handleDelete}
            />
        </div>
    );
}

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

    // Fetch entries for selected addiction with infinite scrolling
    const { 
        entries, 
        isLoading: isLoadingEntries, 
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
    } = useInfiniteEntriesQuery(selectedAddictionId ?? undefined, {
        enabled: !!selectedAddictionId,
        limit: 20,
    });

    // Intersection observer for infinite scrolling
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [target] = entries;
            if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        },
        [hasNextPage, isFetchingNextPage, fetchNextPage]
    );

    useEffect(() => {
        const element = loadMoreRef.current;
        if (!element) return;

        observerRef.current = new IntersectionObserver(handleObserver, {
            root: null,
            rootMargin: "100px",
            threshold: 0.1,
        });

        observerRef.current.observe(element);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [handleObserver]);

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
        updateAddiction.mutate(
            { id: currentAddiction.id, data: { title: editedTitle, description: editedDescription.trim() || null } },
            {
                onSuccess: () => setIsEditingTitle(false),
            }
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

    // Sort entries by date (newest first)
    const sortedEntries = [...entries].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

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
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                </div>
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
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Desktop view with sidebar */}
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
                                        "w-full bg-gray-100 rounded-md p-2 dark:bg-gray-700 text-center transition-colors cursor-pointer",
                                        selectedAddictionId === addiction.id ? "bg-gray-200 dark:bg-gray-800" : "hover:bg-gray-300 dark:hover:bg-gray-600"
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
                                                className="h-8 w-8"
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
                                        <div className="first:pt-6">
                                            {isLoadingEntries ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                                </div>
                                            ) : sortedEntries.length > 0 ? (
                                                <>
                                                    {sortedEntries.map((entry) => (
                                                        <EntryDisplay
                                                            key={entry.id}
                                                            entry={entry}
                                                            addictionId={currentAddiction.id}
                                                        />
                                                    ))}
                                                    {/* Intersection observer target */}
                                                    <div ref={loadMoreRef} className="h-4" />
                                                    {/* Loading more indicator */}
                                                    {isFetchingNextPage && (
                                                        <div className="flex items-center justify-center py-4">
                                                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                                    No journal entries yet. Start writing!
                                                </p>
                                            )}
                                        </div>
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
