import { NextRequest, NextResponse } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { stripe } from "@/lib/services/payments/stripe"
import { db } from "@/lib/db/drizzle"
import { eq, and } from "drizzle-orm"
import * as Schema from "@/lib/db/schema"

export async function POST(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        // Get user's active subscription
        const activeSubscription = await db
            .select()
            .from(Schema.User.Subscription.table)
            .where(
                and(
                    eq(Schema.User.Subscription.table.user_id, userId),
                    eq(Schema.User.Subscription.table.status, 'active')
                )
            )
            .limit(1)

        if (activeSubscription.length === 0) {
            return NextResponse.json(
                { error: "No active subscription found" },
                { status: 404 }
            )
        }

        const subscription = activeSubscription[0]

        // Cancel subscription at period end
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            cancel_at_period_end: true
        })

        // Update database
        await db
            .update(Schema.User.Subscription.table)
            .set({
                cancel_at_period_end: true,
                updated_at: new Date()
            })
            .where(eq(Schema.User.Subscription.table.stripe_subscription_id, subscription.stripe_subscription_id))

        return NextResponse.json({
            message: "Subscription will be cancelled at the end of the current period"
        })

    } catch (error) {
        console.error('Error cancelling subscription:', error)
        return NextResponse.json(
            { error: "Failed to cancel subscription" },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        // Get user's active subscription
        const activeSubscription = await db
            .select()
            .from(Schema.User.Subscription.table)
            .where(
                and(
                    eq(Schema.User.Subscription.table.user_id, userId),
                    eq(Schema.User.Subscription.table.status, 'active')
                )
            )
            .limit(1)

        if (activeSubscription.length === 0) {
            return NextResponse.json(
                { error: "No active subscription found" },
                { status: 404 }
            )
        }

        const subscription = activeSubscription[0]

        // Immediately cancel subscription
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id)

        // Update database
        await db
            .update(Schema.User.Subscription.table)
            .set({
                status: 'canceled',
                canceled_at: new Date(),
                updated_at: new Date()
            })
            .where(eq(Schema.User.Subscription.table.stripe_subscription_id, subscription.stripe_subscription_id))

        return NextResponse.json({
            message: "Subscription cancelled immediately"
        })

    } catch (error) {
        console.error('Error cancelling subscription immediately:', error)
        return NextResponse.json(
            { error: "Failed to cancel subscription" },
            { status: 500 }
        )
    }
}
