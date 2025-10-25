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
      display_name: "Notes",
      description: "A notes manager where you can create, edit and complete notes connected to projects.",
    },
    "movie_tracker": {
        name: "movie_tracker",
        display_name:
            "Movie Tracker",
        description:
            "A tool to track the movie & tv shows you watched, the ones you want to watch and get recommendations based on your favourite movies and tv shows",
    },
    "weekly_and_monthly_virtual_meetups": {
        name: "weekly_and_monthly_virtual_meetups",
        display_name:
            "Weekly And Monthly Virtual Meetups",
        description:
            "Meet the all the community members in a virtual meetup, find accountability buddy and get motivated to achieve your goals.",
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
            "notes"
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
            priceId: "price_1RixYOEEBVavDyUcTY40nPGx",
            currency: "eur"
        },
        yearly: {
            amount: 16000,
            priceId: "price_1RixZ0EEBVavDyUcfcll7er5",
            currency: "eur"
        }
    },
    stripe_product_id: "prod_SeG4Y7jaQ1iVtF",
    features: {
        enabled: [
            ...(getFeaturesFromPlan(free).enabled),
            "movie_tracker"
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