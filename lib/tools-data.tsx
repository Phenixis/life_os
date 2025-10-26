import {Car, Dumbbell, Film, Grid2X2, LayoutGrid, MessagesSquare, ShoppingBag} from "lucide-react"
import type {ReactNode} from "react"

export interface ToolsCategorieProps {
    name: string
    description: string
    tools: ToolCardProps[]
}

export function isToolsCategorie(data: ToolCardProps | ToolsCategorieProps): data is ToolsCategorieProps {
    return "tools" in data
}

export interface ToolCardProps {
    name: string
    description: string
    icon: ReactNode
    href: string
    available: boolean
    alternativeNames?: string[]
}

export function isToolCard(data: ToolCardProps | ToolsCategorieProps): data is ToolCardProps {
    return "href" in data;
}

// Move the tools data to a separate file that can be imported by both client and server components
export const tools: (ToolCardProps | ToolsCategorieProps)[] = [
    {
        name: "All Tools",
        href: "/my/tools",
        icon: <LayoutGrid className="size-4"/>,
        description: "View all available tools",
        available: true,
        alternativeNames: ["tools"],
    },
    {
        name: "Trackers",
        description: "A set of tools to track what happens in your life.",
        tools: [
            {
                name: "Movie Tracker",
                href: "/my/tools/movie-tracker",
                icon: <Film className="size-4"/>,
                description: "Track movies and TV shows you've watched and get personalized recommendations.",
                available: true,
                alternativeNames: ["movie", "movies", "film", "films"],
            },
            {
                name: "Workout Tracker",
                href: "/my/tools/workout",
                icon: <Dumbbell className="size-4"/>,
                description: "Track your workout, analyze the stats and improve to your best self",
                available: true,
                alternativeNames: ["workout", "exercise", "gym"],
            },
        ]
    },
    {
        name: "Decision-making tools",
        description: "A set of tools to help you make big decisions easily.",
        tools: [
            {
                name: "Weighted Multi-Criteria Decision Matrix",
                href: "/my/tools/WMCDM",
                icon: <Grid2X2 className="size-4"/>,
                description: "Evaluate multiple options against multiple criteria, with each criterion having a different level of importance. Fill the table and get the mathematically best option",
                available: true,
                alternativeNames: ["WMCDM", "decision matrix"],
            }
        ]
    },
    {
        name: "AI tools",
        description: "A set of useful AI tools",
        tools: [
            {
                name: "Chat",
                href: "/my/tools/chat",
                icon: <MessagesSquare className="size-4"/>,
                description: "Chat with AI profiles you set yourself, and get personalized advice and support.",
                available: true,
                alternativeNames: ["ai chat", "chatbot"],
            }
        ]
    },{
        name: "Coming soon",
        description: "I'm currently working on these tools, they will be available in the next update !",
        tools: [
            {
                name: "Grocery List Maker",
                href: "/my/tools/grocery-list",
                icon: <ShoppingBag className="size-4"/>,
                description: "Create and manage grocery lists with ease.",
                available: false,
                alternativeNames: ["grocery", "shopping list"],
            },
            {
                name: "Car Management",
                href: "/my/tools/car-management",
                icon: <Car className="size-4"/>,
                description: "Manage your car's gas consumption, MOT expiration date, and other car-related information.",
                available: false,
                alternativeNames: ["car", "inventory", "usage"],
            }
        ]
    }
    // Future tools can be added here following the same structure
].filter(Boolean) as (ToolCardProps | ToolsCategorieProps)[];