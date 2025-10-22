import {Dumbbell, Film, Grid2X2, LayoutGrid, MessagesSquare} from "lucide-react"
import type {ReactNode} from "react"

export interface ToolCardProps {
    name: string
    description: string
    icon: ReactNode
    href: string
    alternativeNames?: string[]
}

// Move the tools data to a separate file that can be imported by both client and server components
export const tools: ToolCardProps[] = [
    {
        name: "All Tools",
        href: "/my/tools",
        icon: <LayoutGrid className="size-4"/>,
        description: "View all available tools",
        alternativeNames: ["tools"],
    },
    {
        name: "Weighted Multi-Criteria Decision Matrix",
        href: "/my/tools/WMCDM",
        icon: <Grid2X2 className="size-4"/>,
        description: "A decision-making tool that helps evaluate multiple options against various criteria, with each criterion having a different level of importance (weight).",
        alternativeNames: ["WMCDM", "decision matrix"],
    },
    {
        name: "Movie Tracker",
        href: "/my/tools/movie-tracker",
        icon: <Film className="size-4"/>,
        description: "A tool for tracking movies and TV shows.",
        alternativeNames: ["movie", "movies", "film", "films"],
    },
    {
        name: "Chat",
        href: "/my/tools/chat",
        icon: <MessagesSquare className="size-4"/>,
        description: "Chat with various and personalized profiles.",
        alternativeNames: ["ai chat", "chatbot"],
    },
    {
        name: "Workout Tracker",
        href: "/my/tools/workout",
        icon: <Dumbbell className="size-4"/>,
        description: "Track your workout, analyze the stats and improve to your best self",
        alternativeNames: ["workout", "exercise", "gym"],
    }
    // Future tools can be added here following the same structure
]
