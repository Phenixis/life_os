import {useSearchProject} from "@/hooks/use-search-project"
import {useDebouncedCallback, useDebouncedValue} from "use-debounce"
import {useState, useEffect, useRef} from "react"
import {Label} from "@/components/ui/label"
import {Input} from "@/components/ui/input"
import {cn} from "@/lib/utils"

export default function SearchProjectsInput(
    {
        project,
        setProject,
        defaultValue,
        className,
        label,
        enabled = true,
    }: {
        project: { title: string, id: number }
        setProject: (project: { title: string, id: number }) => void
        defaultValue: string
        className?: string
        label?: string
        enabled?: boolean
    }
) {
    const [projectInputValue, setProjectInputValue] = useState<string>(defaultValue)
    // Debounce the search query to avoid overwhelming the server with API calls
    const [debouncedProjectInputValue] = useDebouncedValue(projectInputValue, 300)
    const {projects, isLoading, isError} = useSearchProject({
            query: debouncedProjectInputValue,
            limit: 5,
            enabled: enabled
        }
    )
    const [showProjectSuggestions, setShowProjectSuggestions] = useState(false)
    const isUserTypingRef = useRef(false)

    const handleProjectChange = useDebouncedCallback((value: { title: string, id: number }) => {
        setProject(value)
    }, 200)

    // Sync projectInputValue when project prop changes from parent (e.g., when modal opens with existing project)
    // Only update if the user is not currently typing to avoid the write-back issue
    useEffect(() => {
        if (!isUserTypingRef.current && project.title !== projectInputValue) {
            setProjectInputValue(project.title)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project.title])

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
                    // User finished typing
                    isUserTypingRef.current = false
                    // Delay hiding to allow click on suggestions
                    setTimeout(() => {
                        if (!e.relatedTarget || !e.relatedTarget.closest(".project-suggestions")) {
                            setShowProjectSuggestions(false)
                        }
                    }, 100)
                }}
                onChange={(e) => {
                    isUserTypingRef.current = true
                    setProjectInputValue(e.target.value)
                    if (projects && projects.length > 0) {
                        projects.forEach(proj => {
                            if (proj.title === e.target.value) {
                                handleProjectChange({title: proj.title, id: proj.id})
                            }
                        })
                    } else {
                        handleProjectChange({title: e.target.value, id: -1})
                    }
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
                                        const selectedProject = {title: proj.title, id: proj.id}
                                        isUserTypingRef.current = false
                                        setProjectInputValue(selectedProject.title)
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