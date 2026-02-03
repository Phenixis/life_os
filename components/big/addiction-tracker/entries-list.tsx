"use client"

import { EntryDisplay } from "./entry-display";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, memo } from "react";
import { useInfiniteEntriesQuery } from "@/hooks/use-addiction-tracker";

interface EntriesListProps {
    addictionId: number;
}

function EntriesListComponent({ addictionId }: EntriesListProps) {
    // Fetch entries for selected addiction with infinite scrolling
    const { 
        entries, 
        isLoading: isLoadingEntries, 
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
    } = useInfiniteEntriesQuery(addictionId, {
        enabled: !!addictionId,
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

    // Sort entries by date (newest first)
    const sortedEntries = [...entries].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return (
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
                            addictionId={addictionId}
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
    );
}

export const EntriesList = memo(EntriesListComponent);
