import Stripe from 'stripe';
import { redirect } from 'next/navigation';
import {
    getUser
} from '@/lib/db/queries/user/user';
import { GetActive, Update, Create } from '@/lib/db/queries/user/subscription';
import { User } from '@/lib/db/schema';

const stripeApiKey = process.env.STRIPE_API_KEY;
if (!stripeApiKey) {
    throw new Error('Stripe API key is not set in environment variables');
}

export const stripe = new Stripe(stripeApiKey);

/**
 * Get all Stripe's products
 */
export async function getAllStripeProducts(): Promise<Stripe.Product[]> {
    const products = await stripe.products.list();
    return products.data;
}

/**
 * Get a specific Stripe product by its ID
 */
export async function getStripeProduct(stripeProductId: string): Promise<Stripe.Product> {
    const product = await stripe.products.retrieve(stripeProductId);
    return product;
}

export async function createCheckoutSession({
    priceId,
    userId
}: {
    priceId: string;
    userId?: string;
}) {
    const user = await getUser(userId);

    if (!user) {
        redirect(`/sign-up?redirect=checkout&priceId=${priceId}`);
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price: priceId,
                quantity: 1
            }
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/#pricing`,
        customer: user.stripe_customer_id || undefined,
        customer_email: user?.email || undefined,
        client_reference_id: user.id.toString(),
        allow_promotion_codes: true,
        subscription_data: {
            metadata: {
                userId: user.id
            }
        },
        metadata: {
            userId: user.id
        }
    });

    redirect(session.url!);
}

export async function createCustomerPortalSession(user: User.User.Select) {
    const subscription = await GetActive(user.id);

    if (!subscription || !user.stripe_customer_id) {
        redirect('/pricing');
    }

    let configuration: Stripe.BillingPortal.Configuration;
    const configurations = await stripe.billingPortal.configurations.list();

    if (configurations.data.length > 0) {
        configuration = configurations.data[0];
    } else {
        const product = await stripe.products.retrieve(subscription.stripe_product_id);
        if (!product.active) {
            throw new Error("User's product is not active in Stripe");
        }

        const prices = await stripe.prices.list({
            product: product.id,
            active: true
        });
        if (prices.data.length === 0) {
            throw new Error("No active prices found for the user's product");
        }

        configuration = await stripe.billingPortal.configurations.create({
            business_profile: {
                headline: 'Manage your subscription'
            },
            features: {
                subscription_update: {
                    enabled: true,
                    default_allowed_updates: ['price', 'quantity', 'promotion_code'],
                    proration_behavior: 'create_prorations',
                    products: [
                        {
                            product: product.id,
                            prices: prices.data.map((price) => price.id)
                        }
                    ]
                },
                subscription_cancel: {
                    enabled: true,
                    mode: 'at_period_end',
                    cancellation_reason: {
                        enabled: true,
                        options: [
                            'too_expensive',
                            'missing_features',
                            'switched_service',
                            'unused',
                            'other'
                        ]
                    }
                },
                payment_method_update: {
                    enabled: true
                }
            }
        });
    }

    return stripe.billingPortal.sessions.create({
        customer: user.stripe_customer_id,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/my`,
        configuration: configuration.id
    });
}

export async function handleSubscriptionChange(
    userId: string,
    subscription: Stripe.Subscription
) {
    const customerId = subscription.customer as string;
    const subscriptionId = subscription.id;
    const status = subscription.status;

    const user = await getUser(userId);

    if (!user) {
        console.error('User not found for Stripe customer:', customerId);
        return;
    }

    const subscriptionInDb = await GetActive(user.id);

    // If no active subscription exists, create a new one
    if (subscriptionInDb === null) {
        console.log('Creating new subscription for user:', user.id);
        const plan = subscription.items.data[0]?.plan;
        await Create({
            user_id: user.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_product_id: plan?.product as string,
            stripe_price_id: plan?.id as string,
            status: status,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
            cancel_at_period_end: subscription.cancel_at_period_end || false
        });
        return;
    }

    // Update existing subscription
    if (status === 'active' || status === 'trialing') {
        const plan = subscription.items.data[0]?.plan;
        await Update(subscriptionInDb.id, {
            user_id: user.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_product_id: plan?.product as string,
            stripe_price_id: plan?.id as string,
            status: status,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
            cancel_at_period_end: subscription.cancel_at_period_end || false
        });
    } else if (status === 'canceled' || status === 'unpaid') {
        await Update(subscriptionInDb.id, {
            status: status,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
            cancel_at_period_end: subscription.cancel_at_period_end || false
        });
    }
}

export async function getStripePrices() {
    const prices = await stripe.prices.list({
        expand: ['data.product'],
        active: true,
        type: 'recurring'
    });

    return prices.data.map((price) => ({
        id: price.id,
        productId:
            typeof price.product === 'string' ? price.product : price.product.id,
        unitAmount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval,
        trialPeriodDays: price.recurring?.trial_period_days
    }));
}

export async function getStripeProducts() {
    const products = await stripe.products.list({
        active: true,
        expand: ['data.default_price']
    });

    return products.data.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        defaultPriceId:
            typeof product.default_price === 'string'
                ? product.default_price
                : product.default_price?.id
    }));
}