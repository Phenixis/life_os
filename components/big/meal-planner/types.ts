import * as Schema from "@/lib/db/schema";

export type Ingredient = Schema.MealPlanner.Ingredient.Select & {
    quantity: number;
    unit: string;
};

// MealInSlot extends the meal schema but allows for temporary string IDs
// when meals are being dragged around locally (not yet saved to DB)
export type MealInSlot = Schema.MealPlanner.Meal.Select & {
    mealIndex: number;
    ingredients: Ingredient[];
};

export type DayPartKey = `${number}-${string}`;
