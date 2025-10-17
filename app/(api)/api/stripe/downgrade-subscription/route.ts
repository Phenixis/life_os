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

        const body = await request.json()
        const { priceId } = body

        // Validate required fields
        if (!priceId) {
            return NextResponse.json(
                { error: "Missing required field: priceId" },
                { status: 400 }
            )
        }

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

        // Update the subscription to the new price
        const updatedSubscription = await stripe.subscriptions.update(
            subscription.stripe_subscription_id,
            {
                items: [
                    {
                        id: (await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)).items.data[0].id,
                        price: priceId,
                    },
                ],
                proration_behavior: 'create_prorations',
            }
        )

        // Update database
        await db
            .update(Schema.User.Subscription.table)
            .set({
                stripe_product_id: updatedSubscription.items.data[0].price.product as string,
                stripe_price_id: updatedSubscription.items.data[0].price.id,
                updated_at: new Date()
            })
            .where(eq(Schema.User.Subscription.table.stripe_subscription_id, subscription.stripe_subscription_id))

        return NextResponse.json({
            message: "Subscription downgraded successfully",
            subscription: updatedSubscription
        })

    } catch (error) {
        console.error('Error downgrading subscription:', error)
        return NextResponse.json(
            { error: "Failed to downgrade subscription" },
            { status: 500 }
        )
    }
}
