import PricingCard from '@/components/big/pricing/pricing_card'
import Link from "next/link";

interface ProfileSettingsPageProps {
    searchParams?: { [key: string]: string | string[] | undefined }
}

/**
 * Subscription Settings page.
 * Reads 'isYearly' from URL search params and sets pricing accordingly.
 */
export default async function ProfileSettingsPage({ searchParams }: ProfileSettingsPageProps) {
    // Validate and parse isYearly from searchParams
    const isYearlyParam = (await searchParams)?.isYearly
    const isYearly = typeof isYearlyParam === 'string'
        ? isYearlyParam === 'true'
        : false

    return (
        <section className="page">
            <h1 className="page-title">Subscription Settings</h1>
            <p className="page-description">
                Manage your subscription details and preferences.
            </p>

            <div className="w-full h-fit flex items-center justify-center">
                <div className="flex justify-center items-center gap-1 mb-12 border rounded-full">
                    <Link className={`block p-3 -mr-1 ${!isYearly ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-black rounded-full" : ""}`} href='?isYearly=false'>
                        Monthly
                    </Link>
                    <Link className={`block p-3 -ml-1 ${isYearly ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-black rounded-full" : ""}`} href='?isYearly=true'>
                        Yearly
                    </Link>
                </div>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <PricingCard plan={{
                    features: {
                        enabled: [{
                            id: 1,
                            name: "tasks",
                            display_name: "Tasks Manager",
                            description: "A tasks manager where you can create, edit and complete tasks connected to projects.",
                        }],
                        disabled: [{
                            id: 5,
                            name: "movie_tracker",
                            display_name: "Movie Tracker",
                            description: "A tool to track the movie & tv shows you watched, the ones you want to watch and get recommendations based on your favourite movies and tv shows",
                        }]
                    }
                }} recurrency={isYearly ? 'yearly' : 'monthly'} />

                {/* Basic Plan */}
                <PricingCard plan={{
                    stripe_product_id: 1,
                    name: "basic",
                    display_name: "Basic",
                    description: "Everything you need + all advanced tools",
                    price: {
                        monthly: {
                            amount: 2000,
                            priceId: "price_1RixYOEEBVavDyUcTY40nPGx",
                            currency: "eur"
                        },
                        yearly: {
                            amount: 16000,
                            priceId: "price_1RixZ0EEBVavDyUcfcll7er5",
                            currency: "eur"
                        }
                    },
                    features: {
                        enabled: [
                            {
                                id: 1,
                                name: "tasks",
                                display_name: "Tasks Manager",
                                description: "A tasks manager where you can create, edit and complete tasks connected to projects.",
                            }, {
                                id: 5,
                                name: "movie_tracker",
                                display_name: "Movie Tracker",
                                description: "A tool to track the movie & tv shows you watched, the ones you want to watch and get recommendations based on your favourite movies and tv shows",
                            }
                        ]
                    }
                }} isPopular recurrency={isYearly ? 'yearly' : 'monthly'} />
            </div>
        </section>
    )
}
