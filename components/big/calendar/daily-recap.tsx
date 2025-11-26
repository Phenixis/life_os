'use client';

import { useState, useCallback, useRef } from 'react';
import { DailyTasks } from '@/components/big/calendar/daily-tasks';
import { DailyWorkout } from '@/components/big/calendar/daily-workout';
import { DailyNotes } from '@/components/big/calendar/daily-notes';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { useTaskModal } from '@/contexts/modal-commands-context';

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

const initialStatus: componentStatus = {
  tasks: status.Loading,
  workout: status.Loading,
  notes: status.Loading
};

/**
 * Generate a stable date key for tracking date changes
 */
function getDateKey(dayStart?: Date, dayEnd?: Date): string {
  const startKey = dayStart ? dayStart.getTime().toString() : 'none';
  const endKey = dayEnd ? dayEnd.getTime().toString() : 'none';
  return `${startKey}-${endKey}`;
}

export function DailyRecap({ dayStart, dayEnd, showNumberOfTasks = true }: DailyRecapProps) {
  // Generate a unique key based on dates
  const dateKey = getDateKey(dayStart, dayEnd);
  
  // Track the previous dateKey to detect changes
  // This pattern is recommended by React for updating state based on previous props
  // See: https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const prevDateKeyRef = useRef<string>(dateKey);
  
  const [componentStatus, setComponentStatus] = useState<componentStatus>(initialStatus);
  const taskModal = useTaskModal();
  
  // Reset component status synchronously when date changes
  // This avoids the race condition where useEffect runs asynchronously and
  // children report status before parent resets to Loading
  if (prevDateKeyRef.current !== dateKey) {
    prevDateKeyRef.current = dateKey;
    setComponentStatus(initialStatus);
  }

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

  const handleCreateTask = useCallback(() => {
    taskModal.openModal(dayStart);
  }, [taskModal, dayStart]);

  return (
    <div className="w-full flex flex-col items-center justify-center gap-4">
      {[
        {
          key: 'tasks',
          hasData: componentStatus.tasks,
          component: (
            <DailyTasks
              key={`tasks-${dateKey}`}
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
              key={`workout-${dateKey}`}
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
            <DailyNotes key={`notes-${dateKey}`} dayStart={dayStart} dayEnd={dayEnd} onDataStatusChange={handleNotesDataChange} />
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
      <div className="w-full flex justify-end mt-4">
        <Button
          onClick={handleCreateTask}
          size="sm"
          className="gap-2"
          tooltip="Create task for this date"
        >
          <PlusIcon className="h-4 w-4" />
          Create Task
        </Button>
      </div>
    </div>
  );
}
