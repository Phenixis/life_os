import {useSearchProject} from "@/hooks/use-search-project"
import {useDebounce, useDebouncedCallback} from "use-debounce"
import {useEffect, useRef, useState} from "react"
import {Label} from "@/components/ui/label"
import {Input} from "@/components/ui/input"
import {cn} from "@/lib/utils"
import {Badge} from "@/components/ui/badge";

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
    const [debouncedProjectInputValue] = useDebounce(projectInputValue, 300)
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
        <div className={cn("w-full relative", className)}>
            <Label htmlFor="project" className="text-nowrap">
                {label || "Project"}
            </Label>
            <div className={"relative"}>
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
                        
                        // Check if the input value exactly matches an existing project
                        const matchingProject = projects?.find(proj => proj.title === e.target.value)
                        
                        if (matchingProject) {
                            // Exact match found - use the existing project
                            handleProjectChange({title: matchingProject.title, id: matchingProject.id})
                        } else {
                            // No exact match - treat as new project
                            handleProjectChange({title: e.target.value, id: -1})
                        }
                    }}
                />
                {
                    (projects.map(project => project.title).includes(debouncedProjectInputValue) || project.id >= 0) || (debouncedProjectInputValue !== null && debouncedProjectInputValue !== "") ? (
                        <div className={"absolute right-2 top-0 h-full flex items-center justify-center"}>
                            {
                                projects.map(project => project.title).includes(debouncedProjectInputValue) || project.id >= 0 ? (
                                    <Badge
                                        variant={"outline"}
                                    >
                                        Existing
                                    </Badge>
                                ) : debouncedProjectInputValue !== null && debouncedProjectInputValue !== "" ? (
                                    <Badge
                                        variant={"secondary"}
                                    >
                                        New Project
                                    </Badge>
                                ) : null
                            }
                        </div>
                    ) : null
                }
            </div>
            {showProjectSuggestions && projectInputValue && (
                <div
                    className="absolute top-16 left-0 w-full mt-1 overflow-y-auto rounded-md border border-border bg-popover shadow-md project-suggestions"
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