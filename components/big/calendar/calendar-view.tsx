'use client';

import { useCallback } from 'react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { TaskCount } from '@/components/ui/calendar';
import { DailyMood } from '@/lib/db/schema';

interface CalendarViewProps {
  date?: Date;
  onDateSelect: (date: Date | undefined) => void;
  onMonthChange: (month: Date) => void;
  taskCounts?: TaskCount[];
  dailyMoods?: DailyMood.Select[];
  showNumberOfTasks?: boolean;
  showDailyMood?: boolean;
}

export function CalendarView({
  date,
  onDateSelect,
  onMonthChange,
  taskCounts,
  dailyMoods,
  showNumberOfTasks = true,
  showDailyMood = true
}: CalendarViewProps) {
  return (
    <CalendarComponent
      mode="single"
      selected={date}
      onSelect={onDateSelect}
      onDayClick={day => {
        console.log(day);
      }}
      taskCounts={showNumberOfTasks ? taskCounts : []}
      dailyMoods={showDailyMood ? dailyMoods : []}
      onMonthChange={useCallback(
        (nextMonth: Date) => {
          onMonthChange(nextMonth);
        },
        [onMonthChange]
      )}
    />
  );
}
