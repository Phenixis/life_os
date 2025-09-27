"use server"

import * as lib from "../lib"
import { getUserHabits, getHabitById, getHabitsByFrequency } from "./habit"

//=============================================================================
// # HELPER FUNCTIONS
//=============================================================================

// Helper function to get cycle boundaries for a given date and frequency
function getCycleBoundaries(date: Date, freq: lib.Types.HabitTypes.HabitFrequency): { start: Date, end: Date } {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)

    switch (freq) {
        case "daily": {
            const start = new Date(d)
            const end = new Date(d.getTime() + 24 * 60 * 60 * 1000)
            return { start, end }
        }
        case "weekly": {
            // Get the start of the week (Monday)
            const dayOfWeek = d.getDay()
            const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
            const start = new Date(d.getTime() + mondayOffset * 24 * 60 * 60 * 1000)
            const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
            return { start, end }
        }
        case "monthly": {
            const start = new Date(d.getFullYear(), d.getMonth(), 1)
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
            return { start, end }
        }
        case "quarterly": {
            const quarterStartMonth = Math.floor(d.getMonth() / 3) * 3
            const start = new Date(d.getFullYear(), quarterStartMonth, 1)
            const end = new Date(d.getFullYear(), quarterStartMonth + 3, 1)
            return { start, end }
        }
        case "yearly": {
            const start = new Date(d.getFullYear(), 0, 1)
            const end = new Date(d.getFullYear() + 1, 0, 1)
            return { start, end }
        }
        default: {
            // Default to daily if frequency is unknown
            const start = new Date(d)
            const end = new Date(d.getTime() + 24 * 60 * 60 * 1000)
            return { start, end }
        }
    }
}

//=============================================================================
// # HABIT ENTRY
//=============================================================================

// ## Create

export async function createHabitEntry(
    userId: string,
    habitId: number,
    date: Date,
    count: number,
    notes?: string
): Promise<number> {
    const result = await lib.db
        .insert(lib.Schema.Habit.Entry.table)
        .values({
            habit_id: habitId,
            user_id: userId,
            date: date,
            count: count,
            notes: notes
        } as lib.Schema.Habit.Entry.Insert)
        .returning({ id: lib.Schema.Habit.Entry.table.id })

    // Revalidate all pages that might show habit entries
    lib.revalidatePath("/my", "layout")

    return result[0].id
}

// ## Read

export async function getHabitEntryById(userId: string, id: number): Promise<lib.Schema.Habit.Entry.Select | null> {
    const result = await lib.db
        .select()
        .from(lib.Schema.Habit.Entry.table)
        .where(lib.and(
            lib.eq(lib.Schema.Habit.Entry.table.id, id),
            lib.eq(lib.Schema.Habit.Entry.table.user_id, userId)
        ))

    return result[0] || null
}

export async function getHabitEntryByDate(
    userId: string,
    habitId: number,
    date: Date
): Promise<lib.Schema.Habit.Entry.Select | null> {
    // Create date without time for comparison
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    const result = await lib.db
        .select()
        .from(lib.Schema.Habit.Entry.table)
        .where(lib.and(
            lib.eq(lib.Schema.Habit.Entry.table.habit_id, habitId),
            lib.eq(lib.Schema.Habit.Entry.table.user_id, userId),
            lib.sql`${lib.Schema.Habit.Entry.table.date}::date = ${dateOnly}::date`
        ))

    return result[0] || null
}

export async function getHabitEntries(
    habitId: number,
    startDate?: Date,
    endDate?: Date,
    limit?: number
): Promise<lib.Schema.Habit.Entry.Select[]> {
    let whereConditions = lib.and(
        lib.eq(lib.Schema.Habit.Entry.table.habit_id, habitId)
    )

    if (startDate || endDate) {
        if (startDate && endDate) {
            whereConditions = lib.and(
                whereConditions,
                lib.between(lib.Schema.Habit.Entry.table.date, startDate, endDate)
            )
        } else if (startDate) {
            whereConditions = lib.and(
                whereConditions,
                lib.gte(lib.Schema.Habit.Entry.table.date, startDate)
            )
        } else if (endDate) {
            whereConditions = lib.and(
                whereConditions,
                lib.lte(lib.Schema.Habit.Entry.table.date, endDate)
            )
        }
    }

    const query = lib.db
        .select()
        .from(lib.Schema.Habit.Entry.table)
        .where(whereConditions)
        .orderBy(lib.desc(lib.Schema.Habit.Entry.table.date))

    if (limit) {
        query.limit(limit)
    }

    return await query
}

