import {useSearchProject} from "@/hooks/use-search-project"
import {useDebouncedCallback} from "use-debounce"
import {useState} from "react"
import {Label} from "@/components/ui/label"
import {Input} from "@/components/ui/input"
import {cn} from "@/lib/utils"

export default function SearchProjectsInput({
                                                project,
                                                setProject,
                                                defaultValue,
                                                className,
                                                label,
                                                enabled = true,
                                            }: {
    project: string
    setProject: (project: string) => void
    defaultValue: string
    className?: string
    label?: string
    enabled?: boolean
}) {
    const [projectInputValue, setProjectInputValue] = useState<string>(defaultValue)
    const {projects, isLoading, isError} = useSearchProject({
            query: project,
            limit: 5,
            enabled: enabled
        }
    )
    const [showProjectSuggestions, setShowProjectSuggestions] = useState(false)

    const handleProjectChange = useDebouncedCallback((value: string) => {
        setProject(value)
    }, 200)

    return (
        <div className={cn("w-full", className)}>
            <Label htmlFor="project" className="text-nowrap">{label || "Project"}</Label>
            <Input
                type="text"
                id="project"
                name="project"
                value={projectInputValue}
                onFocus={() => setShowProjectSuggestions(true)}
                onBlur={(e) => {
                    // Delay hiding to allow click on suggestions
                    setTimeout(() => {
                        if (!e.relatedTarget || !e.relatedTarget.closest(".project-suggestions")) {
                            setShowProjectSuggestions(false)
                        }
                    }, 100)
                }}
                onChange={(e) => {
                    setProjectInputValue(e.target.value)
                    handleProjectChange(e.target.value)
                }}
            />
            {showProjectSuggestions && projectInputValue && (
                <div
                    className="mt-1 overflow-y-auto rounded-md border border-border bg-popover shadow-md project-suggestions"
                    tabIndex={-1}
                >
                    {isLoading ? (
                        <div className="p-2 text-sm text-muted-foreground">Loading projects...</div>
                    ) : isError ? (
                        <div className="p-2 text-sm text-destructive">Error loading projects</div>
                    ) : projects && projects.length > 0 ? (
                        <ul className="">
                            {projects.map((proj, index) => (
                                <li
                                    key={index}
                                    className={`cursor-pointer px-3 py-2 text-sm lg:hover:bg-accent ${projectInputValue === proj.title ? "bg-primary/10" : ""}`}
                                    onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
                                    onClick={() => {
                                        const selectedProject = proj.title
                                        setProjectInputValue(selectedProject)
                                        setProject(selectedProject)
                                        setShowProjectSuggestions(false)
                                    }}
                                >
                                    {proj.title}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-2 text-sm text-muted-foreground">No projects found</div>
                    )}
                </div>
            )}
        </div>
    )
}