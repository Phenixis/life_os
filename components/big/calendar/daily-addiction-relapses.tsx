'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAddictionsQuery } from '@/hooks/use-addiction-tracker';
import { useUser } from '@/hooks/use-user';
import { relapseApi, entryApi } from '@/lib/api/addiction-tracker.api';
import type { Relapse, Entry } from '@/lib/api/addiction-tracker-keys';
import { format } from 'date-fns';

interface DailyAddictionRelapsesProps {
    dayStart?: Date;
    dayEnd?: Date;
    onDataStatusChange?: (hasData: boolean) => void;
}

export function DailyAddictionRelapses({ dayStart, dayEnd, onDataStatusChange }: DailyAddictionRelapsesProps) {
    const { user } = useUser();
    const { addictions, isLoading: addictionsLoading, isError: addictionsError } = useAddictionsQuery();

    // Fetch all relapses for all addictions with their associated entries
    const { data: relapsesData, isLoading: relapsesLoading, isError: relapsesError } = useQuery({
        queryKey: ['addiction-relapses-all', addictions.map(a => a.id)],
        queryFn: async () => {
            if (!user?.api_key || addictions.length === 0) return [];
            
            // Fetch relapses for all addictions in parallel
            const relapsesPromises = addictions.map(async addiction => {
                const relapses = await relapseApi.getRelapses(addiction.id, user.api_key);
                
                // Fetch entries for each relapse
                const relapsesWithEntries = await Promise.all(
                    relapses.map(async relapse => {
                        // Get entries for this addiction and find the one linked to this relapse
                        const entriesResult = await entryApi.getEntries(addiction.id, user.api_key, { limit: 100 });
                        const entry = entriesResult.entries.find(e => e.relapse_id === relapse.id);
                        
                        return {
                            ...relapse,
                            addiction,
                            entry: entry || null
                        };
                    })
                );
                
                return relapsesWithEntries;
            });
            
            const results = await Promise.all(relapsesPromises);
            return results.flat();
        },
        enabled: !!user?.api_key && addictions.length > 0,
        staleTime: 5000,
    });

    const allRelapses = relapsesData ?? [];

    // Filter relapses within the day range
    const relapsesInDay = useMemo(() => {
        if (!dayStart || !dayEnd) return [];
        return allRelapses.filter(relapse => {
            const relapseDate = new Date(relapse.created_at);
            return relapseDate >= dayStart && relapseDate <= dayEnd;
        });
    }, [allRelapses, dayStart, dayEnd]);

    const hasData = relapsesInDay.length > 0;
    const isLoading = addictionsLoading || relapsesLoading;
    const isError = addictionsError || relapsesError;

    useEffect(() => {
        if (!isLoading && onDataStatusChange) {
            onDataStatusChange(hasData);
        }
    }, [hasData, isLoading, onDataStatusChange]);

    if (isLoading) {
        return null;
    }

    if (isError) {
        return (
            <div className="flex flex-col items-start justify-center w-full">
                <div className="w-full text-sm text-amber-600 dark:text-amber-400 mt-2">Error loading relapses</div>
            </div>
        );
    }

    return hasData ? (
        <div className="flex flex-col items-start justify-center w-full">
            <div className="w-full flex flex-col gap-2">
                {relapsesInDay.map(relapse => (
                    <div
                        key={relapse.id}
                        className="w-full p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2">
                                <span className="text-xs font-medium text-red-800 dark:text-red-300">{relapse.addiction.title}</span>
                                <span className="text-xs text-red-600 dark:text-red-400">
                                    {format(new Date(relapse.created_at), 'h:mm a')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-red-600 dark:text-red-400">
                                    Relapse #{relapse.addiction.relapse_count}
                                </span>
                            </div>
                        </div>
                        {relapse.entry?.content && (
                            <p className="text-sm text-red-700 dark:text-red-400 mt-2">
                                {relapse.entry.content}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    ) : null;
}