export async function getUserHabitEntries(
    userId: string,
    startDate?: Date,
    endDate?: Date
): Promise<(lib.Schema.Habit.Entry.Select & { habit: lib.Schema.Habit.Habit.Select})[]> {
    let whereConditions = lib.and(
        lib.eq(lib.Schema.Habit.Entry.table.user_id, userId),
        lib.isNull(lib.Schema.Habit.Habit.table.deleted_at)
    )

    if (startDate || endDate) {
        if (startDate && endDate) {
            whereConditions = lib.and(
                whereConditions,
                lib.between(lib.Schema.Habit.Entry.table.date, startDate, endDate)
            )
        } else if (startDate) {
            whereConditions = lib.and(
                whereConditions,
                lib.gte(lib.Schema.Habit.Entry.table.date, startDate)
            )
        } else if (endDate) {
            whereConditions = lib.and(
                whereConditions,
                lib.lte(lib.Schema.Habit.Entry.table.date, endDate)
            )
        }
    }

    return await lib.db
        .select({
            id: lib.Schema.Habit.Entry.table.id,
            habit_id: lib.Schema.Habit.Entry.table.habit_id,
            user_id: lib.Schema.Habit.Entry.table.user_id,
            date: lib.Schema.Habit.Entry.table.date,
            count: lib.Schema.Habit.Entry.table.count,
            notes: lib.Schema.Habit.Entry.table.notes,
            created_at: lib.Schema.Habit.Entry.table.created_at,
            updated_at: lib.Schema.Habit.Entry.table.updated_at,
            habit: lib.Schema.Habit.Habit.table
        })
        .from(lib.Schema.Habit.Entry.table)
        .innerJoin(lib.Schema.Habit.Habit.table, lib.eq(lib.Schema.Habit.Entry.table.habit_id, lib.Schema.Habit.Habit.table.id))
        .where(whereConditions)
        .orderBy(lib.desc(lib.Schema.Habit.Entry.table.date))
}

export async function getCycleProgress(
    userId: string,
    frequency: lib.Types.HabitTypes.HabitFrequency,
    date: Date
): Promise<{
    cycleStart: Date;
    cycleEnd: Date;
    habits: Array<{
        habit: lib.Schema.Habit.Habit.Select
        isCompleted: boolean;
        currentCount: number;
        targetCount: number;
        completionPercentage: number;
    }>;
}> {
    // Get cycle boundaries for the given date and frequency
    const { start: cycleStart, end: cycleEnd } = getCycleBoundaries(date, frequency)

    // Get all habits with the specified frequency for the user
    const habits = await getHabitsByFrequency(userId, frequency, true)

    // Check completion status for each habit in this cycle
    const habitProgress = await Promise.all(
        habits.map(async (habit) => {
            // Get all entries for this habit within the cycle
            const entries = await getHabitEntries(habit.id, cycleStart, cycleEnd)

            // Calculate total count for this cycle
            const currentCount = entries.reduce((sum, entry) => sum + entry.count, 0)
            const targetCount = habit.target_count || 1
            const isCompleted = currentCount >= targetCount
            const completionPercentage = Math.min(Math.round((currentCount / targetCount) * 100), 100)

            return {
                habit,
                isCompleted,
                currentCount,
                targetCount,
                completionPercentage
            }
        })
    )

    return {
        cycleStart,
        cycleEnd,
        habits: habitProgress
    }
}

// ## Update

export async function updateHabitEntry(
    userId: string,
    id: number,
    count?: number,
    notes?: string
): Promise<number | null> {
    const updateData: Partial<lib.Schema.Habit.Entry.Insert> = {
        updated_at: new Date()
    }

    if (count !== undefined) updateData.count = count
    if (notes !== undefined) updateData.notes = notes

    const result = await lib.db
        .update(lib.Schema.Habit.Entry.table)
        .set(updateData)
        .where(lib.and(
            lib.eq(lib.Schema.Habit.Entry.table.id, id),
            lib.eq(lib.Schema.Habit.Entry.table.user_id, userId)
        ))
        .returning({ id: lib.Schema.Habit.Entry.table.id })

    // Revalidate all pages that might show habit entries
    lib.revalidatePath("/my", "layout")

    if (!result || result.length === 0) {
        return null
    }

    return result[0].id
}

export async function updateHabitEntryByDate(
    userId: string,
    habitId: number,
    date: Date,
    count?: number,
    notes?: string
): Promise<number | null> {
    const existingEntry = await getHabitEntryByDate(userId, habitId, date)

    if (!existingEntry) {
        // Create new entry if it doesn't exist
        return await createHabitEntry(userId, habitId, date, count || 1, notes)
    }

    // Update existing entry
    return await updateHabitEntry(userId, existingEntry.id, count, notes)
}

// ## Delete

export async function deleteHabitEntry(userId: string, id: number): Promise<number | null> {
    const result = await lib.db
        .delete(lib.Schema.Habit.Entry.table)
        .where(lib.and(
            lib.eq(lib.Schema.Habit.Entry.table.id, id),
            lib.eq(lib.Schema.Habit.Entry.table.user_id, userId)
        ))
        .returning({ id: lib.Schema.Habit.Entry.table.id })

    // Revalidate all pages that might show habit entries
    lib.revalidatePath("/my", "layout")

    if (!result || result.length === 0) {
        return null
    }

    return result[0].id
}

