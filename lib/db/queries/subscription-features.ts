import * as lib from "./lib"

/**
 * Get user's active subscription (there should only be one)
 */
export async function getUserActiveSubscription(userId: string) {
    const activeSubscriptions = await lib.db
        .select()
        .from(lib.Schema.User.Subscription.table)
        .where(
            lib.and(
                lib.eq(lib.Schema.User.Subscription.table.user_id, userId),
                lib.eq(lib.Schema.User.Subscription.table.status, 'active')
            )
        )
        .limit(1);

    return activeSubscriptions.length > 0 ? activeSubscriptions[0] : null;
}

/**
 * Get all free features
 */
export async function getAllFreeFeatures(activeOnly = true) {
    let freeFeatures = await lib.db
        .select()
        .from(lib.Schema.Feature.table)
        .where(lib.eq(lib.Schema.Feature.table.is_paid, false));

    if (activeOnly) {
        freeFeatures = freeFeatures.filter(f => f.is_active);
    }

    return freeFeatures;
}

/**
 * Get all features available to a user based on their active subscription
 */
export async function getUserAvailableFeatures(userId: string, activeOnly = true) {
    const activeSubscription = await getUserActiveSubscription(userId);

    let stripeProductId = null;
    let userFeatures = await getAllFreeFeatures(activeOnly);

    if (activeSubscription) {
        stripeProductId = activeSubscription.stripe_product_id;

        let planFeatures = (await lib.db
            .select()
            .from(lib.Schema.Feature.table)
            .innerJoin(lib.Schema.PlanFeature.table, lib.eq(lib.Schema.Feature.table.id, lib.Schema.PlanFeature.table.feature_id))
            .where(
                lib.eq(lib.Schema.PlanFeature.table.stripe_product_id, stripeProductId)
            )).map(f => f.feature);

        if (activeOnly) {
            planFeatures = planFeatures.filter(f => f.is_active);
        }

        userFeatures = [...userFeatures, ...planFeatures];
    }

    return userFeatures;
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeatureAccess(
    userId: string,
    featureName: string
): Promise<boolean> {
    const userFeatures = await getUserAvailableFeatures(userId);
    return userFeatures.some(feature => feature.name === featureName);
}

/**
 * Get user's current plan information
 */
export async function getUserCurrentPlan(userId: string) {
    const activeSubscription = await getUserActiveSubscription(userId);

    if (!activeSubscription) {
        return {
            plan_name: 'free',
            stripe_product_id: null,
            subscription: null
        };
    }

    return {
        plan_name: (await lib.StripeService.getStripeProduct(activeSubscription.stripe_product_id)).name,
        stripe_product_id: activeSubscription.stripe_product_id,
        subscription: activeSubscription
    };
}

export async function createSubscription(
    userId: string,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    stripeProductId: string,
    stripePriceId: string,
    status: string,
    canceledAt: Date | null,
    cancelAtPeriodEnd: boolean
) {
    const newSubscription = {
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,
        status,
        canceled_at: canceledAt,
        cancel_at_period_end: cancelAtPeriodEnd
    };

    await lib.db.insert(lib.Schema.User.Subscription.table).values(newSubscription);
}

/**
 * Update user's subscription information by marking the old one as deleted and creating a new one with the updated information
 */
export async function updateSubscription(
    user_id: string,
    stripe_customer_id: string | null,
    stripe_subscription_id: string | null,
    stripe_product_id: string | null,
    stripe_price_id: string | null,
    status: string,
    canceled_at: Date | null,
    cancel_at_period_end: boolean
) {
    const activeSubscription = await getUserActiveSubscription(user_id);

    if (activeSubscription) {
        // Mark old subscription as deleted
        await lib.db
            .update(lib.Schema.User.Subscription.table)
            .set({
                canceled_at: new Date(),
                status: status
            })
            .where(lib.eq(lib.Schema.User.Subscription.table.id, activeSubscription.id));
    }

    if (stripe_customer_id && stripe_subscription_id && stripe_product_id && stripe_price_id) {
        // Create new subscription
        await createSubscription(
            user_id,
            stripe_customer_id,
            stripe_subscription_id,
            stripe_product_id,
            stripe_price_id,
            status,
            canceled_at,
            cancel_at_period_end
        );
    }
}