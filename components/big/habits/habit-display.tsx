"use client"

import { DynamicIcon, dynamicIconImports } from "lucide-react/dynamic"
import { Habit } from "@/lib/db/schema"

export function HabitDisplay({
    habit
}: {
    habit?: Habit.Habit.Select
}) {
    return (
        habit === undefined ? (
            <div>loading...</div>
        ) : (
            <div className="00.">
                <div className="habit-icon">
                    <DynamicIcon name={habit.icon as keyof typeof dynamicIconImports} />
                </div>
                <div className="habit-details">
                    <h3 className="habit-title">{habit.title}</h3>
                    {habit.description && <p className="habit-description">{habit.description}</p>}
                    <span className={`habit-frequency habit-frequency-${habit.frequency}`}>
                        {habit.frequency}
                    </span>
                </div>
            </div >
        )
    )
}