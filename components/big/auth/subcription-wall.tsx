import Link from "next/link";

export enum SubscriptionLevels {
    "Free" = 0,
    "Basic" = 1,
    "Pro" = 2
}

export function SubscriptionWall(
    {
        minRequiredSubscription,
        userSubscription
    }: {
        minRequiredSubscription: keyof typeof SubscriptionLevels,
        userSubscription: keyof typeof SubscriptionLevels
    }
) {
    if (SubscriptionLevels[minRequiredSubscription] <= SubscriptionLevels[userSubscription]) return null;

    return (
        <div className={"fixed z-40 bg-white/50 h-screen w-screen flex flex-col items-center justify-center gap-4"}>
            <h1 className={"text-3xl font-bold"}>
                Whoops... It looks like you&#39;re took the wrong here.
            </h1>
            <p>
                This feature is only available to users with a <span
                className={"font-bold"}>{Object.keys(SubscriptionLevels)
                .filter(level =>
                    SubscriptionLevels[level as keyof typeof SubscriptionLevels] >=
                    SubscriptionLevels[minRequiredSubscription]
                )
                .map((level, index, array) =>
                        index === array.length - 1
                            ? `or ${level}`
                            : `${level}${index < array.length - 1 ? ', ' : ''}`
                    )
                    .join(' ')}</span> subscription, and you
                currently are on a <span className={"font-bold"}>{userSubscription.toString()}</span> subscription.
            </p>
            <p>
                You can always upgrade your subscription <Link className={"underline"} href={"/my/settings/subscription"}>here</Link>.
            </p>
        </div>
    )
}