"use server"

import * as lib from "../lib"

const table = lib.Schema.User.Subscription.table
export type New = lib.Schema.User.Subscription.Insert
export type Existing = lib.Schema.User.Subscription.Select

// CREATE
export async function Create(values: New): Promise<Existing> {
    const inserted = await lib.db
        .insert(table)
        .values(values)
        .returning()
    return inserted[0]
}

// READ
export async function GetById(id: number): Promise<Existing | null> {
    const rows = await lib.db
        .select()
        .from(table)
        .where(lib.eq(table.id, id))
        .limit(1)
    return rows.length > 0 ? rows[0] : null
}

export async function GetByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Existing | null> {
    const rows = await lib.db
        .select()
        .from(table)
        .where(lib.eq(table.stripe_subscription_id, stripeSubscriptionId))
        .limit(1)
    return rows.length > 0 ? rows[0] : null
}

export async function GetByUserId(userId: string, limit: number = 50): Promise<Existing[]> {
    return lib.db
        .select()
        .from(table)
        .where(lib.eq(table.user_id, userId))
        .limit(limit)
}

export async function GetLatestByUserId(userId: string): Promise<Existing | null> {
    const rows = await lib.db
        .select()
        .from(table)
        .where(lib.eq(table.user_id, userId))
        .orderBy(lib.desc(table.created_at))
        .limit(1)
    return rows.length > 0 ? rows[0] : null
}

export async function GetActive(userId: string): Promise<Existing | null> {
    const rows = await lib.db
        .select()
        .from(table)
        .where(lib.and(
            lib.eq(table.user_id, userId),
            lib.eq(table.status, 'active')
        ))
        .limit(1)
    return rows.length > 0 ? rows[0] : null
}

export async function HasAnActive(userId: string): Promise<boolean> {
    const sub = await GetActive(userId)
    return !!sub
}

// UPDATE
export async function Update(id: number, values: Partial<New>): Promise<Existing | null> {
    const rows = await lib.db
        .update(table)
        .set({
            ...values,
            updated_at: new Date(),
        })
        .where(lib.eq(table.id, id))
        .returning()
    return rows.length > 0 ? rows[0] : null
}

// DELETE
export async function Delete(id: number): Promise<void> {
    // Hard delete since there is no deleted_at column on this table
    await lib.db
        .delete(table)
        .where(lib.eq(table.id, id))
}

