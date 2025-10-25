"use client";

import { useHabits } from "@/hooks/use-habits";
import { HabitDisplay } from "./habit-display";

export default function HabitsCard({
    frequency,
    activeOnly = true,
    className = "",
    skipFetch = false,
}: {
    frequency?: string
    activeOnly?: boolean
    className?: string
    skipFetch?: boolean
}) {
    const { data: habits, isLoading, isError } = useHabits({
        frequency,
        activeOnly,
        skipFetch,
    });

    if (isLoading) return <div className={`loading ${className}`}>Loading...</div>;
    if (isError) return <div className={`error ${className}`}>Error loading habits</div>;

    return (
        <div className={`habits-card ${className}`}>
            <h2>Habits</h2>
            <ul>
                {habits && habits.length > 0 ? (
                    habits.map((habit) => (
                        <HabitDisplay
                            key={habit.id}
                            habit={habit}
                        />
                    ))
                ) : (
                    <li>No habits found</li>
                )}
            </ul>
        </div>
    );
}