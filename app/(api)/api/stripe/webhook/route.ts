import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/services/payments/stripe"
import { db } from "@/lib/db/drizzle"
import { eq } from "drizzle-orm"
import * as Schema from "@/lib/db/schema"
import type { NewUserSubscription } from "@/lib/db/schema"

export async function POST(request: NextRequest) {
    console.log('=== Stripe Webhook Received ===')
    try {
        const body = await request.text()
        const signature = request.headers.get('stripe-signature')

        console.log('Body length:', body.length)
        console.log('Signature present:', !!signature)

        if (!signature) {
            console.error('Missing Stripe signature')
            return NextResponse.json(
                { error: "Missing Stripe signature" },
                { status: 400 }
            )
        }

        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
        if (!webhookSecret) {
            console.error('Missing Stripe webhook secret')
            return NextResponse.json(
                { error: "Missing webhook secret" },
                { status: 500 }
            )
        }

        let event

        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
            console.log('Successfully constructed webhook event:', event.type)
        } catch (err) {
            console.error('Webhook signature verification failed:', err)
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 400 }
            )
        }

        // Handle the event
        console.log('Processing event type:', event.type)
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object)
                break
            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object)
                break
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object)
                break
            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object)
                break
            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        console.log('=== Webhook Processing Complete ===')
        return NextResponse.json({ received: true })

    } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json(
            { error: "Webhook handler failed" },
            { status: 500 }
        )
    }
}

async function handleCheckoutSessionCompleted(session: any) {
    try {
        
        const userId = session.metadata?.userId
        if (!userId) {
            console.error('No userId in checkout session metadata:', session.metadata)
            return
        }

        // Check if there's a subscription (for subscription payments)
        if (!session.subscription) {
            console.log('No subscription in checkout session - this might be a one-time payment')
            return
        }

        // Get the subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription)
        
        // Update user's stripe_customer_id if not set
        await db
            .update(Schema.user)
            .set({ stripe_customer_id: session.customer })
            .where(eq(Schema.user.id, userId))
            .returning({ id: Schema.user.id })

        // Create or update subscription record
        await upsertSubscription(userId, subscription)

    } catch (error) {
        // Re-throw to ensure webhook returns error status
        throw error
    }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
    try {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
        const userId = subscription.metadata?.userId
        
        if (!userId) {
            console.error('No userId in subscription metadata')
            return
        }

        await upsertSubscription(userId, subscription)
    } catch (error) {
        console.error('Error handling invoice payment succeeded:', error)
    }
}

async function handleSubscriptionUpdated(subscription: any) {
    try {
        const userId = subscription.metadata?.userId
        if (!userId) {
            console.error('No userId in subscription metadata')
            return
        }

        await upsertSubscription(userId, subscription)
    } catch (error) {
        console.error('Error handling subscription updated:', error)
    }
}

async function handleSubscriptionDeleted(subscription: any) {
    try {
        // Mark subscription as cancelled in database
        await db
            .update(Schema.userSubscription)
            .set({ 
                status: 'canceled',
                canceled_at: new Date(),
                updated_at: new Date()
            })
            .where(eq(Schema.userSubscription.stripe_subscription_id, subscription.id))
    } catch (error) {
        console.error('Error handling subscription deleted:', error)
    }
}

async function upsertSubscription(userId: string, subscription: any) {
    try {
        const subscriptionData: NewUserSubscription = {
            user_id: userId,
            stripe_customer_id: subscription.customer,
            stripe_subscription_id: subscription.id,
            stripe_product_id: subscription.items.data[0].price.product,
            stripe_price_id: subscription.items.data[0].price.id,
            status: subscription.status,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
            cancel_at_period_end: subscription.cancel_at_period_end || false,
            updated_at: new Date()
        }

        // Check if subscription already exists
        const existingSubscription = await db
            .select()
            .from(Schema.userSubscription)
            .where(eq(Schema.userSubscription.stripe_subscription_id, subscription.id))
            .limit(1)

        if (existingSubscription.length > 0) {
            // Update existing subscription
            await db
                .update(Schema.userSubscription)
                .set(subscriptionData)
                .where(eq(Schema.userSubscription.stripe_subscription_id, subscription.id))
                .returning({ id: Schema.userSubscription.id })
        } else {
            // Create new subscription
            await db
                .insert(Schema.userSubscription)
                .values(subscriptionData)
                .returning({ id: Schema.userSubscription.id })
        }
    } catch (error) {
        console.error('Error in upsertSubscription:', error)
        throw error
    }
}
