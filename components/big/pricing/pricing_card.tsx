import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X } from "lucide-react"
import Tooltip from "../tooltip"
import { formatPrice } from "@/lib/utils/payment"
import { SubmitButton } from "./submit_button"
import { checkoutAction } from '@/lib/services/payments/actions';

export default function PricingCard({
    plan,
    isPopular = false,
    recurrency = "monthly",
    active = true
}: {
    plan: {
        stripe_product_id?: number,
        name?: string,
        display_name?: string,
        description?: string | null,
        price?: {
            monthly: {
                amount: number,
                priceId: string,
                currency: string
            },
            yearly: {
                amount: number,
                priceId: string,
                currency: string
            }
        },
        features: {
            enabled: {
                id: number,
                name: string,
                display_name: string,
                description: string | null,
            }[],
            disabled?: {
                id: number,
                name: string,
                display_name: string,
                description: string | null,
            }[]
        }
    },
    isPopular?: boolean,
    recurrency?: "monthly" | "yearly",
    active?: boolean
}) {

    return (
        <div>
            <div
                className={`relative hover:z-10 ${!active && "grayscale pointer-events-none"}`}
            >
                <Card className={`${isPopular ? "relative border-blue-500 dark:border-blue-400" : "border-gray-200 dark:border-gray-800"} flex flex-col h-[650px]`}>
                    {
                        isPopular && (
                            <div
                                className="absolute -top-3 left-1/2 transform -translate-x-1/2"
                            >
                                <Badge className="bg-blue-500 lg:hover:bg-blue-600 text-white">
                                    Most Popular
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
                                    ? formatPrice(plan.price[recurrency].amount, plan.price[recurrency].currency)
                                    : "0€"
                                }
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">/{plan.price ? (recurrency === "monthly" ? "month" : "year") : "forever"}</span>
                        </div>
                        <CardDescription className="mt-2">
                            {plan.description || "Perfect for getting started with organization"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 flex flex-col">
                        <div className="space-y-3 flex-1">
                            {plan.features.enabled.map((feature, index) => (
                                <Tooltip key={index} tooltip={feature.description || ""} className="w-full">
                                    <div
                                        className="flex items-center space-x-3 text-left"
                                    >
                                        <Check className="h-5 w-5 text-green-500" />
                                        <span>{feature.display_name}</span>
                                    </div>
                                </Tooltip>
                            ))}
                            {plan.features.disabled && plan.features.disabled.map((feature, index) => (
                                <Tooltip key={index} tooltip={feature.description || ""} className="w-full">
                                    <div
                                        key={index}
                                        className="flex items-center space-x-3 text-left"
                                    >
                                        <X className="h-5 w-5 text-red-500" />
                                        <span>{feature.display_name}</span>
                                    </div>
                                </Tooltip>
                            ))}
                        </div>
                        <div
                        >
                            <div
                            >
                                <form action={checkoutAction}>
                                    <input type="hidden" name="priceId" value={plan.price ? plan.price[recurrency].priceId : ""} />
                                    <SubmitButton isPopular={isPopular} isFree={plan.price === undefined} />
                                </form>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}