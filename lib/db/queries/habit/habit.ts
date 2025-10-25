"use server"

import * as lib from "../lib"

//=============================================================================
// # HABIT
//=============================================================================

// ## Create

export async function createHabit(
    userId: string,
    title: string,
    color: lib.Types.HabitTypes.HabitColor,
    icon: string,
    frequency: lib.Types.HabitTypes.HabitFrequency,
    targetCount: number,
    description?: string,
): Promise<number> {
    const result = await lib.db
        .insert(lib.Schema.Habit.Habit.table)
        .values({
            user_id: userId,
            title: title,
            description: description,
            color: color,
            icon: icon,
            frequency: frequency,
            target_count: targetCount,
            is_active: true
        } as lib.Schema.Habit.Habit.Insert)
        .returning({ id: lib.Schema.Habit.Habit.table.id })

    // Revalidate all pages that might show habits
    lib.revalidatePath("/my", "layout")

    return result[0].id
}

// ## Read

export async function getHabitById(id: number): Promise<lib.Schema.Habit.Habit.Select | null> {
    const result = await lib.db
        .select()
        .from(lib.Schema.Habit.Habit.table)
        .where(
            lib.and(
                lib.eq(lib.Schema.Habit.Habit.table.id, id),
                lib.isNull(lib.Schema.Habit.Habit.table.deleted_at)
            )
        )

    return result[0] || null
}

export async function getUserHabits(userId: string, activeOnly: boolean = true): Promise<lib.Schema.Habit.Habit.Select[]> {
    return await lib.db
        .select()
        .from(lib.Schema.Habit.Habit.table)
        .where(lib.and(
            lib.eq(lib.Schema.Habit.Habit.table.user_id, userId),
            lib.isNull(lib.Schema.Habit.Habit.table.deleted_at),
            activeOnly ? lib.eq(lib.Schema.Habit.Habit.table.is_active, true) : lib.sql`1 = 1`
        ))
        .orderBy(lib.desc(lib.Schema.Habit.Habit.table.created_at))
}

export async function getHabitsByFrequency(
    userId: string,
    frequency: lib.Types.HabitTypes.HabitFrequency,
    activeOnly: boolean = true
): Promise<lib.Schema.Habit.Habit.Select[]> {
    return await lib.db
        .select()
        .from(lib.Schema.Habit.Habit.table)
        .where(lib.and(
            lib.eq(lib.Schema.Habit.Habit.table.user_id, userId),
            lib.eq(lib.Schema.Habit.Habit.table.frequency, frequency),
            lib.isNull(lib.Schema.Habit.Habit.table.deleted_at),
            activeOnly ? lib.eq(lib.Schema.Habit.Habit.table.is_active, true) : lib.sql`1 = 1`
        ))
        .orderBy(lib.desc(lib.Schema.Habit.Habit.table.created_at))
}

export async function searchHabits(userId: string, searchTerm: string): Promise<lib.Schema.Habit.Habit.Select[]> {
    // Normalize comparison by converting both title and searchTerm to lowercase
    return await lib.db
        .select()
        .from(lib.Schema.Habit.Habit.table)
        .where(lib.and(
            lib.eq(lib.Schema.Habit.Habit.table.user_id, userId),
            lib.sql`LOWER(${lib.Schema.Habit.Habit.table.title}) LIKE LOWER(${`%${searchTerm}%`})`,
            lib.isNull(lib.Schema.Habit.Habit.table.deleted_at)
        ))
        .orderBy(lib.desc(lib.Schema.Habit.Habit.table.updated_at))
}

// ## Update

export async function updateHabit(
    userId: string,
    id: number,
    title?: string,
    description?: string,
    color?: lib.Types.HabitTypes.HabitColor,
    icon?: string,
    frequency?: lib.Types.HabitTypes.HabitFrequency,
    targetCount?: number,
    isActive?: boolean
): Promise<number | null> {
    const updateData: Partial<lib.Schema.Habit.Habit.Insert> = {
        updated_at: new Date()
    }

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (color !== undefined) updateData.color = color
    if (icon !== undefined) updateData.icon = icon
    if (frequency !== undefined) updateData.frequency = frequency
    if (targetCount !== undefined) updateData.target_count = targetCount
    if (isActive !== undefined) updateData.is_active = isActive

    const result = await lib.db
        .update(lib.Schema.Habit.Habit.table)
        .set(updateData)
        .where(lib.and(
            lib.eq(lib.Schema.Habit.Habit.table.id, id),
            lib.eq(lib.Schema.Habit.Habit.table.user_id, userId),
            lib.isNull(lib.Schema.Habit.Habit.table.deleted_at)
        ))
        .returning({ id: lib.Schema.Habit.Habit.table.id })

    // Revalidate all pages that might show habits
    lib.revalidatePath("/my", "layout")

    if (!result || result.length === 0) {
        return null
    }

    return result[0].id
}

export async function toggleHabitActive(id: number): Promise<boolean | null> {
    const habit = await getHabitById(id)
    if (!habit) return null

    const result = await lib.db
        .update(lib.Schema.Habit.Habit.table)
        .set({
            is_active: !habit.is_active,
            updated_at: new Date()
        })
        .where(lib.and(
            lib.eq(lib.Schema.Habit.Habit.table.id, id),
            lib.isNull(lib.Schema.Habit.Habit.table.deleted_at)
        ))
        .returning({ is_active: lib.Schema.Habit.Habit.table.is_active })

    // Revalidate all pages that might show habits
    lib.revalidatePath("/my", "layout")

    if (!result || result.length === 0) {
        return null
    }

    return result[0].is_active
}

// ## Delete

export async function deleteHabit(userId: string, id: number): Promise<number | null> {
    const result = await lib.db
        .update(lib.Schema.Habit.Habit.table)
        .set({
            deleted_at: new Date(),
            updated_at: new Date()
        })
        .where(lib.and(
            lib.eq(lib.Schema.Habit.Habit.table.id, id),
            lib.eq(lib.Schema.Habit.Habit.table.user_id, userId)
        ))
        .returning({ id: lib.Schema.Habit.Habit.table.id })

    // Revalidate all pages that might show habits
    lib.revalidatePath("/my", "layout")

    if (!result || result.length === 0) {
        return null
    }

    return result[0].id
}