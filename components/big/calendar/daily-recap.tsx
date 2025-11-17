'use client';

import { useState, useCallback, useEffect } from 'react';
import { DailyTasks } from '@/components/big/calendar/daily-tasks';
import { DailyWorkout } from '@/components/big/calendar/daily-workout';
import { DailyNotes } from '@/components/big/calendar/daily-notes';

interface DailyRecapProps {
  dayStart?: Date;
  dayEnd?: Date;
  showNumberOfTasks?: boolean;
}

enum status {
  NoData = -1,
  Loading = 0,
  HasData = 1
}

interface componentStatus {
  tasks: status;
  workout: status;
  notes: status;
}

export function DailyRecap({ dayStart, dayEnd, showNumberOfTasks = true }: DailyRecapProps) {
  const [componentStatus, setComponentStatus] = useState<componentStatus>({
    tasks: status.Loading,
    workout: status.Loading,
    notes: status.Loading
  });

  // Calculate loading status whenever componentStatus changes
  const isLoading = Object.values(componentStatus).some(s => s === status.Loading);
  const hasAnyData = Object.values(componentStatus).some(s => s === status.HasData);

  // Memoize callbacks to prevent infinite loops
  const handleTasksDataChange = useCallback((hasData: boolean) => {
    setComponentStatus(prev => ({ ...prev, tasks: hasData ? status.HasData : status.NoData }));
  }, []);

  const handleWorkoutDataChange = useCallback((hasData: boolean) => {
    setComponentStatus(prev => ({ ...prev, workout: hasData ? status.HasData : status.NoData }));
  }, []);

  const handleNotesDataChange = useCallback((hasData: boolean) => {
    setComponentStatus(prev => ({ ...prev, notes: hasData ? status.HasData : status.NoData }));
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center gap-4">
      {[
        {
          key: 'tasks',
          hasData: componentStatus.tasks,
          component: (
            <DailyTasks
              key="tasks"
              dayStart={dayStart}
              dayEnd={dayEnd}
              showNumberOfTasks={showNumberOfTasks}
              onDataStatusChange={handleTasksDataChange}
            />
          )
        },
        {
          key: 'workout',
          hasData: componentStatus.workout,
          component: (
            <DailyWorkout
              key="workout"
              dayStart={dayStart}
              dayEnd={dayEnd}
              onDataStatusChange={handleWorkoutDataChange}
            />
          )
        },
        {
          key: 'notes',
          hasData: componentStatus.notes,
          component: (
            <DailyNotes key="notes" dayStart={dayStart} dayEnd={dayEnd} onDataStatusChange={handleNotesDataChange} />
          )
        }
      ]
        .sort((a, b) => {
          // Sort: components with data first, then components without data
          if (a.hasData === b.hasData) return 0;
          return a.hasData ? -1 : 1;
        })
        .map(item => item.component)}
      {isLoading && (
        <div className="w-full flex flex-col items-start justify-center">
          <div className="w-full">Loading recap...</div>
        </div>
      )}
      {!isLoading && !hasAnyData && (
        <div className="w-full flex flex-col items-start justify-center">
          <div className="w-full text-sm text-gray-500 dark:text-gray-400 mt-2">Nothing to show for this day</div>
        </div>
      )}
    </div>
  );
}
