import * as lib from "../lib";
import { QueryModel } from "../model";

const table = lib.Schema.MealPlanner.IngredientToMealToList.table;
type New = lib.Schema.MealPlanner.IngredientToMealToList.Insert
type Existing = lib.Schema.MealPlanner.IngredientToMealToList.Select

export class IngredientToMealToListQuery extends QueryModel<New, Existing> {
    constructor() {
        super(table);
    }
}