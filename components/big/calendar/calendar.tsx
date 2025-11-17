'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useNumberOfTasks } from '@/hooks/use-number-of-tasks';
import { useDailyMoods } from '@/hooks/use-daily-moods';
import { CalendarView } from '@/components/big/calendar/calendar-view';
import { DateDisplay } from '@/components/big/calendar/date-display';
import { DailyRecap } from '@/components/big/calendar/daily-recap';

export default function Calendar({
  className,
  showNumberOfTasks = true,
  showDailyMood = true
}: {
  className: string;
  showNumberOfTasks?: boolean;
  showDailyMood?: boolean;
}) {
  const now = new Date();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState<Date>(
    date ? new Date(date.getFullYear(), date.getMonth(), 1) : new Date(now.getFullYear(), now.getMonth(), 1)
  );

  const monthStart = useMemo(() => new Date(month.getFullYear(), month.getMonth(), 1), [month]);
  const monthEnd = useMemo(() => new Date(month.getFullYear(), month.getMonth() + 1, 0), [month]);

  // Only fetch data when showNumberOfTasks is true
  const {
    data: numberOfTasks,
    isLoading: isTaskCountLoading,
    isError: isTaskCountError
  } = useNumberOfTasks({
    dueAfter: showNumberOfTasks ? new Date(monthStart.getFullYear(), monthStart.getMonth(), 0) : undefined,
    dueBefore: showNumberOfTasks ? monthEnd : undefined,
    enabled: showNumberOfTasks
  });

  // Fetch daily moods data
  const { data: dailyMoods } = useDailyMoods({
    startDate: monthStart,
    endDate: monthEnd,
    enabled: showDailyMood
  });

  const dayStart = useMemo(() => {
    if (!date) return undefined;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  }, [date]);

  const dayEnd = useMemo(() => {
    if (!date) return undefined;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
  }, [date]);

  useEffect(() => {
    if (!date) {
      setDate(new Date());
    }
    if (date) {
      date.setHours(0, 0, 0, 0);
    }
  }, [date]);

  // Get the mood for the currently selected date
  const getCurrentDateMood = useCallback(() => {
    if (!date || !dailyMoods || dailyMoods.length === 0) return null;

    const normalizedSelectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    return dailyMoods.find(mood => {
      const moodDate = new Date(mood.date);
      const normalizedMoodDate = new Date(moodDate.getFullYear(), moodDate.getMonth(), moodDate.getDate());
      return normalizedMoodDate.getTime() === normalizedSelectedDate.getTime();
    });
  }, [date, dailyMoods]);

  const currentMood = getCurrentDateMood();

  const handleMonthChange = useCallback((nextMonth: Date) => {
    setMonth(currentMonth => {
      if (!currentMonth) {
        return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
      }

      const currentKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
      const nextKey = `${nextMonth.getFullYear()}-${nextMonth.getMonth()}`;

      if (currentKey === nextKey) {
        return currentMonth;
      }

      return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    });
  }, []);

  return (
    <div
      className={cn(
        'flex flex-row md:flex-col justify-start items-start md:items-center border-l border-gray-100 dark:border-gray-800 md:w-full md:h-screen md:max-w-[300px] md:p-2',
        className
      )}
    >
      <div className="w-full flex flex-col items-center justify-center">
        <CalendarView
          date={date}
          onDateSelect={setDate}
          onMonthChange={handleMonthChange}
          taskCounts={numberOfTasks}
          dailyMoods={dailyMoods}
          showNumberOfTasks={showNumberOfTasks}
          showDailyMood={showDailyMood}
        />
        <DateDisplay date={date} currentMood={currentMood} />
      </div>
      <div className="w-full h-full flex flex-col items-start justify-between">
        <DailyRecap dayStart={dayStart} dayEnd={dayEnd} showNumberOfTasks={showNumberOfTasks} />
      </div>
    </div>
  );
}
