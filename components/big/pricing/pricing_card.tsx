import {Badge} from "@/components/ui/badge"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Check, X} from "lucide-react"
import Tooltip from "../tooltip"
import {formatPrice} from "@/lib/utils/payment"
import {SubmitButton} from "./submit_button"
import {checkoutAction} from '@/lib/services/payments/actions';
import {getEveryFeatures, getFeature, Plan} from "@/app/(back-office)/my/settings/subscription/plans";
import {Button} from '@/components/ui/button';
import {SubscriptionActionButton} from './subscription_action_button';

export default function PricingCard(
    {
        plan,
        isPopular = false,
        recurrency = "monthly",
        active = true,
        currentSubscription = false,
        hasActiveSubscription = false,
    }: {
        plan: Plan,
        isPopular?: boolean,
        recurrency?: "monthly" | "yearly",
        active?: boolean,
        currentSubscription?: boolean,
        hasActiveSubscription?: boolean
    }
) {

    return (
        <div>
            <div
                className={`relative hover:z-10 ${!active && "grayscale pointer-events-none"}`}
            >
                <Card
                    className={`${currentSubscription ? "relative border-green-500 dark:border-green-400" : !active ? "border-purple-500 dark:border-purple-400" : isPopular ? "relative border-blue-500 dark:border-blue-400" : "border-gray-200 dark:border-gray-800"} flex flex-col h-[650px]`}>
                    {
                        (isPopular || currentSubscription || !active) && (
                            <div
                                className="absolute -top-3 left-1/2 transform -translate-x-1/2"
                            >
                                <Badge
                                    className={currentSubscription ? "bg-green-500 lg:hover:bg-green-600" : !active ? "bg-purple-500 text-white" : "bg-blue-500 lg:hover:bg-blue-600 text-white"}>
                                    {
                                        currentSubscription ? "Your Subscription" : !active ? "Coming soon" : "Most Popular"
                                    }
                                </Badge>
                            </div>
                        )
                    }
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-2xl font-heading">
                            {plan.display_name || "Free"}
                        </CardTitle>
                        <div className="mt-4">
                            <span
                                className="text-4xl font-bold"
                            >
                                {plan.price
                                    ? plan.price[recurrency].amount === -1 ? "xx,xx " + plan.price[recurrency].currency
                                        : formatPrice(plan.price[recurrency].amount, plan.price[recurrency].currency)
                                    : "0€"
                                }
                            </span>
                            <span
                                className="text-gray-600 dark:text-gray-400">/{plan.price ? (recurrency === "monthly" ? "month" : "year") : "forever"}</span>
                        </div>
                        <CardDescription className="mt-2">
                            {plan.description || "Perfect for getting started with organization"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 flex flex-col">
                        <div className="space-y-3 flex-1">
                            {plan.features.enabled.map((feature, index) => (
                                <Tooltip key={index} tooltip={getFeature(feature).description || ""} className="w-full">
                                    <div
                                        className="flex items-center space-x-3 text-left"
                                    >
                                        <Check className="h-5 w-5 text-green-500"/>
                                        <span>{getFeature(feature).display_name}</span>
                                    </div>
                                </Tooltip>
                            ))}
                            {(getEveryFeatures().filter((feature) => !plan.features.enabled.includes(feature.name))).map((feature, index) => (
                                <Tooltip key={index} tooltip={feature.description || ""} className="w-full">
                                    <div
                                        key={index}
                                        className="flex items-center space-x-3 text-left"
                                    >
                                        <X className="h-5 w-5 text-red-500 flex-shrink-0"/>
                                        <span>{feature.display_name}</span>
                                    </div>
                                </Tooltip>
                            ))}
                        </div>
                        <div
                        >
                            <div
                            >
                                {
                                    currentSubscription ? (
                                        <Button variant="outline" className="w-full" disabled>
                                            Current Plan
                                        </Button>
                                    ) : hasActiveSubscription ? (
                                        <SubscriptionActionButton
                                            priceId={plan.price ? plan.price[recurrency].priceId : ""}
                                            planName={plan.display_name}
                                            isFree={plan.price === undefined}
                                        />
                                    ) : (
                                        <form action={checkoutAction}>
                                            <input type="hidden" name="priceId"
                                                   value={plan.price ? plan.price[recurrency].priceId : ""}/>
                                            <SubmitButton
                                                isPopular={isPopular}
                                                isFree={plan.price === undefined}
                                                isActive={active}
                                            />
                                        </form>
                                    )
                                }
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}