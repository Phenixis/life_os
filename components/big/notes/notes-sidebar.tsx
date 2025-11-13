'use client';

import { Note } from '@/lib/db/schema';
import { NoteWithProject } from '@/lib/db/queries/note';
import { ChevronDown, ChevronRight, FileText, Folder, Lock } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CustomScrollArea } from '@/components/ui/custom-scrollarea';

interface NotesSidebarProps {
    notes: NoteWithProject[];
    selectedNoteId?: number | null;
    onNoteSelect: (note: NoteWithProject) => void;
    className?: string;
}

interface GroupedNotes {
    [projectTitle: string]: NoteWithProject[];
}

export default function NotesSidebar({
    notes,
    selectedNoteId,
    onNoteSelect,
    className
}: NotesSidebarProps) {
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [searchTitle, setSearchTitle] = useState<string>('');

    const groupedNotes = useMemo(() => {
        const groups: GroupedNotes = {};
        
        // Filter notes by search title or project title
        const searchLower = searchTitle.toLowerCase();
        const filteredNotes = searchTitle
            ? notes.filter((note) =>
                  note.title.toLowerCase().includes(searchLower) ||
                  (note.project_title && note.project_title.toLowerCase().includes(searchLower))
              )
            : notes;
        
        filteredNotes.forEach((note) => {
            const projectKey = note.project_title || 'No Project';
            if (!groups[projectKey]) {
                groups[projectKey] = [];
            }
            groups[projectKey].push(note);
        });

        // Sort notes within each project by title
        Object.keys(groups).forEach((key) => {
            groups[key].sort((a, b) => a.title.localeCompare(b.title));
        });

        return groups;
    }, [notes, searchTitle]);

    const sortedProjectKeys = useMemo(() => {
        return Object.keys(groupedNotes).sort((a, b) => {
            // "No Project" always at the end
            if (a === 'No Project') return 1;
            if (b === 'No Project') return -1;
            return a.localeCompare(b);
        });
    }, [groupedNotes]);

    const toggleProject = (projectTitle: string) => {
        const newExpanded = new Set(expandedProjects);
        if (newExpanded.has(projectTitle)) {
            newExpanded.delete(projectTitle);
        } else {
            newExpanded.add(projectTitle);
        }
        setExpandedProjects(newExpanded);
    };

    return (
        <div className={cn('border-r bg-muted/20 flex flex-col h-full w-full', className)}>
            {/* Header */}
            <div className="p-4 border-b flex-shrink-0">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Folder className="h-5 w-5" />
                    Notes
                </h2>
            </div>

            {/* Scrollable Content */}
            <CustomScrollArea className="flex-1">
                <div className="p-4">
                    <div className="space-y-1">
                        {sortedProjectKeys.map((projectTitle) => {
                            const projectNotes = groupedNotes[projectTitle];
                            const isExpanded = expandedProjects.has(projectTitle);
                            const notesCount = projectNotes.length;

                            return (
                                <div key={projectTitle} className="space-y-1">
                                    {/* Project Folder */}
                                    <button
                                        onClick={() => toggleProject(projectTitle)}
                                        className={cn(
                                            'w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-sm',
                                            'text-left'
                                        )}
                                    >
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4 flex-shrink-0" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4 flex-shrink-0" />
                                        )}
                                        <Folder className="h-4 w-4 flex-shrink-0 text-blue-500" />
                                        <span className="truncate flex-1">{projectTitle}</span>
                                        <span className="text-xs text-muted-foreground flex-shrink-0">
                                            {notesCount}
                                        </span>
                                    </button>

                                    {/* Notes in Project */}
                                    {isExpanded && (
                                        <div className="ml-6 space-y-0.5 w-full">
                                            {projectNotes.map((note) => {
                                                const isSelected = selectedNoteId === note.id;
                                                const isEncrypted = !!(note.salt && note.iv);

                                                return (
                                                    <button
                                                        key={note.id}
                                                        onClick={() => onNoteSelect(note)}
                                                        className={cn(
                                                            'w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-sm',
                                                            'hover:bg-accent',
                                                            isSelected && 'bg-accent font-medium'
                                                        )}
                                                        title={note.title}
                                                    >
                                                        <FileText className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                                                        <span className="truncate text-left flex-1 min-w-0">
                                                            {note.title}
                                                        </span>
                                                        {isEncrypted && (
                                                            <Lock className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {sortedProjectKeys.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            {searchTitle ? 'No notes match your search' : 'No notes found'}
                        </p>
                    )}
                </div>
            </CustomScrollArea>

            {/* Footer with Search */}
            <div className="p-4 border-t flex-shrink-0 bg-background">
                <input
                    type="text"
                    placeholder="Search notes and projects..."
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>
        </div>
    );
}
