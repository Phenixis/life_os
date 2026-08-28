# Meal Planner API Documentation

## Overview
The Meal Planner API provides endpoints for managing meals, ingredients, and their relationships. All endpoints require authentication via Bearer token (user's API key).

## Base URL
All endpoints are prefixed with `/api`

## Endpoints

### Meals

#### GET `/api/meal`
Get all meals for authenticated user with optional filtering.

**Query Parameters:**
- `searchQuery` (string, optional) - Search meals by name
- `orderBy` (string, optional) - Sort field: `created_at`, `updated_at`, `name` (default: `created_at`)
- `orderingDirection` (string, optional) - Sort direction: `asc`, `desc` (default: `desc`)
- `limit` (number, optional) - Max results (default: 50)
- `offset` (number, optional) - Pagination offset (default: 0)
- `withIngredients` (boolean, optional) - Include ingredients in response (default: false)

**Response:**
```json
{
  "success": "Meals retrieved successfully.",
  "meals": [
    {
      "id": 1,
      "user_id": "abc123",
      "name": "Pasta Carbonara",
      "description": "Classic Italian pasta",
      "image_url": "https://...",
      "created_at": "2026-01-06T...",
      "updated_at": "2026-01-06T...",
      "deleted_at": null,
      "ingredients": [
        {
          "id": 1,
          "name": "Pasta",
          "quantity": 200,
          "unit": "g",
          ...
        }
      ]
    }
  ]
}
```

#### POST `/api/meal`
Create a new meal.

**Body:**
```json
{
  "name": "Pasta Carbonara",
  "description": "Classic Italian pasta",
  "image_url": "https://...",
  "ingredients": [
    {
      "name": "Pasta",
      "quantity": 200,
      "unit": "g",
      "description": "Spaghetti or similar"
    }
  ]
}
```

**Response:**
```json
{
  "success": "Meal created successfully.",
  "createdEntity": { /* meal with ingredients */ }
}
```

#### GET `/api/meal/[id]`
Get a single meal by ID with ingredients.

**Response:**
```json
{
  "success": "Meal retrieved successfully.",
  "meal": { /* meal with ingredients */ }
}
```

#### PUT `/api/meal/[id]`
Update a meal.

**Body:**
```json
{
  "name": "Updated name",
  "description": "Updated description",
  "image_url": "https://...",
  "ingredients": [ /* array of ingredients */ ]
}
```

**Response:**
```json
{
  "success": "Meal updated successfully.",
  "updatedEntity": { /* updated meal with ingredients */ }
}
```

#### DELETE `/api/meal/[id]`
Soft delete a meal.

**Response:**
```json
{
  "success": "Deleted successfully."
}
```

### Meal Ingredients

#### GET `/api/meal/[id]/ingredients`
Get all ingredients for a specific meal.

**Response:**
```json
{
  "success": "Ingredients retrieved successfully.",
  "ingredients": [ /* array of ingredients with quantity/unit */ ]
}
```

#### POST `/api/meal/[id]/ingredients`
Add an ingredient to a meal.

**Body:**
```json
{
  "ingredient_id": 5,
  "quantity": 200,
  "unit": "g"
}
```
OR
```json
{
  "ingredient_name": "Tomato",
  "quantity": 3,
  "unit": "unit",
  "description": "Fresh tomatoes",
  "image_url": "https://..."
}
```

**Response:**
```json
{
  "success": "Ingredient added successfully.",
  "relation": { /* ingredient-to-meal relation */ }
}
```

#### DELETE `/api/meal/[id]/ingredients?ingredient_id=[ingredientId]`
Remove an ingredient from a meal.

**Query Parameters:**
- `ingredient_id` (number, required) - ID of ingredient to remove

**Response:**
```json
{
  "success": "Ingredient removed from meal successfully."
}
```

### Ingredients

#### GET `/api/ingredient`
Get all ingredients for authenticated user.

**Query Parameters:**
- `searchQuery` (string, optional) - Search ingredients by name
- `orderBy` (string, optional) - Sort field: `created_at`, `updated_at`, `name` (default: `name`)
- `orderingDirection` (string, optional) - Sort direction: `asc`, `desc` (default: `asc`)
- `limit` (number, optional) - Max results (default: 100)
- `offset` (number, optional) - Pagination offset (default: 0)

**Response:**
```json
{
  "success": "Ingredients retrieved successfully.",
  "ingredients": [ /* array of ingredients */ ]
}
```

#### POST `/api/ingredient`
Create a new ingredient (or return existing if name matches).

**Body:**
```json
{
  "name": "Tomato",
  "description": "Fresh tomatoes",
  "image_url": "https://..."
}
```

**Response:**
```json
{
  "success": "Ingredient created successfully.",
  "createdEntity": { /* ingredient */ }
}
```

#### GET `/api/ingredient/[id]`
Get a single ingredient by ID.

#### PUT `/api/ingredient/[id]`
Update an ingredient.

#### DELETE `/api/ingredient/[id]`
Soft delete an ingredient.

---

## React Hooks Usage

### Using React Query Hooks

```tsx
import { 
  useMealsQuery, 
  useMealQuery,
  useCreateMeal,
  useUpdateMeal,
  useDeleteMeal,
} from "@/hooks/use-meals"
import { useIngredientsQuery } from "@/hooks/use-ingredients"

// Get all meals with ingredients
function MealsList() {
  const { meals, isLoading, isError } = useMealsQuery({
    searchQuery: "pasta",
    orderBy: "name",
    withIngredients: true
  })

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error loading meals</div>

  return (
    <div>
      {meals.map(meal => (
        <div key={meal.id}>
          <h3>{meal.name}</h3>
          <p>{meal.description}</p>
          <ul>
            {meal.ingredients.map(ing => (
              <li key={ing.id}>
                {ing.name} - {ing.quantity} {ing.unit}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

// Get single meal
function MealDetail({ mealId }: { mealId: number }) {
  const { data: meal, isLoading } = useMealQuery(mealId)

  if (isLoading) return <div>Loading...</div>
  if (!meal) return <div>Not found</div>

  return <div>{meal.name}</div>
}

// Get ingredients
function IngredientsList() {
  const { ingredients, isLoading } = useIngredientsQuery({
    searchQuery: "tom",
    orderBy: "name"
  })

  return (
    <ul>
      {ingredients.map(ing => (
        <li key={ing.id}>{ing.name}</li>
      ))}
    </ul>
  )
}
```

### Using Mutation Hooks

```tsx
import { useCreateMeal, useUpdateMeal, useDeleteMeal } from "@/hooks/use-meals"
import { useCreateIngredient } from "@/hooks/use-ingredients"

function CreateMealForm() {
  const createMeal = useCreateMeal()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const meal = await createMeal.mutateAsync({
        name: "Pasta Carbonara",
        description: "Classic Italian pasta",
        ingredients: [
          { name: "Pasta", quantity: 200, unit: "g" },
          { name: "Eggs", quantity: 3, unit: "unit" },
          { name: "Bacon", quantity: 100, unit: "g" }
        ]
      })
      
      console.log("Created meal:", meal)
    } catch (error) {
      console.error("Failed to create meal:", error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={createMeal.isPending}>
        {createMeal.isPending ? "Creating..." : "Create Meal"}
      </button>
      {createMeal.isError && <p>Error: {createMeal.error.message}</p>}
    </form>
  )
}

function UpdateMealForm({ mealId }: { mealId: number }) {
  const updateMeal = useUpdateMeal()

  const handleUpdate = async () => {
    try {
      await updateMeal.mutateAsync({
        id: mealId,
        data: {
          name: "Updated Pasta Carbonara",
          ingredients: [
            { name: "Pasta", quantity: 250, unit: "g" }
          ]
        }
      })
    } catch (error) {
      console.error("Failed to update meal:", error)
    }
  }

  return (
    <button onClick={handleUpdate} disabled={updateMeal.isPending}>
      {updateMeal.isPending ? "Updating..." : "Update"}
    </button>
  )
}

function DeleteMealButton({ mealId }: { mealId: number }) {
  const deleteMeal = useDeleteMeal()

  return (
    <button 
      onClick={() => deleteMeal.mutate(mealId)}
      disabled={deleteMeal.isPending}
    >
      {deleteMeal.isPending ? "Deleting..." : "Delete"}
    </button>
  )
}
```

### Available Hooks

#### Query Hooks
- `useMealsQuery(filters?, options?)` - Fetch meals list
- `useMealQuery(id, options?)` - Fetch single meal
- `useIngredientsQuery(filters?, options?)` - Fetch ingredients list
- `useIngredientQuery(id, options?)` - Fetch single ingredient

#### Mutation Hooks
- `useCreateMeal()` - Create a meal
- `useUpdateMeal()` - Update a meal
- `useDeleteMeal()` - Delete a meal
- `useAddIngredientToMeal()` - Add ingredient to meal
- `useRemoveIngredientFromMeal()` - Remove ingredient from meal
- `useCreateIngredient()` - Create an ingredient
- `useUpdateIngredient()` - Update an ingredient
- `useDeleteIngredient()` - Delete an ingredient

---

## TypeScript Types

```typescript
import type { MealWithIngredients } from "@/lib/db/queries/meal-planner/meal"
import type { Schema } from "@/lib/db/schema"

// Meal with ingredients
type Meal = MealWithIngredients

// Basic meal
type BasicMeal = Schema.MealPlanner.Meal.Select

// Ingredient
type Ingredient = Schema.MealPlanner.Ingredient.Select

// Ingredient with quantity/unit (in meal context)
type MealIngredient = Ingredient & {
  quantity: number
  unit: string
}
```

---

## Error Handling

All endpoints return standard error responses:

```json
{
  "error": "Error message here"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `403` - Forbidden (not authorized)
- `404` - Not Found
- `500` - Internal Server Error
