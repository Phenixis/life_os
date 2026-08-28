"use client";

import { Button } from "@/components/ui/button";
import * as Schema from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { ScanText, Text } from "lucide-react";
import { useState } from "react";
import IngredientDisplay from "./ingredient/ingredient-display";

type MealSummary = {
    name: string;
    ingredients: Array<Schema.MealPlanner.Ingredient.Select & { quantity: number; unit: string }>;
}

export default function ListMakerSummary({
    className = "",
    meals
}: Readonly<{
    className?: string;
    meals?: MealSummary[];
}>) {
    const [isSummaryGrouped, setIsSummaryGrouped] = useState<boolean>(true);

    return (
        <div className={cn("p-2 flex flex-col gap-2", className)}>
            <header className="flex items-center justify-between">
                <h3 className="page-title mb-0">
                    Summary
                </h3>
                <Button
                    variant="outline"
                    size="icon"
                    className=""
                    onClick={() => setIsSummaryGrouped(!isSummaryGrouped)}
                >
                    {
                        isSummaryGrouped ? <ScanText className="size-4" /> : <Text className="size-4" />
                    }
                </Button>
            </header>
            <div className="h-full overflow-auto">
                {(!meals || meals.length === 0) ? (
                    <p className="text-sm text-gray-500">No meals added yet. Drag meals to the calendar to see the summary.</p>
                ) : isSummaryGrouped ? (
                    // Grouped by meal
                    meals.map((meal) => (
                        <div key={meal.name} className="mb-4">
                            <h4 className="text-sm font-semibold mb-2">{meal.name}</h4>
                            <div className="flex flex-col gap-1">
                                {meal.ingredients?.map((ingredient) => (
                                    <div key={ingredient.id} className="flex items-center gap-2">
                                        <IngredientDisplay ingredient={ingredient} />
                                        <span className="text-xs text-muted-foreground">
                                            {ingredient.quantity} {ingredient.unit}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    // All ingredients grouped by name with quantities
                    (() => {
                        const ingredientMap: Record<number, {
                            ingredient: Schema.MealPlanner.Ingredient.Select;
                            totalQuantity: number;
                            unit: string;
                        }> = {};

                        // Aggregate ingredients by ID
                        meals?.forEach((meal) => {
                            meal.ingredients.forEach((ingredient) => {
                                if (ingredientMap[ingredient.id]) {
                                    ingredientMap[ingredient.id].totalQuantity += ingredient.quantity;
                                } else {
                                    ingredientMap[ingredient.id] = {
                                        ingredient,
                                        totalQuantity: ingredient.quantity,
                                        unit: ingredient.unit,
                                    };
                                }
                            });
                        });

                        return (
                            <div className="flex flex-col gap-1">
                                {Object.values(ingredientMap).map(({ ingredient, totalQuantity, unit }) => (
                                    <div key={ingredient.id} className="flex items-center gap-2">
                                        <IngredientDisplay ingredient={ingredient} />
                                        <span className="text-xs text-muted-foreground">
                                            {totalQuantity} {unit}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        );
                    })()
                )}
            </div>
            <Button variant={"default"} className="w-full">
                Generate List
            </Button>
        </div>
    );
}