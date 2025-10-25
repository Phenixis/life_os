import * as lib from "../lib";
import { getTaskById } from "./task";

const Table = lib.Schema.Task.Recurrency.table;

type New = lib.Schema.Task.Recurrency.Insert;
type Existing = lib.Schema.Task.Recurrency.Select;
type RecurrentTask = lib.Schema.Task.Recurrency.RecurrentTask;


const TaskTable = lib.Schema.Task.Task.table;

// CREATE

export async function Create(values: New): Promise<Existing> {
    return (await lib.db
        .insert(Table)
        .values(values)
        .returning())[0];
}

// READ

export async function GetById(id: number): Promise<Existing | null> {
    return (await lib.db
        .select()
        .from(Table)
        .where(lib.eq(Table.task_id, id))
        .limit(1))[0] || null;
}

export async function GetByCycle(user_id: string, cycle: string): Promise<RecurrentTask[]> {
    return (await lib.db
        .select()
        .from(Table)
        .innerJoin(TaskTable, lib.eq(Table.task_id, TaskTable.id))
        .where(lib.and(
            lib.eq(TaskTable.user_id, user_id),
            lib.eq(Table.cycle, cycle)
        )));
}

// UPDATE

export async function Update(id: number, values: Partial<New>): Promise<Existing | null> {
    return (await lib.db
        .update(Table)
        .set(values)
        .where(lib.eq(Table.task_id, id))
        .returning())[0] || null;
}

// DELETE

export async function Delete(id: number): Promise<Existing | null> {
    return (await lib.db
        .delete(Table)
        .where(lib.eq(Table.task_id, id))
        .returning())[0] || null;
}

// UTILS

export async function CalculateNextDue(task_id: number): Promise<Date | null> {
    const completed_task = await getTaskById(task_id);
    if (!completed_task) return null;

    const recurrency = await GetById(completed_task.id);
    if (!recurrency) return null;

    const now = new Date();
    const next_due = new Date(completed_task.due);

    do {
        switch (recurrency.cycle) {
            case lib.Schema.Task.Recurrency.Cycle.DAILY:
                next_due.setDate(next_due.getDate() + recurrency.interval);
                break;
            case lib.Schema.Task.Recurrency.Cycle.WEEKLY:
                next_due.setDate(next_due.getDate() + (recurrency.interval * 7));
                break;
            case lib.Schema.Task.Recurrency.Cycle.MONTHLY:
                next_due.setMonth(next_due.getMonth() + recurrency.interval);
                break;
            case lib.Schema.Task.Recurrency.Cycle.YEARLY:
                next_due.setFullYear(next_due.getFullYear() + recurrency.interval);
                break;
            default:
                return null;
        }
    } while (next_due < now);

    // If the next due is higher than the stop date or the count is reached, return null
    if (recurrency.until && next_due > recurrency.until) return null;
    if (recurrency.count && (recurrency.current_count + 1) > recurrency.count) return null;

    return next_due;
}

export async function IncrementCurrentCount(task_id: number): Promise<Existing | null> {
    return (await lib.db
        .update(Table)
        .set({ current_count: lib.sql`${Table.current_count} + 1` })
        .where(lib.eq(Table.task_id, task_id))
        .returning())[0] || null;   
}