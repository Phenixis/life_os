"use server"

import * as lib from "./lib"

// # Meteo

// ## Create

export async function createMeteo(userId: string, dayOrMeteo: string | lib.Schema.Meteo.Insert, temperature?: number, summary?: string, icon?: string, latitude?: string, longitude?: string) {
    let newMeteo: lib.Schema.Meteo.Insert;

    if (typeof dayOrMeteo === "string") {
        newMeteo = {
            day: dayOrMeteo,
            latitude: latitude!,
            longitude: longitude!,
            temperature: temperature!,
            summary: summary!,
            icon: icon!,
        };
    } else {
        newMeteo = dayOrMeteo;
    }

    newMeteo.latitude = (newMeteo.latitude || "-1").slice(0, 10);
    newMeteo.longitude = (newMeteo.longitude || "-1").slice(0, 10);

    const result = await lib.db
        .insert(lib.Schema.Meteo.table)
        .values({
            ...newMeteo,
            user_id: userId,
        })
        .returning({ day: lib.Schema.Meteo.table.day });

    // Revalidate all pages that might show meteo
    lib.revalidatePath("/my", 'layout');

    return result[0].day;
}

// ## Read

export async function getMeteoByDay(userId: string, day: string) {
    return await lib.db
        .select()
        .from(lib.Schema.Meteo.table)
        .where(lib.and(
            lib.eq(lib.Schema.Meteo.table.day, day),
            lib.eq(lib.Schema.Meteo.table.user_id, userId),
        )) as lib.Schema.Meteo.Select[]
}

export async function getMeteo(userId: string) {
    return await lib.db
        .select()
        .from(lib.Schema.Meteo.table)
        .where(lib.eq(lib.Schema.Meteo.table.user_id, userId)) as lib.Schema.Meteo.Select[]
};

// ## Update

export async function updateMeteo(userId: string, dayOrMeteo: string | lib.Schema.Meteo.Insert, temperature?: number, summary?: string, icon?: string, latitude?: string, longitude?: string) {
    let updatedMeteo: Partial<lib.Schema.Meteo.Insert>;

    if (typeof dayOrMeteo === "string") {
        updatedMeteo = {
            day: dayOrMeteo,
            latitude: latitude!,
            longitude: longitude!,
            temperature: temperature!,
            summary: summary!,
            icon: icon!,
            updated_at: new Date(),
        };
    } else {
        updatedMeteo = {
            ...dayOrMeteo,
            updated_at: new Date(),
        };
    }

    const result = await lib.db
        .update(lib.Schema.Meteo.table)
        .set(updatedMeteo)
        .where(lib.and(
            lib.eq(lib.Schema.Meteo.table.day, typeof dayOrMeteo === "string" ? dayOrMeteo : dayOrMeteo.day),
            lib.eq(lib.Schema.Meteo.table.user_id, userId),
        ))
        .returning({ day: lib.Schema.Meteo.table.day });

    // Revalidate all pages that might show meteo
    lib.revalidatePath("/my", 'layout');

    if (!result) {
        return null;
    }

    return result[0].day;
}

// ## Delete

export async function deleteMeteoByDay(userId: string, day: string) {
    const result = await lib.db.update(lib.Schema.Meteo.table)
        .set({ deleted_at: lib.sql`CURRENT_TIMESTAMP` })
        .where(lib.and(
            lib.eq(lib.Schema.Meteo.table.day, day),
            lib.eq(lib.Schema.Meteo.table.user_id, userId),
        ))
        .returning({ day: lib.Schema.Meteo.table.day })

    // Revalidate all pages that might show meteo
    lib.revalidatePath("/my", 'layout')

    if (result && result.length > 0) {
        return result[0].day
    }

    return null
}