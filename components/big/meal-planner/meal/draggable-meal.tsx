import { useDraggable } from '@dnd-kit/core';
import MealDisplay from "./meal-display";
import * as Schema from "@/lib/db/schema";

export function DraggableMeal({
    meal
}: Readonly<{
    meal: Schema.MealPlanner.Meal.Select;
}>) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `sidebar-meal-${meal.id}`,
        data: { meal }
    });

    const style = isDragging
        ? {
            opacity: 0.5,
            transform: 'scale(0.95)'
        }
        : undefined;

    return (
        <span
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing block touch-none transition-all active:scale-95 active:opacity-70"
        >
            <MealDisplay meal={meal} />
        </span>
    );
}
