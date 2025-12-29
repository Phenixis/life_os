'use client'

import React, { useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import PricingCard from '@/components/big/pricing/pricing_card'
import { basic, free, pro } from "@/app/(back-office)/my/settings/subscription/plans"

export function PricingSection() {
    const [isYearly, setIsYearly] = useState<boolean>(false)

    return (
        <section id="pricing" className="px-6 py-16">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-2xl md:text-3xl font-medium tracking-wide mb-6 font-heading">
                    Choose your operating system
                </h2>
                <p className="text-base text-gray-600 dark:text-gray-400 mb-12">
                    Start free, upgrade when you&apos;re ready to unlock your full potential
                </p>

                <div className="flex justify-center items-center gap-4 mb-12">
                    <span
                        onClick={() => setIsYearly(false)}
                        className={`${!isYearly && "font-bold"} text-sm text-gray-600 dark:text-gray-400 cursor-pointer`}
                    >
                        Monthly
                    </span>
                    <Switch checked={isYearly} onCheckedChange={setIsYearly} className="cursor-pointer" />
                    <span
                        onClick={() => setIsYearly(true)}
                        className={`${isYearly && "font-bold"} text-sm text-gray-600 dark:text-gray-400 cursor-pointer`}
                    >
                        Yearly
                        <Badge className="ml-1 bg-blue-500 hover:bg-blue-600">20% Off</Badge>
                    </span>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    <PricingCard
                        plan={free}
                        recurrency={isYearly ? 'yearly' : 'monthly'}
                    />

                    <PricingCard
                        plan={basic}
                        isPopular={true}
                        recurrency={isYearly ? 'yearly' : 'monthly'}
                    />

                    <PricingCard
                        plan={pro}
                        recurrency={isYearly ? 'yearly' : 'monthly'}
                        active={false}
                    />
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-500 mt-8">
                    No credit card required for Free plan. Cancel paid plans anytime, cancellation at period end.
                </p>
            </div>
        </section>
    )
}
