"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from "next/dynamic"
const NoteModal = dynamic(() => import("@/components/big/notes/note-modal"), { ssr: false })
import { cn } from "@/lib/utils"
import type { Note } from "@/lib/db/schema"
import { useState, useCallback, useTransition, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Filter, FolderTree } from "lucide-react"
import NoteDisplay from "./note-display"
import { useNotes } from "@/hooks/use-notes"
import { useProjects } from "@/hooks/use-projects"
import { useRouter, useSearchParams } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { CircleHelp } from "lucide-react"
import SearchNote from "@/components/big/notes/search-note"

// Constants for URL parameters
export const NOTE_PARAMS = {
    TITLE: 'note_title',
    LIMIT: 'note_limit',
    ORDER_BY: 'note_orderBy',
    ORDERING_DIRECTION: 'note_orderingDirection',
    PROJECTS: 'note_projects',
    REMOVED_PROJECTS: 'note_removedProjects',
    GROUP_BY_PROJECT: 'note_groupByProject',
    PROJECT_TITLE: "note_projectTitle",
    PAGE: "note_page",
} as const;

// Type for URL parameters
export type NoteUrlParams = {
    [NOTE_PARAMS.LIMIT]?: string;
    [NOTE_PARAMS.ORDER_BY]?: keyof Note.Note.Select;
    [NOTE_PARAMS.ORDERING_DIRECTION]?: 'asc' | 'desc';
    [NOTE_PARAMS.PROJECTS]?: string;
    [NOTE_PARAMS.REMOVED_PROJECTS]?: string;
    [NOTE_PARAMS.GROUP_BY_PROJECT]?: string;
};

// Add this type definition after the NoteUrlParams type
type GroupedNotes = Record<string, { name: string; notes: Note.Note.Select[] }>;

