"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Sorting from "@/components/ui/sorting";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useDebounce } from "use-debounce";
import IngredientDisplay from "./ingredient-display";
import { Plus } from "lucide-react";
import { useIngredientsQuery } from "@/hooks/use-ingredients";
import { useIngredientModal } from "@/contexts/modal-commands-context";

export const INGREDIENTS_LIST_PARAMS_KEY = "ingredients-list-params";

export const INGREDIENTS_LIST_ORDER_OPTIONS = [
    { value: "name", label: "Name" },
    { value: "created_at", label: "Created" },
    { value: "updated_at", label: "Updated" },
]

export default function IngredientsList() {
    const { openModal } = useIngredientModal();

    const [ingredientsParams, setIngredientsParams] = useLocalStorage<{
        searchQuery?: string;
        orderBy: string;
        orderingDirection: "asc" | "desc";
    }>(INGREDIENTS_LIST_PARAMS_KEY, {
        searchQuery: "",
        orderBy: "name",
        orderingDirection: "asc",
    });

    const [debouncedSearchQuery] = useDebounce(ingredientsParams.searchQuery, 300);

    const { data: ingredients, isLoading, isError } = useIngredientsQuery({
        searchQuery: debouncedSearchQuery,
        orderBy: ingredientsParams.orderBy as "name" | "created_at" | "updated_at",
        orderingDirection: ingredientsParams.orderingDirection,
    });

    return (
        <article className="*:py-2">
            <header className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h2 className="page-title mb-0!">Ingredients</h2>
                    <Button variant="outline" onClick={() => openModal()}>
                        <span className="hidden md:inline">
                            Add Ingredient
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
                        value={ingredientsParams.searchQuery || ""}
                        onChange={(e) => setIngredientsParams({ ...ingredientsParams, searchQuery: e.target.value })}
                    />
                    <Sorting
                        orderBy={ingredientsParams.orderBy}
                        setOrderBy={(value) => setIngredientsParams({
                            ...ingredientsParams,
                            orderBy: value
                        })}
                        orderingDirection={ingredientsParams.orderingDirection}
                        setOrderingDirection={(value) => setIngredientsParams({
                            ...ingredientsParams,
                            orderingDirection: value
                        })}
                        orderOptions={INGREDIENTS_LIST_ORDER_OPTIONS} />
                </div>
            </header>
            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {isLoading && (
                    <p className="col-span-full text-center text-muted-foreground">
                        Loading ingredients...
                    </p>
                )}
                {isError && (
                    <p className="col-span-full text-center text-destructive">
                        Failed to load ingredients
                    </p>
                )}
                {!isLoading && !isError && ingredients?.length === 0 && (
                    <p className="col-span-full text-center text-muted-foreground">
                        No ingredients found. Create your first ingredient! 
                    </p>
                )}
                {!isLoading && !isError && ingredients?.map((ingredient) => (
                    <IngredientDisplay key={ingredient.id} ingredient={ingredient} />
                ))}
            </main>
        </article>
    )
}