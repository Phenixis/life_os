"use client"

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {cn} from "@/lib/utils"
import type {Note} from "@/lib/db/schema"
import {useCallback, useEffect, useMemo, useRef, useState, useTransition} from "react"
import {Button} from "@/components/ui/button"
import {Filter, FolderTree, Plus} from "lucide-react"
import NoteDisplay from "./note-display"
import {useNotes} from "@/hooks/use-notes"
import {useProjects} from "@/hooks/use-projects"
import {useRouter, useSearchParams} from "next/navigation"
import SearchNote from "@/components/big/notes/search-note"
import {RadioButtons} from "@/components/big/filtering/radio-buttons";
import {ProjectsMultipleSelects} from "@/components/big/filtering/projects-multiple-selects";
import {useNoteModal} from "@/contexts/modal-commands-context";
import {simplifiedProject} from "@/components/big/tasks/tasks-card";

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

export type notesFilters = {
    title: string;
    limit: number;
    orderBy: keyof Note.Note.Select;
    orderingDirection: "asc" | "desc";
    selectedProjects: simplifiedProject[];
    removedProjects: simplifiedProject[];
    groupByProject: boolean;
}

// Add this type definition after the NoteUrlParams type
type GroupedNotes = Record<string, { name: string; notes: Note.Note.Select[] }>;

