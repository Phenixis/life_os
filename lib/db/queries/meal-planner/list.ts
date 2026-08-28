import * as lib from "../lib";
import { QueryModel } from "../model";

const table = lib.Schema.MealPlanner.List.table;
type New = lib.Schema.MealPlanner.List.Insert
type Existing = lib.Schema.MealPlanner.List.Select

export class ListQuery extends QueryModel<New, Existing> {
    constructor() {
        super(table);
    }
}