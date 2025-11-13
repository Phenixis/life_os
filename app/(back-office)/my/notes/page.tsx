"use client"

import NotesSidebar from "@/components/big/notes/notes-sidebar"
import NoteViewer from "@/components/big/notes/note-viewer"
import { useNotes } from "@/hooks/use-notes"
import { NoteWithProject } from "@/lib/db/queries/note"
import { useState, useMemo, useEffect } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { FolderOpen } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

export default function NotesPage() {
    const mobile = useIsMobile()
    const [selectedNote, setSelectedNote] = useState<NoteWithProject | null>(null)
    const [isMobileOpen, setIsMobileOpen] = useState(mobile)

    // Fetch all notes without pagination for file explorer view
    const { data: notesData, isLoading, isError } = useNotes({
        limit: 1000, // Large limit to get all notes
    })

    const filteredNotes = useMemo(() => {
        return notesData?.notes || []
    }, [notesData])

    useEffect(() => {
        setIsMobileOpen(mobile)
    }, [mobile])

    const handleNoteSelect = (note: NoteWithProject) => {
        setSelectedNote(note)
        setIsMobileOpen(false) // Close drawer on mobile after selecting
    }

    return (
        <div className="flex h-screen max-h-screen">
            {/* Desktop Sidebar */}
            <div className="w-80 flex-shrink-0 hidden md:flex flex-col h-full">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full p-4 text-center text-muted-foreground">
                        Loading notes...
                    </div>
                ) : isError ? (
                    <div className="flex items-center justify-center h-full p-4 text-center text-red-500">
                        Error loading notes
                    </div>
                ) : (
                    <NotesSidebar
                        notes={filteredNotes}
                        selectedNoteId={selectedNote?.id}
                        onNoteSelect={handleNoteSelect}
                    />
                )}
            </div>

            {/* Mobile Sidebar - Sheet/Drawer */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <SheetTrigger asChild className="md:hidden fixed bottom-4 left-4 z-50">
                    <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex items-center gap-2 shadow-md bg-background/95 backdrop-blur"
                    >
                        <FolderOpen className="h-4 w-4" />
                        {/* <span className="text-sm">Notes</span> */}
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80 h-full flex flex-col">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full p-4 text-center text-muted-foreground">
                            Loading notes...
                        </div>
                    ) : isError ? (
                        <div className="flex items-center justify-center h-full p-4 text-center text-red-500">
                            Error loading notes
                        </div>
                    ) : (
                        <NotesSidebar
                            notes={filteredNotes}
                            selectedNoteId={selectedNote?.id}
                            onNoteSelect={handleNoteSelect}
                        />
                    )}
                </SheetContent>
            </Sheet>

            {/* Middle Panel - Note Viewer */}
            <div className="flex-1 overflow-hidden">
                <NoteViewer note={selectedNote} />
            </div>
        </div>
    )
}