export function NotesCard(
    {
        className,
        limit: initialLimit,
        orderBy: initialOrderBy = "created_at",
        orderingDirection: initialOrderingDirection = "desc",
    }: {
        className?: string
        limit?: number
        orderBy?: keyof Note.Note.Select
        orderingDirection?: "asc" | "desc"
    }
) {
    // -------------------- Imports & Hooks --------------------
    const router = useRouter()
    const searchParams = useSearchParams()
    const noteModal = useNoteModal()
    const [isPending, startTransition] = useTransition()

    // -------------------- State --------------------
    const [isFilterOpen, setIsFilterOpen] = useState(false)

    const [limit, setLimit] = useState<number | undefined>(initialLimit)

    const [orderBy, setOrderBy] = useState<keyof Note.Note.Select | undefined>(initialOrderBy)

    const [orderingDirection, setOrderingDirection] = useState<"asc" | "desc" | undefined>(initialOrderingDirection)

    const [selectedProjects, setSelectedProjects] = useState<simplifiedProject[]>([])

    const [removedProjects, setRemovedProjects] = useState<simplifiedProject[]>([])

    const [groupByProject, setGroupByProject] = useState<boolean>(false)

    const [title, setTitle] = useState<string>("")

    // Add a ref to track if this is the first render
    const isSavedFiltersBeenUsed = useRef(false);

    // -------------------- Data Fetching --------------------
    const {projects, isLoading: projectsLoading} = useProjects({
        completed: false,
        taskDeleted: false,
        withNotes: true,
    })

    const {data: notesData, isLoading} = useNotes({
        title,
        limit,
        projects: groupByProject && selectedProjects.length > 0 ? selectedProjects : undefined,
        excludedProjects: groupByProject && removedProjects.length > 0 ? removedProjects : undefined,
    })

    // -------------------- Effects --------------------
    useEffect(() => {
        if (!isSavedFiltersBeenUsed.current) {
            return;
        }

        const serialized = JSON.stringify({
            limit,
            orderBy,
            orderingDirection,
            selectedProjects,
            removedProjects,
            groupByProject,
        } as notesFilters)

        window.localStorage.setItem("notes_filters", serialized)
    }, [groupByProject, limit, orderBy, orderingDirection, removedProjects, selectedProjects])

    useEffect(() => {
        const raw = window.localStorage.getItem("notes_filters")

        if (raw) {
            try {
                const savedFilters = JSON.parse(raw) as Partial<notesFilters>;

                if (typeof savedFilters.limit === "number") {
                    setLimit(savedFilters.limit)
                }

                if (typeof savedFilters.orderBy === "string") {
                    setOrderBy(savedFilters.orderBy as keyof Note.Note.Select)
                }

                if (savedFilters.orderingDirection === "asc" || savedFilters.orderingDirection === "desc") {
                    setOrderingDirection(savedFilters.orderingDirection)
                }

                if (Array.isArray(savedFilters.selectedProjects)) {
                    setSelectedProjects(savedFilters.selectedProjects)
                }

                if (Array.isArray(savedFilters.removedProjects)) {
                    setRemovedProjects(savedFilters.removedProjects)
                }

                if (typeof savedFilters.groupByProject === "boolean") {
                    setGroupByProject(savedFilters.groupByProject)
                }
            } catch (e) {
                // ignore malformed JSON
                console.error("Error parsing saved filters:", e)
            }
        }

        isSavedFiltersBeenUsed.current = true;
    }, [])

    // -------------------- Callbacks --------------------

    /**
     * Toggles a project through three states:
     * 1. Include only this project
     * 2. Exclude this project
     * 3. Reset to neutral state
     *
     * @param projectTitle - The title of the project to toggle
     */
    const toggleProject = useCallback((project: simplifiedProject) => {
        startTransition(() => {
            if (selectedProjects.filter(title => title.id === project.id).length > 0) {
                if (selectedProjects.length === 1) {
                    setRemovedProjects(prev => [...prev, project]);
                }
                setSelectedProjects(prev => prev.filter(title => title.id !== project.id));
            } else if (removedProjects.filter(title => title.id === project.id).length > 0) {
                setRemovedProjects(prev => prev.filter(title => title.id !== project.id));
            } else {
                if (selectedProjects.length === 0) {
                    setRemovedProjects(prev => prev.filter(title => title.id !== project.id));
                }
                setSelectedProjects(prev => [...prev, project]);
            }
        });
    }, [selectedProjects, removedProjects])

    // -------------------- Derived Data --------------------
    const groupedNotes = useMemo(() => {
        if (!notesData?.notes) return {} as GroupedNotes

        return notesData.notes.slice(0, limit).reduce(
            (acc: GroupedNotes, note: Note.Note.Select) => {
                const projectId = note.project_id || -1
                const projectName = projects?.find((p) => p.id === note.project_id)?.title || "No Project"

                if (!acc[projectId]) {
                    acc[projectId] = {name: projectName, notes: []}
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
                            <Filter className="h-4 w-4"/>
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className={
                                "whitespace-nowrap transition-transform duration-300 border-none"
                            }
                            onClick={() => noteModal.openModal()}
                        >
                            <Plus size={24}/>
                        </Button>
                    </div>
                </div>
                <div className={`${!isFilterOpen && "hidden"} flex flex-col gap-2`}>
                    <div className="flex flex-row justify-between items-end gap-6 flex-wrap">
                        <RadioButtons
                            values={[5, 10, 25, 50]}
                            currentValue={limit}
                            onChange={setLimit}
                            disabled={isPending || isLoading}/>
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
                            <FolderTree className="h-4 w-4"/>
                        </Button>
                    </div>
                    <div className="flex items-center justify-between w-full">
                        {groupByProject && (
                            <div className="w-full flex flex-col space-y-2">
                                <ProjectsMultipleSelects
                                    projects={projects.map((project) => {
                                        return {
                                            title: project.title,
                                            id: project.id
                                        }
                                    })}
                                    selectedProjects={selectedProjects}
                                    removedProjects={removedProjects}
                                    onChange={toggleProject}
                                    loading={projectsLoading}
                                />
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
                        .map((_, i) => <NoteDisplay key={i} className="mt-2"/>)
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
                                const {name, notes} = group as { name: string; notes: Note.Note.Select[] };
                                return (
                                    <div key={projectId} className="mb-4">
                                        <h3 className="font-medium text-sm p-2 rounded-md">{name}</h3>
                                        <div className="pl-2">
                                            {notes.map((note: Note.Note.Select) => (
                                                <NoteDisplay note={note} className="mt-2" key={note.id}/>
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
                                    <NoteDisplay note={note}/>
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
