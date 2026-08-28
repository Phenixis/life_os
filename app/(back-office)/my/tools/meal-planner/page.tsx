import ListMaker from "@/components/big/meal-planner/list-maker";
import MealsList from "@/components/big/meal-planner/meal/meals-list";
import IngredientsList from "@/components/big/meal-planner/ingredient/ingredients-list";

export default function Page() {
    return (
        <section className={"page"}>
            <h1 className={"page-title"}>
                Meal Planner Page
            </h1>
            <ListMaker />
            <MealsList />
            <IngredientsList />
        </section>
    )
}