export async function deleteHabitEntryByDate(
    userId: string,
    habitId: number,
    date: Date
): Promise<number | null> {
    const entry = await getHabitEntryByDate(userId, habitId, date)

    if (!entry) {
        return null
    }

    return await deleteHabitEntry(userId, entry.id)
}

//=============================================================================
// # HABIT STATISTICS
//=============================================================================

export async function getHabitStats(userId: string, habitId: number): Promise<lib.Types.HabitTypes.HabitStats> {
    // Fetch habit and entries
    const habit = await getHabitById(habitId)
    if (!habit) {
        return {
            number_of_cycles: 0,
            number_of_cycles_completed: 0,
            number_of_cycles_uncompleted: 0,
            number_of_cycles_in_progress: 0,
            current_streak_of_cycles_completed: 0,
            longest_streak_of_cycles_completed: 0,
            completion_rate: 0
        }
    }

    const entries = await getHabitEntries(habitId)
    const frequency = habit.frequency
    const targetCount = habit.target_count || 1

    // Determine cycle boundaries
    const startDate = new Date(habit.created_at)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Helper to get next cycle start date
    function addCycle(date: Date, freq: string): Date {
        const d = new Date(date)
        switch (freq) {
            case "daily":
                d.setDate(d.getDate() + 1)
                break
            case "weekly":
                d.setDate(d.getDate() + 7)
                break
            case "monthly":
                d.setMonth(d.getMonth() + 1)
                break
            case "quarterly":
                d.setMonth(d.getMonth() + 3)
                break
            case "yearly":
                d.setFullYear(d.getFullYear() + 1)
                break
            default:
                d.setDate(d.getDate() + 1)
        }
        return d
    }

    // Generate all cycles from creation to today
    const cycles: { start: Date, end: Date }[] = []
    let cycleStart = new Date(startDate)
    let cycleEnd = addCycle(cycleStart, frequency)
    while (cycleStart <= today) {
        cycles.push({ start: new Date(cycleStart), end: new Date(cycleEnd) })
        cycleStart = new Date(cycleEnd)
        cycleEnd = addCycle(cycleStart, frequency)
    }

    // Map entries to cycles
    const entriesByCycle = cycles.map(({ start, end }) => {
        const entriesInCycle = entries.filter(entry =>
            entry.date >= start && entry.date < end
        )
        const totalCount = entriesInCycle.reduce((sum, entry) => sum + entry.count, 0)
        return {
            completed: totalCount >= targetCount,
            inProgress: totalCount > 0 && totalCount < targetCount,
            entries: entriesInCycle
        }
    })

    const number_of_cycles = cycles.length
    const number_of_cycles_completed = entriesByCycle.filter(c => c.completed).length
    const number_of_cycles_in_progress = entriesByCycle.filter(c => c.inProgress && !c.completed).length
    const number_of_cycles_uncompleted = number_of_cycles - number_of_cycles_completed - number_of_cycles_in_progress

    // Calculate streaks
    let current_streak_of_cycles_completed = 0
    let longest_streak_of_cycles_completed = 0
    let tempStreak = 0

    for (let i = 0; i < entriesByCycle.length; i++) {
        if (entriesByCycle[i].completed) {
            tempStreak++
            longest_streak_of_cycles_completed = Math.max(longest_streak_of_cycles_completed, tempStreak)
        } else {
            tempStreak = 0
        }
    }

    // Current streak: count from the end backwards
    tempStreak = 0
    for (let i = entriesByCycle.length - 1; i >= 0; i--) {
        if (entriesByCycle[i].completed) {
            tempStreak++
        } else {
            break
        }
    }
    current_streak_of_cycles_completed = tempStreak

    // Completion rate
    const completion_rate = number_of_cycles > 0
        ? Math.round((number_of_cycles_completed / number_of_cycles) * 100)
        : 0

    return {
        number_of_cycles,
        number_of_cycles_completed,
        number_of_cycles_uncompleted,
        number_of_cycles_in_progress,
        current_streak_of_cycles_completed,
        longest_streak_of_cycles_completed,
        completion_rate
    }
}

export async function getUserHabitStats(userId: string): Promise<{
    totalHabits: number;
    activeHabits: number;
    totalCompletions: number;
    averageCompletionRate: number;
}> {
    const habits = await getUserHabits(userId, false)
    const activeHabits = habits.filter(habit => habit.is_active)

    const allEntries = await getUserHabitEntries(userId)
    const totalCompletions = allEntries.reduce((sum, entry) => sum + entry.count, 0)

    // Calculate average completion rate across all active habits
    let totalCompletionRate = 0
    let habitCount = 0

    for (const habit of activeHabits) {
        const stats: lib.Types.HabitTypes.HabitStats = await getHabitStats(userId, habit.id)
        totalCompletionRate += stats.completion_rate
        habitCount++
    }

    const averageCompletionRate = habitCount > 0 ? totalCompletionRate / habitCount : 0

    return {
        totalHabits: habits.length,
        activeHabits: activeHabits.length,
        totalCompletions,
        averageCompletionRate: Math.round(averageCompletionRate)
    }
}
