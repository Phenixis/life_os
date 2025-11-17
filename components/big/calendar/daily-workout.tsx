'use client';

import { useEffect } from 'react';
import { useWorkoutsByDate } from '@/hooks/use-workouts';
import { PastWorkoutDisplay } from '@/components/big/workout/past-workout/past-workout-display';

interface DailyWorkoutProps {
  dayStart?: Date;
  dayEnd?: Date;
  onDataStatusChange?: (hasData: boolean) => void;
}

export function DailyWorkout({ dayStart, dayEnd, onDataStatusChange }: DailyWorkoutProps) {
  const {
    workouts: dayWorkouts,
    isLoading: isWorkoutsLoading,
    error: workoutsError
  } = useWorkoutsByDate(dayStart, dayEnd, 10);

  const hasData = dayWorkouts.length > 0;

  useEffect(() => {
    if (!isWorkoutsLoading && onDataStatusChange) {
      onDataStatusChange(hasData);
    }
  }, [hasData, isWorkoutsLoading, onDataStatusChange]);

  if (isWorkoutsLoading) {
    return null;
  }

  if (workoutsError) {
    return (
      <div className="flex flex-col items-start justify-center w-full">
        <div className="w-full text-sm text-amber-600 dark:text-amber-400 mt-2">Error loading workout</div>
      </div>
    );
  }

  return hasData ? (
    <div className="flex flex-col items-start justify-center w-full">
      {dayWorkouts.map(workout => (
        <PastWorkoutDisplay key={workout.id} workout={workout} showActions={false} className="my-0" />
      ))}
    </div>
  ) : null;
}
