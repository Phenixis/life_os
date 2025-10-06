import Link from "next/link";

type SubscriptionLevels = "free" | "basic" | "pro"

export function SubscriptionWall(
    {
        requiredSubscription,
        userSubscription
    }: {
        requiredSubscription: SubscriptionLevels,
        userSubscription: SubscriptionLevels
    }
) {
    return (
        <div className={"fixed z-40 bg-white/50 h-screen w-screen flex flex-col items-center justify-center gap-4"}>
            <h1 className={"text-3xl font-bold"}>
                Whoops... It looks like you&#39;re on the wrong path here.
            </h1>
            <p>
                This page is only available to users with a <span className={"font-bold"}>{requiredSubscription}</span> subscription, and you currently are on a <span className={"font-bold"}>{userSubscription}</span> subscription.
            </p>
            <p>
                You can always upgrade your subscription <Link className={"underline"} href={"/settings/subscription"}>here</Link>.
            </p>
        </div>
    )
}