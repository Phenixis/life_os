import type { Ingredient } from "./types";

export const DAY_DIVISION = ["Morning", "Noon", "Afternoon", "Evening", "Night"];

export type MealIngredient = {
    name: string;
    quantity: number;
};

export const generateIngredientsForMeal = (mealIndex: number): MealIngredient[] => {
    const allIngredients = [
        'Tomato', 'Onion', 'Garlic', 'Olive Oil', 'Salt', 'Pepper',
        'Chicken', 'Rice', 'Pasta', 'Cheese', 'Egg', 'Milk',
        'Carrot', 'Potato', 'Spinach', 'Broccoli'
    ];

    // Generate 2-4 ingredients per meal based on meal index
    const numIngredients = 2 + (mealIndex % 3);
    const ingredients: MealIngredient[] = [];

    for (let i = 0; i < numIngredients; i++) {
        const ingredientIndex = (mealIndex * 3 + i) % allIngredients.length;
        ingredients.push({
            name: allIngredients[ingredientIndex],
            quantity: 1 + (mealIndex % 3)
        });
    }

    return ingredients;
};
