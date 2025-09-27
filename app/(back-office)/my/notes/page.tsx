"use client"

import NoteDisplay from "@/components/big/notes/note-display"
import { useNotes } from "@/hooks/use-notes"
import { Note } from "@/lib/db/schema"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useCallback, useMemo } from "react"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import SearchProjectsInput from "@/components/big/projects/search-projects-input"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import SearchNote from "@/components/big/notes/search-note"
import { NOTE_PARAMS } from "@/components/big/notes/notes-card"

export default function NotesPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isHeaderExpanded, setIsHeaderExpanded] = useState(true)

    const [title, setTitle] = useState<string>(searchParams.get(NOTE_PARAMS["TITLE"]) || "")
    const [projectTitle, setProjectTitle] = useState<string>(searchParams.get(NOTE_PARAMS["PROJECT_TITLE"]) || "")
    const [page, setPage] = useState<number>(searchParams.get(NOTE_PARAMS["PAGE"]) ? Number.parseInt(searchParams.get(NOTE_PARAMS["PAGE"]) as string) : 1)

    const activeFiltersCount = useMemo(() => {
        let count = 0
        if (title) count++
        if (projectTitle) count++
        return count
    }, [title, projectTitle])

    const { data: notesData, isLoading, isError } = useNotes({
        title,
        projectTitle,
        limit: 30,
        page
    })

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage)
        const params = new URLSearchParams(searchParams.toString())
        params.set(NOTE_PARAMS["PAGE"], newPage.toString())
        router.push(`?${params.toString()}`)
    }, [router, searchParams])

    return (
        <div className="flex flex-col gap-4">
            <header className="bg-background border-b">
                <div className="w-full px-2 py-1">
                    <div className="flex justify-between items-center lg:hidden mb-2"
                        onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                    >
                        <h2 className="text-lg font-semibold">
                            Filters
                            {activeFiltersCount > 0 && (
                                <span className="text-muted-foreground text-sm ml-2">
                                    ({activeFiltersCount} active)
                                </span>
                            )}
                        </h2>
                        <Button
                            variant="ghost"
                            size="icon"
                        >
                            {isHeaderExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    </div>
                    <div className={cn(
                        "flex flex-col lg:flex-row items-center gap-4 transition-all duration-300",
                        !isHeaderExpanded && "hidden lg:flex"
                    )}>
                        <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-2/3">
                            <SearchNote
                                className="lg:w-1/3"
                                title={title}
                                setTitle={setTitle}
                                defaultValue={searchParams.get(NOTE_PARAMS["TITLE"]) || ""}
                                label="Search notes by title"
                            />
                            <div className="w-full lg:w-1/3">
                                <SearchProjectsInput
                                    project={projectTitle}
                                    setProject={setProjectTitle}
                                    defaultValue={projectTitle}
                                    label="Search notes by project title"
                                />
                            </div>
                        </div>
                        <div className="w-full lg:w-1/3 flex items-end justify-center">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => handlePageChange(Math.max(1, page - 1))}
                                            className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                        />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationLink
                                            onClick={() => handlePageChange(1)}
                                            isActive={page === 1}
                                        >
                                            1
                                        </PaginationLink>
                                    </PaginationItem>
                                    {page > 1 && (
                                        <>
                                            <PaginationItem>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                            <PaginationItem>
                                                <PaginationLink isActive>{page}</PaginationLink>
                                            </PaginationItem>
                                        </>
                                    )}
                                    {page < (notesData?.totalPages || 1) && (
                                        <>
                                            <PaginationItem>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                            <PaginationItem>
                                                <PaginationLink
                                                    onClick={() => handlePageChange(notesData?.totalPages || 1)}
                                                    isActive={page === (notesData?.totalPages || 1)}
                                                >
                                                    {notesData?.totalPages || 1}
                                                </PaginationLink>
                                            </PaginationItem>
                                        </>
                                    )}
                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => handlePageChange(Math.min(notesData?.totalPages || 1, page + 1))}
                                            className={page >= (notesData?.totalPages || 1) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                        {
                            (title !== "" || projectTitle !== "") && (
                                <div className="w-full lg:w-auto flex justify-end">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setTitle("")
                                            setProjectTitle("")
                                            const params = new URLSearchParams(searchParams.toString())
                                            params.delete(NOTE_PARAMS["TITLE"])
                                            params.delete(NOTE_PARAMS["PROJECT_TITLE"])
                                            router.push(`?${params.toString()}`)
                                        }}
                                    >
                                        Reset Filters
                                    </Button>
                                </div>
                            )
                        }
                    </div>
                </div>
            </header>
            <div className="flex gap-4">
                {
                    isLoading ? (
                        <>
                            {
                                Array.from({ length: 5 }).map((_, index) => (
                                    <div className="hidden flex-col gap-4 w-full lg:flex" key={index}>
                                        {Array.from({ length: 3 }).map((_, index) => (
                                            <NoteDisplay
                                                key={index}
                                            />
                                        ))}
                                    </div>
                                ))
                            }
                            {
                                Array.from({ length: 3 }).map((_, index) => (
                                    <div className="hidden md:flex flex-col gap-4 w-full lg:hidden" key={index}>
                                        {Array.from({ length: 3 }).map((_, index) => (
                                            <NoteDisplay
                                                key={index}
                                            />
                                        ))}
                                    </div>
                                ))
                            }
                            {
                                <div className="flex flex-col gap-4 w-full md:hidden">
                                    {Array.from({ length: 15 }).map((_, index) => (
                                        <NoteDisplay
                                            key={index}
                                        />
                                    ))}
                                </div>
                            }
                        </>
                    ) : isError ? (
                        <div>
                            <p>Error</p>
                        </div>
                    ) : notesData && notesData.notes && notesData.notes.length > 0 ? (
                        <>
                            {
                                Array.from({ length: 5 }).map((_, index) => (
                                    <div className="hidden flex-col gap-4 w-full lg:flex" key={index}>
                                        {notesData.notes.filter(
                                            (note: Note.Note.Select, idx: number) => idx % 5 === index
                                        ).map((note: Note.Note.Select) => (
                                            <NoteDisplay
                                                key={note.id}
                                                note={note}
                                            />
                                        ))}
                                    </div>
                                ))
                            }
                            {
                                Array.from({ length: 3 }).map((_, index) => (
                                    <div className="hidden flex-col gap-4 w-full md:flex lg:hidden" key={index}>
                                        {notesData.notes.filter(
                                            (note: Note.Note.Select, idx: number) => idx % 3 === index
                                        ).map((note: Note.Note.Select) => (
                                            <NoteDisplay
                                                key={note.id}
                                                note={note}
                                            />
                                        ))}
                                    </div>
                                ))
                            }
                            {
                                <div className="flex flex-col gap-4 w-full md:hidden">
                                    {notesData.notes.map((note: Note.Note.Select) => (
                                        <NoteDisplay
                                            key={note.id}
                                            note={note}
                                        />
                                    ))}
                                </div>
                            }
                        </>
                    ) : (
                        <div>
                            <p>No notes found</p>
                        </div>
                    )
                }
            </div>
        </div>
    )
}