import { cacheThrough, invalidate } from "@/lib/cache/cache-through";
import * as lib from "./lib"

const TABLE_NAME = "daily_mood";

export async function createDailyMood(
    userId: string,
    mood: number,
    date: Date,
    comment: string
): Promise<lib.Schema.DailyMood.Select> {

    const alreadyExists = await getDailyMood(userId, date);

    if (alreadyExists) {
        throw new Error("Mood already exists for this date");
    }


    const dailyMood = await lib.db
        .insert(lib.Schema.DailyMood.table)
        .values({
            user_id: userId,
            mood: mood,
            comment: comment,
            date: date,
        })
        .returning()

    lib.revalidatePath("/mood");

    return dailyMood[0];
}

export async function getDailyMoods(
    userId: string,
    startDate: Date,
    endDate: Date
): Promise<lib.Schema.DailyMood.Select[]> {
    // Step 1: Get IDs
    const idRows = await lib.db
        .select({ id: lib.Schema.DailyMood.table.id })
        .from(lib.Schema.DailyMood.table)
        .where(
            lib.and(
                lib.eq(lib.Schema.DailyMood.table.user_id, userId),
                lib.isNull(lib.Schema.DailyMood.table.deleted_at),
                lib.gte(lib.Schema.DailyMood.table.date, new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())),
                lib.lte(lib.Schema.DailyMood.table.date, new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())),
            )
        )
        .orderBy(lib.desc(lib.Schema.DailyMood.table.date))

    lib.revalidatePath("/my");

    if (!idRows || idRows.length === 0) {
        throw new Error("No mood found for this period");
    }

    // Step 2-4: Cache-through
    return cacheThrough<lib.Schema.DailyMood.Select, number>(
        TABLE_NAME,
        idRows.map(r => r.id),
        async (missingIds) => {
            return await lib.db
                .select()
                .from(lib.Schema.DailyMood.table)
                .where(lib.inArray(lib.Schema.DailyMood.table.id, missingIds))
        },
        (mood) => mood.id
    )
}

export async function getDailyMood(
    userId: string,
    date: Date
): Promise<lib.Schema.DailyMood.Select | null> {
    let dailyMood: lib.Schema.DailyMood.Select[]

    try {
        dailyMood = await getDailyMoods(
            userId,
            new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        );

        return dailyMood[0]
    } catch (error) {
        if (error instanceof Error && error.message === "No mood found for this period") {
            return null
        }
        console.error("Error fetching daily mood:", error);
        return null
    }

}

export async function updateDailyMood(
    userId: string,
    mood: number,
    date: Date,
    comment: string
): Promise<lib.Schema.DailyMood.Select> {
    const dailyMood = await lib.db
        .update(lib.Schema.DailyMood.table)
        .set({
            mood: mood,
            updated_at: new Date(),
            comment: comment,
        })
        .where(
            lib.and(
                lib.eq(lib.Schema.DailyMood.table.user_id, userId),
                lib.isNull(lib.Schema.DailyMood.table.deleted_at),
                lib.eq(lib.Schema.DailyMood.table.date, new Date(date.getFullYear(), date.getMonth(), date.getDate()))
            )
        )
        .returning()

    if (dailyMood[0]) {
        await invalidate(TABLE_NAME, dailyMood[0].id)
    }

    lib.revalidatePath("/my");

    return dailyMood[0];
}

export async function deleteDailyMood(
    userId: string,
    date: Date
): Promise<lib.Schema.DailyMood.Select> {
    const dailyMood = await lib.db
        .update(lib.Schema.DailyMood.table)
        .set({
            deleted_at: new Date(),
        })
        .where(
            lib.and(
                lib.eq(lib.Schema.DailyMood.table.user_id, userId),
                lib.isNull(lib.Schema.DailyMood.table.deleted_at),
                lib.eq(lib.Schema.DailyMood.table.date, new Date(date.getFullYear(), date.getMonth(), date.getDate()))
            )
        )
        .returning()

    if (dailyMood[0]) {
        await invalidate(TABLE_NAME, dailyMood[0].id)
    }

    lib.revalidatePath("/my");

    return dailyMood[0];
}