export function NotesCard({
    className,
    limit: initialLimit,
    orderBy: initialOrderBy = "created_at",
    orderingDirection: initialOrderingDirection = "desc",
}: {
    className?: string
    limit?: number
    orderBy?: keyof Note.Note.Select
    orderingDirection?: "asc" | "desc"
}) {
    // -------------------- Imports & Hooks --------------------
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    // -------------------- State --------------------
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    const [limit, setLimit] = useState<number | undefined>(
        searchParams.has(NOTE_PARAMS.LIMIT)
            ? Number.parseInt(searchParams.get(NOTE_PARAMS.LIMIT) || "") || initialLimit
            : initialLimit
    )

    const [orderBy] = useState<keyof Note.Note.Select | undefined>((searchParams.get(NOTE_PARAMS.ORDER_BY) as keyof Note.Note.Select) || initialOrderBy)

    const [orderingDirection] = useState<"asc" | "desc" | undefined>((searchParams.get(NOTE_PARAMS.ORDERING_DIRECTION) as "asc" | "desc") || initialOrderingDirection)

    const [selectedProjects, setSelectedProjects] = useState<string[]>(
        searchParams.has(NOTE_PARAMS.PROJECTS)
            ? searchParams.get(NOTE_PARAMS.PROJECTS)?.split(",") || []
            : []
    )

    const [removedProjects, setRemovedProjects] = useState<string[]>(
        searchParams.has(NOTE_PARAMS.REMOVED_PROJECTS)
            ? searchParams.get(NOTE_PARAMS.REMOVED_PROJECTS)?.split(",") || []
            : []
    )

    const [groupByProject, setGroupByProject] = useState(
        searchParams.get(NOTE_PARAMS.GROUP_BY_PROJECT) === "true"
    )

    const [title, setTitle] = useState<string>(searchParams.get(NOTE_PARAMS["TITLE"]) || "")
    // -------------------- Data Fetching --------------------
    const { projects, isLoading: projectsLoading } = useProjects({
        completed: false,
        taskDeleted: false,
        withNotes: true,
    })

    const { data: notesData, isLoading } = useNotes({
        title,
        limit,
        projectTitles: groupByProject && selectedProjects.length > 0 ? selectedProjects : undefined,
        excludedProjectTitles: groupByProject && removedProjects.length > 0 ? removedProjects : undefined,
    })

    // -------------------- Effects --------------------
    useEffect(() => {
        // Only update if we have actual project data
        if (projects && projects.length > 0) {
            // Update selected projects based on the current projects
            setSelectedProjects((prev) =>
                prev.filter((title) => projects.some((project) => project.title === title))
            );

            // Update removed projects based on the current projects
            setRemovedProjects((prev) =>
                prev.filter((title) => !projects.some((project) => project.title === title))
            );
        }
    }, [projects]);

    // -------------------- Callbacks --------------------
    const updateUrlParams = useCallback(() => {
        const params = new URLSearchParams(searchParams.toString())

        if (limit) params.set(NOTE_PARAMS.LIMIT, limit.toString())
        if (orderBy) params.set(NOTE_PARAMS.ORDER_BY, orderBy as string)
        if (orderingDirection) params.set(NOTE_PARAMS.ORDERING_DIRECTION, orderingDirection)
        if (selectedProjects.length > 0) params.set(NOTE_PARAMS.PROJECTS, selectedProjects.join(","))
        if (removedProjects.length > 0) params.set(NOTE_PARAMS.REMOVED_PROJECTS, removedProjects.join(","))
        if (groupByProject) params.set(NOTE_PARAMS.GROUP_BY_PROJECT, "true")

        router.push(`?${params.toString()}`, { scroll: false })
    }, [limit, orderBy, orderingDirection, selectedProjects, removedProjects, groupByProject, router, searchParams])

    useEffect(() => {
        updateUrlParams()
    }, [limit, orderBy, orderingDirection, selectedProjects, groupByProject, updateUrlParams])

    /**
     * Toggles a project through three states:
     * 1. Include only this project
     * 2. Exclude this project
     * 3. Reset to neutral state
     * 
     * @param projectTitle - The title of the project to toggle
     */
    const toggleProject = useCallback((projectTitle: string) => {
        startTransition(() => {
            if (selectedProjects.includes(projectTitle)) {
                // State 1 -> 2: From "only this project" to "exclude this project" 
                setSelectedProjects(prev => prev.filter(title => title !== projectTitle));
                setRemovedProjects(prev => [...prev, projectTitle]);
            } else if (removedProjects.includes(projectTitle)) {
                // State 2 -> 3: From "exclude this project" to neutral state
                setRemovedProjects(prev => prev.filter(title => title !== projectTitle));
            } else {
                // State 3 -> 1: From neutral to "only this project"
                // If this is the first project being selected, clear excluded projects
                if (selectedProjects.length === 0) {
                    setRemovedProjects(prev => prev.filter(title => title !== projectTitle));
                }
                setSelectedProjects(prev => [...prev, projectTitle]);
            }
        });
    }, [selectedProjects, removedProjects])

    // -------------------- Derived Data --------------------
    const groupedNotes = useMemo(() => {
        if (!notesData?.notes) return {} as GroupedNotes

        return notesData.notes.slice(0, limit).reduce(
            (acc: GroupedNotes, note: Note.Note.Select) => {
                const projectId = note.project_title || "no-project"
                const projectName = projects?.find((p) => p.title === note.project_title)?.title || "No Project"

                if (!acc[projectId]) {
                    acc[projectId] = { name: projectName, notes: [] }
                }

                acc[projectId].notes.push(note)
                return acc
            },
            {} as GroupedNotes
        )
    }, [notesData?.notes, projects, limit])

    return (
        <Card
            className={cn(`w-full md:max-w-xl group/NoteCard h-fit max-h-screen overflow-y-auto scrollbar-hide`, className)}
        >
            <CardHeader className="flex flex-col sticky top-0 bg-background z-10">
                <div className="flex flex-row items-center justify-between w-full gap-2">
                    <CardTitle>
                        Your Notes
                    </CardTitle>
                    <div className="flex gap-2 xl:opacity-0 duration-300 lg:group-hover/NoteCard:opacity-100">
                        <Button
                            variant={isFilterOpen ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsFilterOpen((prev) => !prev)}
                            disabled={isPending || isLoading}
                            tooltip="Filter/group the notes"
                            className="h-10 py-2 flex items-center border-none"
                        >
                            <Filter className="h-4 w-4" />
                        </Button>
                        <NoteModal />
                    </div>
                </div>
                <div className={`${!isFilterOpen && "hidden"} flex flex-col gap-2`}>
                    <div className="flex flex-row justify-between items-end gap-6 flex-wrap">
                        <div className="flex flex-row items-center gap-2">
                            <Button
                                variant={limit === 5 ? "default" : "outline"}
                                size="sm"
                                onClick={() => setLimit(5)}
                                disabled={isPending || isLoading}
                                tooltip="Limit to 5 notes"
                            >
                                5
                            </Button>
                            <Button
                                variant={limit === 10 ? "default" : "outline"}
                                size="sm"
                                onClick={() => setLimit(10)}
                                disabled={isPending || isLoading}
                                tooltip="Limit to 10 notes"
                            >
                                10
                            </Button>
                            <Button
                                variant={limit === 25 ? "default" : "outline"}
                                size="sm"
                                onClick={() => setLimit(25)}
                                disabled={isPending || isLoading}
                                tooltip="Limit to 25 notes"
                            >
                                25
                            </Button>
                            <Button
                                variant={limit === 50 ? "default" : "outline"}
                                size="sm"
                                onClick={() => setLimit(50)}
                                disabled={isPending || isLoading}
                                tooltip="Limit to 50 notes"
                            >
                                50
                            </Button>
                        </div>
                        <SearchNote
                            className="lg:w-1/3"
                            title={title}
                            setTitle={setTitle}
                            defaultValue={searchParams.get(NOTE_PARAMS["TITLE"]) || ""}
                            label="Search notes by title"
                        />
                        <Button
                            variant={groupByProject ? "default" : "outline"}
                            size="sm"
                            onClick={() => setGroupByProject(!groupByProject)}
                            disabled={isPending || isLoading}
                            tooltip="Group by project"
                        >
                            <FolderTree className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex items-center justify-between w-full">
                        {groupByProject && (
                            <div className="w-full flex flex-col space-y-2">
                                <div className="w-full mt-2 border rounded-md p-2">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-sm font-medium">
                                            Project Filters
                                            <Tooltip>
                                                <TooltipTrigger className="ml-1 hidden lg:inline-block">
                                                    <CircleHelp className="ml-1 size-4 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <div className="text-xs text-muted-foreground p-2 max-w-[300px]">
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center gap-2 w-full max-w-1/2">
                                                                    <Checkbox checked={true} disabled className="size-4" />
                                                                    <span className="font-medium">Include Project</span>
                                                                </div>
                                                                <div className="text-muted-foreground inline-block w-full max-w-1/2">Show only notes from this project</div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center gap-2 w-full max-w-1/2">
                                                                    <Checkbox checked={false} disabled className="size-4" />
                                                                    <span className="font-medium line-through text-muted-foreground">Exclude Project</span>
                                                                </div>
                                                                <div className="text-muted-foreground inline-block w-full max-w-1/2">Hide notes from this project</div>
                                                            </div>
                                                            <div className="flex justify-between items-center gap-2">
                                                                <div className="flex items-center gap-2 w-full max-w-1/2">
                                                                    <Checkbox checked={false} disabled className="size-4" />
                                                                    <span className="font-medium">Neutral</span>
                                                                </div>
                                                                <div className="text-muted-foreground inline-block w-full max-w-1/2">Show all notes</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </h4>
                                        {/* Reset button */}
                                        {(selectedProjects.length > 0 || removedProjects.length > 0) && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    startTransition(() => {
                                                        setSelectedProjects([]);
                                                        setRemovedProjects([]);
                                                    });
                                                }}
                                                className="h-6 text-xs px-2"
                                            >
                                                Reset filters
                                            </Button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {projectsLoading ? (
                                            <div className="w-full text-sm text-center text-muted-foreground col-span-2">Loading projects...</div>
                                        ) : projects?.length > 0 ? (
                                            projects.map((project) => (
                                                <div key={"note_" + project.title} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`note_project-${project.title}`}
                                                        checked={selectedProjects.includes(project.title)}
                                                        onCheckedChange={() => toggleProject(project.title)}
                                                    />
                                                    <label
                                                        htmlFor={`note_project-${project.title}`}
                                                        className={cn(
                                                            "text-sm cursor-pointer flex items-center",
                                                            removedProjects.includes(project.title) && "line-through text-muted-foreground"
                                                        )}
                                                    >
                                                        {project.title}
                                                    </label>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="w-full text-sm text-center text-muted-foreground col-span-2">No projects found</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    // Show loading state
                    Array(5)
                        .fill(null)
                        .map((_, i) => <NoteDisplay key={i} className="mt-2" />)
                ) : notesData?.notes?.length > 0 ? (
                    // Show notes, grouped or ungrouped based on the groupByProject state
                    groupByProject ? (
                        // Grouped by project
                        Object.entries(groupedNotes)
                            .sort(([, a], [, b]) => {
                                const aGroup = a as { name: string; notes: Note.Note.Select[] };
                                const bGroup = b as { name: string; notes: Note.Note.Select[] };
                                return aGroup.name.localeCompare(bGroup.name);
                            })
                            .map(([projectId, group]) => {
                                const { name, notes } = group as { name: string; notes: Note.Note.Select[] };
                                return (
                                    <div key={projectId} className="mb-4">
                                        <h3 className="font-medium text-sm p-2 rounded-md">{name}</h3>
                                        <div className="pl-2">
                                            {notes.map((note: Note.Note.Select) => (
                                                <NoteDisplay note={note} className="mt-2" key={note.id} />
                                            ))}
                                        </div>
                                    </div>
                                )
                            })
                    ) : (
                        // Not grouped
                        notesData.notes
                            .slice(0, limit)
                            .map((note: Note.Note.Select) => (
                                <div key={note.id} className="mt-1">
                                    <NoteDisplay note={note} />
                                </div>
                            ))
                    )
                ) : (
                    // Show empty state
                    <div className="text-center py-4">No notes found. Create your first note!</div>
                )}
            </CardContent>
        </Card>
    )
}
