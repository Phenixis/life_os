import type React from "react"
import {isToolCard, isToolsCategorie, type ToolCardProps, tools, ToolsCategorieProps} from "@/lib/tools-data"
import Link from "next/link"

function ToolCard(tool: ToolCardProps) {
    return (
        <Link
            href={tool.href}
            className="block p-6 bg-card border rounded-lg shadow-sm hover:bg-accent/10 transition-colors duration-300 cursor-pointer"
        >
            <div className="flex items-center justify-left gap-2 mb-4">
                <div className="text-3xl">{tool.icon}</div>
                <h2 className="text-xl">{tool.name}</h2>
            </div>
            <p className="text-muted-foreground">{tool.description}</p>
        </Link>
    )
}

function ToolsCategorie(categorie: ToolsCategorieProps) {
    return (
        <>
            <h2 className="text-2xl mt-6 mb-4 font-semibold">{categorie.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categorie.tools.map((tool, index) => (
                    <ToolCard key={index} {...tool} />
                ))}
            </div>
        </>
    )
}

export default function ToolsPage() {
    const toolsCard = tools.filter((tool) => isToolCard(tool)).filter((tool) => tool.href !== "/my/tools")
    const toolsCategorie = tools.filter((tool) => isToolsCategorie(tool))
    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Tools</h1>
            </div>

            {
                toolsCard.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {
                            toolsCard.map((tool, index) => <ToolCard key={index} {...tool} />)
                        }
                    </div>
                )
            }
            {
                toolsCategorie.map((categorie, index) => <ToolsCategorie key={index} {...categorie} />)
            }
        </div>
    )
}
