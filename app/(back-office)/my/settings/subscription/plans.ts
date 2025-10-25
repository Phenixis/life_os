export type Feature = {
    name: string,
    display_name: string,
    description: string | null,
}

const features: Record<string, Feature> = {
    "tasks": {
        name: "tasks",
        display_name: "Tasks Manager",
        description: "A tasks manager where you can create, edit and complete tasks connected to projects.",
    },
    "notes": {
        name: "notes",
        display_name: "Notes Manager",
        description: "A notes manager where you can create, edit and complete notes connected to projects.",
    },
    "mood_tracker": {
        name: "mood_tracker",
        display_name: "Mood Tracker",
        description: "Enter your mood day-after-day, note what made you happy, sad or angry and find patterns in your life."
    },
    "movie_tracker": {
        name: "movie_tracker",
        display_name:
            "Movie Tracker",
        description:
            "A tool to track the movie & tv shows you watched, the ones you want to watch and get recommendations based on your favourite movies and tv shows",
    },
    "workout_tracker": {
        name: "workout_tracker",
        display_name:
            "Workout Tracker",
        description:
            "A tool to track your workouts, track your progress and get motivated to achieve your goals.",
    },
    "ai_profiles": {
        name: "ai_profiles",
        display_name:
            "AI profiles",
        description:
            "Chat with AI profiles you set yourself, and get personalized advice and support.",
    },
    "wmcdm": {
        name: 'wmcdm',
        display_name: "Weighted Multi-Criteria Decision Matrix",
        description: "A decision-making tool that helps evaluate multiple options against various criteria, with each criterion having a different level of importance (weight)."
    },
    "weekly_and_monthly_virtual_meetups": {
        name: "weekly_and_monthly_virtual_meetups",
        display_name:
            "Weekly And Monthly Virtual Meetups",
        description:
            "Meet the all the community members in a virtual meetup, find accountability buddy and get motivated to achieve your goals.",
    },
    "early_access": {
        name: "early_access",
        display_name:
            "Early Access",
        description:
            "Get early access to features and tools while they are being developed, give your feedback and shape the roadmap",
    },
    "physical_meetup": {
        name: "physical_meetup",
        display_name:
            "Yearly Physical Meetup",
        description:
            "Meet all the community members in a physical meetup, once a year."
    },
    "priority_support" : {
        name: "priority_support",
        display_name:
            "Priority Support",
        description:
            "Get priority support when needed and never stay stuck in a situation again.",
    },
    "exclusive_community": {
        name: "exclusive_community",
        display_name: "Exclusive Community",
        description: "Get exclusive access to a community of high achiever and motivated people.",
    }
}

export type Price = {
    amount: number,
    priceId: string,
    currency: string
}

export type Plan = {
    name: string,
    display_name: string,
    description: string | null,
    features: {
        enabled: (keyof typeof features)[],
        disabled?: (keyof typeof features)[]
    },
    stripe_product_id?: string,
    price?: {
        monthly: Price,
        yearly: Price
    },
    isPopular?: boolean
}


export function getFeature(name: keyof typeof features): Feature {
    return features[name]
}

export function getFeaturesFromPlan(plan: Plan): {
    enabled: (keyof typeof features)[],
    disabled?: (keyof typeof features)[]
} {
    return {
        enabled: plan.features.enabled,
        disabled: plan.features.disabled
    }
}

export function getEveryFeatures() {
    return Object.values(features)
}

export const free: Plan = {
    name: "free",
    display_name: "Free",
    description: "Perfect for getting started wth organization.",
    stripe_product_id: "free",
    features: {
        enabled: [
            "tasks",
            "notes",
            "mood_tracker"
        ]
    }
}

export const basic: Plan = {
    name: "basic",
    display_name: "Basic",
    description: "Everything you need + all advanced tools",
    price: {
        monthly: {
            amount: 2000,
            priceId: "price_1SMAYEE9V9u2VaxP2sQiUiIK",
            currency: "eur"
        },
        yearly: {
            amount: 20000,
            priceId: "price_1SMAYEE9V9u2VaxPazh9PYKm",
            currency: "eur"
        }
    },
    stripe_product_id: "prod_TIm6pw2j9FLwxu",
    features: {
        enabled: [
            ...(getFeaturesFromPlan(free).enabled),
            "movie_tracker",
            "workout_tracker",
            "ai_profiles",
            "wmcdm"
        ]
    },
    isPopular: true
}

export const pro: Plan = {
    name: "pro",
    display_name: "Pro",
    description: "Exclusive community for serious achievers",
    features: {
        enabled: [
            ...(Object.keys(features)),
        ]
    },
    price: {
        monthly: {
            amount: -1,
            priceId: "unknown",
            currency: "€"
        },
        yearly: {
            amount: -1,
            priceId: "unknown",
            currency: "€"
        }
    }
}
