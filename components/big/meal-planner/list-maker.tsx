'use client'

import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useMealsQuery } from "@/hooks/use-meals";
import * as Schema from "@/lib/db/schema";
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import { Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { DraggableMeal } from "./meal/draggable-meal";
import { DroppableDayPartSlot } from "./droppable-day-part-slot";
import ListMakerSummary from "./list-maker-summary";
import { SidebarDropZone } from "./sidebar-drop-zone";
import type { DayPartKey, MealInSlot } from "./types";
import { DAY_DIVISION } from "./utils";

export default function ListMaker() {
    const { meals, isLoading } = useMealsQuery({
        withIngredients: true,
    })

    const [mealsInDayParts, setMealsInDayParts] = useLocalStorage<Record<DayPartKey, MealInSlot[]>>('meal-planner-meals', {});
    const [dragOverSlot, setDragOverSlot] = useState<DayPartKey | null>(null);
    const [activeMeal, setActiveMeal] = useState<{ mealIndex: number; name: string; sourceKey?: DayPartKey; meal?: MealInSlot } | null>(null);

    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        return date;
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8
            }
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 100,
                tolerance: 5
            }
        })
    );

    // Clean up old data from localStorage on mount
    useEffect(() => {
        const validKeys = new Set<string>();
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            DAY_DIVISION.forEach(part => {
                validKeys.add(`${dayIndex}-${part}`);
            });
        }

        setMealsInDayParts(prev => {
            const cleaned: Record<DayPartKey, MealInSlot[]> = {};
            Object.keys(prev).forEach(key => {
                if (validKeys.has(key)) {
                    cleaned[key as DayPartKey] = prev[key as DayPartKey];
                }
            });
            return cleaned;
        });
    }, [setMealsInDayParts]);

    const handleDragStart = (event: DragStartEvent) => {
        const data = event.active.data.current;
        if (data) {
            setActiveMeal({
                mealIndex: data.meal?.mealIndex ?? 0,
                name: data.meal?.name ?? '',
                sourceKey: data.sourceKey,
                meal: data.meal
            });
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        if (over && over.data.current?.type === 'daypart') {
            setDragOverSlot(over.data.current.key);
        } else {
            setDragOverSlot(null);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveMeal(null);
        setDragOverSlot(null);

        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        // Drop dans un day part
        if (overData?.type === 'daypart') {
            const targetKey = overData.key as DayPartKey;

            if (activeData?.sourceKey) {
                // Déplacement depuis un slot vers un autre slot
                const sourceKey = activeData.sourceKey as DayPartKey;
                const meal = activeData.meal as MealInSlot;

                if (sourceKey === targetKey) return;

                setMealsInDayParts(prev => {
                    const newState = { ...prev };
                    newState[sourceKey] = (prev[sourceKey] || []).filter(m => m.id !== meal.id);
                    newState[targetKey] = [...(prev[targetKey] || []), meal];
                    return newState;
                });
            } else if (activeData?.meal) {
                // Copie depuis la sidebar
                const sourceMeal = activeData.meal as Schema.MealPlanner.Meal.SelectWithIngredients;
                const mealIndex = meals.findIndex(m => m.id === sourceMeal.id) ?? 0;
                setMealsInDayParts(prev => ({
                    ...prev,
                    [targetKey]: [...(prev[targetKey] || []), {
                        ...sourceMeal,
                        id: `${Date.now()}-${Math.random()}`,
                        mealIndex: mealIndex,
                        ingredients: sourceMeal.ingredients || []
                    }]
                }));
            }
        }
        // Drop dans la sidebar (suppression)
        else if (overData?.type === 'sidebar' && activeData?.sourceKey) {
            const sourceKey = activeData.sourceKey as DayPartKey;
            const meal = activeData.meal as MealInSlot;

            setMealsInDayParts(prev => ({
                ...prev,
                [sourceKey]: (prev[sourceKey] || []).filter(m => m.id !== meal.id)
            }));
        }
    };

    const handleDragCancel = () => {
        setActiveMeal(null);
        setDragOverSlot(null);
    };

    const removeMealFromSlot = (key: DayPartKey, mealId: string | number) => {
        setMealsInDayParts(prev => ({
            ...prev,
            [key]: (prev[key] || []).filter(meal => meal.id !== mealId)
        }));
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <article className="border rounded-md flex flex-col md:flex-row h-auto md:h-175 overflow-hidden">
                <SidebarDropZone>
                    <header className="flex items-center justify-between">
                        <h3 className="page-title">Meals</h3>
                        <Button
                            variant="outline"
                            size="icon"
                            className="text-red-500 lg:opacity-0 lg:group-hover/meals-sidebar:opacity-100 transition-opacity"
                            tooltip="Remove all the meals for the week"
                            onClick={() => {
                                setMealsInDayParts({});
                            }}
                        >
                            <Trash className="size-4 text-red-500" />
                        </Button>
                    </header>
                    <div className="h-48 md:h-full overflow-y-auto overflow-x-hidden grid grid-cols-2 md:grid-cols-1 gap-2 content-start">
                        {isLoading && (
                            <div className="col-span-2 md:col-span-1 text-center py-4 text-sm text-gray-500">
                                Loading meals...
                            </div>
                        )}
                        {!isLoading && meals.length === 0 && (
                            <div className="col-span-2 md:col-span-1 text-center py-4 text-sm text-gray-500">
                                No meals available. Create some meals first!
                            </div>
                        )}
                        {!isLoading && meals.map((meal) => {
                            return (
                                <DraggableMeal
                                    key={meal.id}
                                    meal={meal}
                                />
                            );
                        })}
                    </div>
                </SidebarDropZone>
                <div className="w-full md:w-7/11 flex overflow-x-auto border-r min-h-96 md:min-h-150 snap-x snap-proximity scroll-smooth overscroll-x-contain border-b md:border-b-0">
                    {days.map((day) => {
                        const dayKey = day.toISOString();
                        const dayIndex = days.indexOf(day);
                        return (
                            <div key={dayKey} className="group/col border-r last:border-r-0 flex flex-col min-w-[70%] md:min-w-0 md:w-[calc(100%/7)] shrink-0 snap-center self-stretch">
                                <div className="border-b flex items-center justify-between px-1.5 md:px-2 py-1">
                                    <div>
                                        <div className="text-xs md:text-sm font-semibold truncate">
                                            {day.toLocaleDateString(undefined, { weekday: 'short' })}
                                        </div>
                                        <div className="text-[10px] md:text-xs">
                                            {day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setMealsInDayParts(prev => {
                                                const newState = { ...prev };
                                                DAY_DIVISION.forEach(part => {
                                                    const key: DayPartKey = `${dayIndex}-${part}`;
                                                    newState[key] = [];
                                                });
                                                return newState;
                                            });
                                        }}
                                        className="size-6 md:size-7 lg:opacity-0 lg:group-hover/col:opacity-100 transition-opacity"
                                        tooltip="Clear all meals for this day"
                                    >
                                        <Trash className="size-3 md:size-4 text-red-500" />
                                    </Button>
                                </div>
                                <div className="h-full flex flex-col">
                                    {DAY_DIVISION.map((part) => {
                                        const key: DayPartKey = `${dayIndex}-${part}`;
                                        const mealsInSlot = mealsInDayParts[key] || [];
                                        const isDragOver = dragOverSlot === key;

                                        return (
                                            <DroppableDayPartSlot
                                                key={part}
                                                dayIndex={dayIndex}
                                                part={part}
                                                meals={mealsInSlot}
                                                isOver={isDragOver}
                                                onRemoveMeal={(mealId) => removeMealFromSlot(key, mealId)}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <ListMakerSummary
                    meals={Object.values(mealsInDayParts)
                        .filter(mealArray => mealArray && mealArray.length > 0)
                        .flat()
                        .filter(meal => meal && meal.name && meal.ingredients)
                        .map(meal => ({
                            name: meal.name,
                            ingredients: meal.ingredients
                        }))}
                    className="w-full md:w-2/11 min-h-64 md:min-h-0"
                />
            </article>
            <DragOverlay>
                {activeMeal ? (
                    <div className="bg-accent px-2 py-1.5 rounded-md flex items-center gap-2 shadow-lg opacity-80">
                        <span className="text-sm">{activeMeal.name}</span>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}