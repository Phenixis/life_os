'use client';

import { useEffect } from 'react';
import useSWR from 'swr';
import { useUser } from '@/hooks/use-user';
import { fetcher } from '@/lib/fetcher';
import type { NoteWithProject } from '@/lib/db/queries/note';

interface DailyNotesProps {
  dayStart?: Date;
  dayEnd?: Date;
  onDataStatusChange?: (hasData: boolean) => void;
}

export function DailyNotes({ dayStart, dayEnd, onDataStatusChange }: DailyNotesProps) {
  const { user } = useUser();

  const buildUrl = () => {
    if (!dayStart || !dayEnd) return null;
    const params = new URLSearchParams();
    params.append('limit', '10');
    params.append('createdAfter', dayStart.toISOString());
    params.append('createdBefore', dayEnd.toISOString());
    return `/api/note?${params.toString()}`;
  };

  const url = buildUrl();

  const { data, error, isLoading } = useSWR(user && url ? url : null, url => fetcher(url, user!.api_key));

  const notes = (data?.notes || []) as NoteWithProject[];
  const hasData = notes.length > 0;

  useEffect(() => {
    if (!isLoading && onDataStatusChange) {
      onDataStatusChange(hasData);
    }
  }, [hasData, isLoading, onDataStatusChange]);

  if (isLoading) {
    return null;
  }

  if (error) {
    return (
      <div className="flex flex-col items-start justify-center w-full">
        <div className="w-full text-sm text-amber-600 dark:text-amber-400 mt-2">Error loading notes</div>
      </div>
    );
  }

  return hasData ? (
    <div className="flex flex-col items-start justify-center w-full">
      <div className="w-full flex flex-col gap-2">
        {notes.map(note => (
          <div
            key={note.id}
            className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
          >
            <div className="font-medium text-sm">{note.title}</div>
            {note.project_title && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{note.project_title}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  ) : null;
}
