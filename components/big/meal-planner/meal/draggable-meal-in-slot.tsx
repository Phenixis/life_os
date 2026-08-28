import { useDraggable } from '@dnd-kit/core';
import type { DayPartKey, MealInSlot } from "../types";
import MealDisplay from "./meal-display";

export function DraggableMealInSlot({
    meal,
    sourceKey,
    onRemove
}: Readonly<{
    meal: MealInSlot;
    sourceKey: DayPartKey;
    onRemove: () => void;
}>) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `slot-meal-${meal.id}`,
        data: { sourceKey, meal }
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
            className="relative group block touch-none transition-all active:scale-95 active:opacity-70"
            {...listeners}
            {...attributes}
        >
            <div className="cursor-grab active:cursor-grabbing">
                <MealDisplay meal={meal} />
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
                onTouchEnd={(e) => {
                    e.stopPropagation();
                }}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full size-3.5 md:size-4 text-xs md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-auto"
                title="Remove"
            >
                ×
            </button>
        </span>
    );
}
