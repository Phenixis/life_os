import { useDroppable } from '@dnd-kit/core';
import { cn } from "@/lib/utils";
import type { DayPartKey, MealInSlot } from "./types";
import { DraggableMealInSlot } from "./meal/draggable-meal-in-slot";

export function DroppableDayPartSlot({
    dayIndex,
    part,
    meals,
    isOver,
    onRemoveMeal
}: Readonly<{
    dayIndex: number;
    part: string;
    meals: MealInSlot[];
    isOver: boolean;
    onRemoveMeal: (mealId: string | number) => void;
}>) {
    const key: DayPartKey = `${dayIndex}-${part}`;
    const { setNodeRef } = useDroppable({
        id: `daypart-${key}`,
        data: { type: 'daypart', key }
    });

    return (
        <section
            ref={setNodeRef}
            aria-label={`${part} slot`}
            className={cn(
                'flex-1 border-b last:border-b-0 border-gray-300 p-0.5 md:p-1 transition-colors max-h-1/5 flex flex-col',
                isOver && 'bg-blue-100'
            )}
        >
            <span className="text-[10px] md:text-xs text-gray-500">{part}</span>
            <div className="p-1 mt-1 flex flex-col gap-1 overflow-y-auto">
                {meals.map((meal) => (
                    <DraggableMealInSlot
                        key={meal.id}
                        meal={meal}
                        sourceKey={key}
                        onRemove={() => onRemoveMeal(meal.id)}
                    />
                ))}
            </div>
        </section>
    );
}
