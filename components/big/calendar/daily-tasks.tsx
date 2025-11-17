'use client';

import { useMemo, useEffect } from 'react';
import { useTasks } from '@/hooks/use-tasks';
import { useNumberOfTasks } from '@/hooks/use-number-of-tasks';
import TaskDisplay from '@/components/big/tasks/task-display';

interface DailyTasksProps {
  dayStart?: Date;
  dayEnd?: Date;
  showNumberOfTasks?: boolean;
  onDataStatusChange?: (hasData: boolean) => void;
}

export function DailyTasks({ dayStart, dayEnd, showNumberOfTasks = true, onDataStatusChange }: DailyTasksProps) {
  const {
    tasks: uncompletedTasks,
    isLoading: isUncompletedLoading,
    isError: isUncompletedError
  } = useTasks({
    completed: false,
    dueBefore: dayEnd,
    dueAfter: dayStart
  });

  const {
    tasks: completedTasks,
    isLoading: isCompletedLoading,
    isError: isCompletedError
  } = useTasks({
    completed: true,
    dueBefore: dayEnd,
    dueAfter: dayStart
  });

  const {
    data: numberOfTasks,
    isLoading: isTaskCountLoading,
    isError: isTaskCountError
  } = useNumberOfTasks({
    dueAfter:
      showNumberOfTasks && dayStart
        ? new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate() - 1)
        : undefined,
    dueBefore: showNumberOfTasks && dayEnd ? dayEnd : undefined,
    enabled: showNumberOfTasks
  });

  const combinedTasks = useMemo(() => {
    const taskMap = new Map<number, (typeof uncompletedTasks)[number]>();
    uncompletedTasks.forEach(task => {
      taskMap.set(task.id, task);
    });
    completedTasks.forEach(task => {
      if (!taskMap.has(task.id)) {
        taskMap.set(task.id, task);
      }
    });

    return Array.from(taskMap.values()).sort((a, b) => {
      const aCompleted = a.completed_at ? 1 : 0;
      const bCompleted = b.completed_at ? 1 : 0;

      if (aCompleted !== bCompleted) {
        return aCompleted - bCompleted;
      }

      return new Date(a.due).getTime() - new Date(b.due).getTime();
    });
  }, [completedTasks, uncompletedTasks]);

  const countForSelectedDay = useMemo(() => {
    if (!dayStart) {
      return 0;
    }

    if (showNumberOfTasks && !isTaskCountLoading && numberOfTasks) {
      const match = numberOfTasks.find(taskCount => {
        const dueDate = new Date(taskCount.due);
        return (
          dueDate.getFullYear() === dayStart.getFullYear() &&
          dueDate.getMonth() === dayStart.getMonth() &&
          dueDate.getDate() === dayStart.getDate()
        );
      });

      if (match) {
        return match.uncompleted_count;
      }
    }

    return uncompletedTasks.length;
  }, [dayStart, showNumberOfTasks, isTaskCountLoading, numberOfTasks, uncompletedTasks]);

  const isInitialLoading =
    (isUncompletedLoading && uncompletedTasks.length === 0) || (isCompletedLoading && completedTasks.length === 0);
  const hasPartialTaskError = (isUncompletedError || isCompletedError) && !(isUncompletedError && isCompletedError);
  const hasData = combinedTasks.length > 0;

  useEffect(() => {
    if (!isInitialLoading && onDataStatusChange) {
      onDataStatusChange(hasData);
    }
  }, [hasData, isInitialLoading, onDataStatusChange]);

  if (isUncompletedError && isCompletedError) {
    return (
      <div className="flex flex-col items-start justify-center w-full">
        <div className="w-full">Error loading tasks</div>
      </div>
    );
  }

  if (isInitialLoading) {
    if (showNumberOfTasks && !isTaskCountLoading && countForSelectedDay > 0) {
      const skeletonCount = Math.max(countForSelectedDay, 1);
      return (
        <div className="flex flex-col items-start justify-center w-full">
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <TaskDisplay key={`task-skeleton-${index}`} className="w-full" />
          ))}
        </div>
      );
    }

    return null;
  }

  return hasData ? (
    <div className="flex flex-col items-start justify-center w-full">
      {combinedTasks.map(task => (
        <TaskDisplay key={task.id} task={task} className="w-full" />
      ))}
      {hasPartialTaskError && (
        <div className="w-full text-sm text-amber-600 dark:text-amber-400 mt-2">Some tasks could not be loaded.</div>
      )}
      {isTaskCountError && showNumberOfTasks && (
        <div className="w-full text-sm text-amber-600 dark:text-amber-400 mt-2">Task indicators unavailable.</div>
      )}
    </div>
  ) : null;
}
