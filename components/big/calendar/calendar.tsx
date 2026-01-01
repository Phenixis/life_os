'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useNumberOfTasks } from '@/hooks/use-number-of-tasks';
import { useDailyMoods } from '@/hooks/use-daily-moods';
import { usePrefetchWeekData } from '@/hooks/use-prefetch-week-data';
import { CalendarView } from '@/components/big/calendar/calendar-view';
import { DateDisplay } from '@/components/big/calendar/date-display';
import { DailyRecap } from '@/components/big/calendar/daily-recap';
import { Button } from '@/components/ui/button';
import { SquarePlus, RotateCcw } from 'lucide-react';
import { useTaskModal, useRelapseRecorderModal } from '@/contexts/modal-commands-context';

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
  const [scrollOpacity, setScrollOpacity] = useState(1);
  const [isDailyDataLoaded, setIsDailyDataLoaded] = useState(false);

  const monthStart = useMemo(() => new Date(month.getFullYear(), month.getMonth(), 1), [month]);
  const monthEnd = useMemo(() => new Date(month.getFullYear(), month.getMonth() + 1, 0), [month]);

  // Calculate the visible date range including days from previous/next months shown in calendar
  // Calendar typically shows 6 weeks (42 days) to fill the grid
  const visibleStart = useMemo(() => {
    const firstDay = new Date(monthStart);
    const dayOfWeek = firstDay.getDay();
    firstDay.setDate(firstDay.getDate() - dayOfWeek);
    return firstDay;
  }, [monthStart]);

  const visibleEnd = useMemo(() => {
    const lastDay = new Date(monthEnd);
    const dayOfWeek = lastDay.getDay();
    lastDay.setDate(lastDay.getDate() + (6 - dayOfWeek));
    return lastDay;
  }, [monthEnd]);

  // Only fetch data when showNumberOfTasks is true
  const {
    data: numberOfTasks = [],
    isLoading: isTaskCountLoading,
    isError: isTaskCountError
  } = useNumberOfTasks({
    dueAfter: showNumberOfTasks ? new Date(monthStart.getFullYear(), monthStart.getMonth(), 0) : undefined,
    dueBefore: showNumberOfTasks ? monthEnd : undefined,
    enabled: showNumberOfTasks
  });

  // Fetch daily moods data for all visible dates (including adjacent month days)
  const { data: dailyMoods } = useDailyMoods({
    startDate: visibleStart,
    endDate: visibleEnd,
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

  // Track when initial data for the selected date is loaded
  // This triggers prefetching for the rest of the week
  useEffect(() => {
    // Reset loading state when date changes
    setIsDailyDataLoaded(false);
    
    // Set as loaded after a short delay to ensure queries have started
    const timeoutId = setTimeout(() => {
      setIsDailyDataLoaded(true);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [date]);

  // Prefetch data for all other days in the week after current date's data is loaded
  usePrefetchWeekData(date, isDailyDataLoaded);

  // Handle scroll-based fade effect on mobile
  useEffect(() => {
    const handleScroll = () => {
      // Only apply on mobile/tablet screens
      if (window.innerWidth >= 768) {
        setScrollOpacity(1);
        return;
      }

      const scrollY = window.scrollY;
      // Start fading at 100px, fully faded by 300px
      const fadeStart = 100;
      const fadeEnd = 300;
      const fadeRange = fadeEnd - fadeStart;

      if (scrollY <= fadeStart) {
        setScrollOpacity(1);
      } else if (scrollY >= fadeEnd) {
        setScrollOpacity(0);
      } else {
        const progress = (scrollY - fadeStart) / fadeRange;
        // Ease out the fade for smoother transition
        const easedProgress = 1 - Math.pow(1 - progress, 2);
        setScrollOpacity(1 - easedProgress);
      }
    };

    handleScroll(); // Initial call
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const taskModal = useTaskModal();
  const relapseModal = useRelapseRecorderModal();

  const handleCreateTask = useCallback(() => {
    taskModal.openModal(dayStart);
  }, [taskModal, dayStart]);

  const handleRecordRelapse = useCallback(() => {
    relapseModal.openModal(dayStart);
  }, [relapseModal, dayStart]);

  const isDateInFuture = useMemo(() => {
    if (!dayStart) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dayStart > today;
  }, [dayStart]);

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
        'sticky top-0 flex flex-col justify-start items-start border-l border-gray-100 dark:border-gray-800 p-2 pb-4 h-fit max-h-[80dvh] overflow-y-auto md:pb-2 md:items-center md:w-full md:h-screen md:max-h-screen md:max-w-75 transition-opacity duration-300',
        className
      )}
      style={{
        opacity: scrollOpacity
      }}
    >
      <div 
        className="w-full flex flex-col items-center justify-center relative"
        style={{
          maskImage: scrollOpacity < 0.9 ? 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0.3) 100%)' : 'none',
          WebkitMaskImage: scrollOpacity < 0.9 ? 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0.3) 100%)' : 'none'
        }}
      >
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
        <div className="w-full flex justify-end gap-2 mt-4 px-2">
          <Button
            onClick={handleRecordRelapse}
            variant="outline"
            size="sm"
            className="gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700"
            tooltip={isDateInFuture ? "Cannot record future relapses" : "Record a relapse"}
            disabled={isDateInFuture}
          >
            <RotateCcw className="h-4 w-4" />
            <span className="sr-only">Record Relapse</span>
          </Button>
          <Button
            onClick={handleCreateTask}
            variant="outline"
            size="sm"
            className="gap-2"
            tooltip="Create a task"
          >
            <SquarePlus className="h-4 w-4" />
            <span className="sr-only">Create Task</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
