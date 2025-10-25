import PricingCard from '@/components/big/pricing/pricing_card'
import Link from "next/link";
import {UserQueries} from "@/lib/db/queries"
import {redirect} from "next/navigation";
import {basic, free, pro} from "@/app/(back-office)/my/settings/subscription/plans";

interface ProfileSettingsPageProps {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

/**
 * Subscription Settings page.
 * Reads 'isYearly' from URL search params and sets pricing accordingly.
 */
export default async function ProfileSettingsPage({searchParams}: ProfileSettingsPageProps) {
    // Validate and parse isYearly from searchParams
    const isYearlyParam = (await searchParams)?.isYearly
    const isYearly = typeof isYearlyParam === 'string'
        ? isYearlyParam === 'true'
        : false

    const user = await UserQueries.User.getUser();

    if (!user) {
        redirect('/my')
    }

    const currentSubscription = await UserQueries.Subscription.GetActive(user.id);

    const currentSubscriptionStripeProductId = currentSubscription?.stripe_product_id || "free";
    const hasActiveSubscription = !!currentSubscription;

    return (
        <section className="page">
            <h1 className="page-title">Subscription Settings</h1>
            <p className="page-description">
                Manage your subscription details and preferences.
            </p>

            <div className="w-full h-fit flex items-center justify-center">
                <div className="flex justify-center items-center gap-1 mb-12 border rounded-full">
                    <Link
                        className={`block px-2 py-1 -mr-1 ${!isYearly ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-black rounded-full" : ""}`}
                        href='?isYearly=false'>
                        Monthly
                    </Link>
                    <Link
                        className={`block px-2 py-1 -ml-1 ${isYearly ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-black rounded-full" : ""}`}
                        href='?isYearly=true'>
                        Yearly
                    </Link>
                </div>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <PricingCard
                    plan={free}
                    recurrency={isYearly ? 'yearly' : 'monthly'}
                    currentSubscription={currentSubscriptionStripeProductId === (free.stripe_product_id || "")}
                    hasActiveSubscription={hasActiveSubscription}
                />

                {/* Basic Plan */}
                <PricingCard
                    plan={basic}
                    recurrency={isYearly ? 'yearly' : 'monthly'}
                    currentSubscription={currentSubscriptionStripeProductId === (basic.stripe_product_id || "")}
                    hasActiveSubscription={hasActiveSubscription}
                />

                {/* Pro Plan */}
                <PricingCard
                    plan={pro}
                    recurrency={isYearly ? 'yearly' : 'monthly'}
                    active={false}
                    currentSubscription={currentSubscriptionStripeProductId === (pro.stripe_product_id || "")}
                    hasActiveSubscription={hasActiveSubscription}
                />
            </div>
        </section>
    )
}
