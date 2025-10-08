"use client"

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import dynamic from "next/dynamic"
import {cn} from "@/lib/utils"
import type {Note} from "@/lib/db/schema"
import {useCallback, useEffect, useMemo, useState, useTransition} from "react"
import {Button} from "@/components/ui/button"
import {Filter, FolderTree} from "lucide-react"
import NoteDisplay from "./note-display"
import {useNotes} from "@/hooks/use-notes"
import {useProjects} from "@/hooks/use-projects"
import {useRouter, useSearchParams} from "next/navigation"
import SearchNote from "@/components/big/notes/search-note"
import {RadioButtons} from "@/components/big/filtering/radio-buttons";
import {ProjectsMultipleSelects} from "@/components/big/filtering/projects-multiple-selects";

const NoteModal = dynamic(() => import("@/components/big/notes/note-modal"), {ssr: false})

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
    const {projects, isLoading: projectsLoading} = useProjects({
        completed: false,
        taskDeleted: false,
        withNotes: true,
    })

    const {data: notesData, isLoading} = useNotes({
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

        router.push(`?${params.toString()}`, {scroll: false})
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
                        <NoteModal/>
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
                                    projects={projects.map((project) => project.title)}
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
