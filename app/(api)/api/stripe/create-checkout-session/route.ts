import { NextRequest, NextResponse } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { stripe } from "@/lib/services/payments/stripe"
import { getUser, updateUserStripeCustomerId } from "@/lib/db/queries/user/user"

export async function POST(request: NextRequest) {
    try {
        const { error, userId } = await verifyRequest(request)
        if (error) return error

        const body = await request.json()
        const { priceId, successUrl, cancelUrl } = body

        // Validate required fields
        if (!priceId) {
            return NextResponse.json(
                { error: "Missing required field: priceId" },
                { status: 400 }
            )
        }

        // Get user information
        const user = await getUser(userId)
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        // Create or get Stripe customer
        let customerId = user.stripe_customer_id
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: `${user.first_name} ${user.last_name}`,
                metadata: {
                    userId: user.id
                }
            })
            customerId = customer.id

            // Update user with stripe customer ID
            await updateUserStripeCustomerId(userId, customerId)
        }

        // Set default URLs if not provided
        const defaultSuccessUrl = `${process.env.NEXT_PUBLIC_APP_URL}/my?payment=success`
        const defaultCancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/my?payment=cancelled`

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: successUrl || defaultSuccessUrl,
            cancel_url: cancelUrl || defaultCancelUrl,
            metadata: {
                userId: user.id
            },
            subscription_data: {
                metadata: {
                    userId: user.id
                }
            }
        })

        return NextResponse.json({ 
            sessionId: session.id,
            url: session.url
        })

    } catch (error) {
        console.error('Error creating checkout session:', error)
        return NextResponse.json(
            { error: "Failed to create checkout session" },
            { status: 500 }
        )
    }
}
