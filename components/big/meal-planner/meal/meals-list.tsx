"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Sorting from "@/components/ui/sorting";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useDebounce } from "use-debounce";
import MealDisplay from "./meal-display";
import { Plus } from "lucide-react";
import { useMealsQuery } from "@/hooks/use-meals";
import { useMealModal } from "@/contexts/modal-commands-context";

export const MEALS_LIST_PARAMS_KEY = "meals-list-params";

export const MEALS_LIST_ORDER_OPTIONS = [
    { value: "created_at", label: "Created" },
    { value: "updated_at", label: "Updated" },
    { value: "name", label: "Name" },
]

export default function MealsList() {
    const { openModal } = useMealModal();
    const [mealsParams, setMealsParams] = useLocalStorage<{
        searchQuery?: string;
        orderBy: "created_at" | "updated_at" | "name";
        orderingDirection: "asc" | "desc";
    }>(MEALS_LIST_PARAMS_KEY, {
        searchQuery: "",
        orderBy: "created_at",
        orderingDirection: "desc",
    });

    const [debouncedSearchQuery] = useDebounce(mealsParams.searchQuery, 300);

    const { meals, isLoading, isError } = useMealsQuery({
        searchQuery: debouncedSearchQuery,
        orderBy: mealsParams.orderBy,
        orderingDirection: mealsParams.orderingDirection,
        withIngredients: false, // Don't need ingredients in list view
    });

    return (
        <article className="*:py-2">
            <header className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h2 className="page-title mb-0!">Meals</h2>
                    <Button
                        variant="outline"
                        onClick={openModal}
                    >
                        <span className="hidden md:inline">
                            Add Meal
                        </span>
                        <span className="inline md:hidden">
                            <Plus className="size-4" />
                        </span>
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        className="w-32 md:w-64 text-sm"
                        placeholder="Search by name..."
                        value={mealsParams.searchQuery || ""}
                        onChange={(e) => setMealsParams({ ...mealsParams, searchQuery: e.target.value })}
                    />
                    <Sorting
                        orderBy={mealsParams.orderBy}
                        setOrderBy={(value) => setMealsParams({
                            ...mealsParams,
                            orderBy: value as "created_at" | "updated_at" | "name"
                        })}
                        orderingDirection={mealsParams.orderingDirection}
                        setOrderingDirection={(value) => setMealsParams({
                            ...mealsParams,
                            orderingDirection: value
                        })}
                        orderOptions={MEALS_LIST_ORDER_OPTIONS} />
                </div>
            </header>
            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {isLoading && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                        Loading meals...
                    </div>
                )}
                {isError && (
                    <div className="col-span-full text-center py-8 text-red-500">
                        Error loading meals. Please try again.
                    </div>
                )}
                {!isLoading && !isError && meals.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                        No meals found. Create your first meal!
                    </div>
                )}
                {!isLoading && !isError && meals.map((meal) => (
                    <MealDisplay key={meal.id} meal={meal} />
                ))}
            </main>
        </article>
    )
}