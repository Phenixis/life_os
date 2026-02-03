'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAddictionsQuery } from '@/hooks/use-addiction-tracker';
import { useUser } from '@/hooks/use-user';
import { entryApi } from '@/lib/api/addiction-tracker.api';
import type { AddictionWithStats, Entry } from '@/lib/api/addiction-tracker-keys';
import { format } from 'date-fns';

interface DailyAddictionEntriesProps {
    dayStart?: Date;
    dayEnd?: Date;
    onDataStatusChange?: (hasData: boolean) => void;
}

export function DailyAddictionEntries({ dayStart, dayEnd, onDataStatusChange }: DailyAddictionEntriesProps) {
    const { user } = useUser();
    const { addictions, isLoading: addictionsLoading, isError: addictionsError } = useAddictionsQuery();

    // Fetch all entries for all addictions in a single query
    const { data: allEntriesData, isLoading: entriesLoading, isError: entriesError } = useQuery({
        queryKey: ['addiction-entries-all', addictions.map(a => a.id)],
        queryFn: async () => {
            if (!user?.api_key || addictions.length === 0) return [];

            // Fetch entries for all addictions in parallel
            const entriesPromises = addictions.map(addiction =>
                entryApi.getEntries(addiction.id, user.api_key, { limit: 100 })
                    .then(result =>
                        result.entries.map(entry => ({
                            ...entry,
                            addiction
                        }))
                    )
            );

            const results = await Promise.all(entriesPromises);
            return results.flat();
        },
        enabled: !!user?.api_key && addictions.length > 0,
        staleTime: 5000,
    });

    const allEntries = allEntriesData ?? [];

    // Filter entries within the day range and exclude relapse entries
    const entriesInDay = allEntries.filter(entry => {
        if (!dayStart || !dayEnd) return false;
        const entryDate = new Date(entry.created_at);
        const isInRange = entryDate >= dayStart && entryDate <= dayEnd;
        // Exclude entries that are linked to relapses (those are just auto-generated "Relapse recorded" entries)
        const isJournalEntry = !entry.relapse_id;
        return isInRange && isJournalEntry;
    });

    const hasData = entriesInDay.length > 0;
    const isLoading = addictionsLoading || entriesLoading;
    const hasError = addictionsError || entriesError;

    useEffect(() => {
        if (!isLoading && onDataStatusChange) {
            onDataStatusChange(hasData);
        }
    }, [hasData, isLoading, onDataStatusChange]);

    if (isLoading) {
        return null;
    }

    if (hasError) {
        return (
            <div className="flex flex-col items-start justify-center w-full">
                <div className="w-full text-sm text-amber-600 dark:text-amber-400 mt-2">Error loading journal entries</div>
            </div>
        );
    }

    return hasData ? (
        <div className="flex flex-col items-start justify-center w-full">
            <div className="w-full flex flex-col gap-2">
                {entriesInDay
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map(entry => (
                        <div
                            key={entry.id}
                            className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2">
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                        {entry.addiction.title}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-500">
                                        {format(new Date(entry.created_at), 'h:mm a')}
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-800 dark:text-gray-200">{entry.content}</p>
                        </div>
                    ))}
            </div>
        </div>
    ) : null;
}
