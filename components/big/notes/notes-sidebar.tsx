'use client';

import { Note } from '@/lib/db/schema';
import { NoteWithProject } from '@/lib/db/queries/note';
import { ChevronDown, ChevronRight, FileText, Folder, Lock } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CustomScrollArea } from '@/components/ui/custom-scrollarea';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable
} from '@dnd-kit/core';
import { toast } from 'sonner';
import { useUser } from '@/hooks/use-user';
import { useSWRConfig } from 'swr';
import { useNoteModal } from '@/contexts/modal-commands-context';
import {Button} from "@/components/ui/button";
import {Plus} from "lucide-react";

interface NotesSidebarProps {
  notes: NoteWithProject[];
  selectedNoteId?: number | null;
  onNoteSelect: (note: NoteWithProject) => void;
  className?: string;
}

interface GroupedNotes {
  [projectTitle: string]: NoteWithProject[];
}

// Draggable Note Component
function DraggableNote({
  note,
  isSelected,
  onNoteSelect
}: {
  note: NoteWithProject;
  isSelected: boolean;
  onNoteSelect: (note: NoteWithProject) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `note-${note.id}`,
    data: { note }
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1
      }
    : undefined;

  const isEncrypted = !!(note.salt && note.iv);

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onNoteSelect(note)}
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-sm',
        'hover:bg-accent',
        isSelected && 'bg-accent font-medium',
        isDragging && 'opacity-50'
      )}
      title={note.title}
    >
      <FileText className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground cursor-grab active:cursor-grabbing" />
      <span className="truncate text-left flex-1 min-w-0">{note.title}</span>
      {isEncrypted && <Lock className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />}
    </button>
  );
}

// Droppable Project Folder Component
function DroppableProjectFolder({
  projectTitle,
  notesCount,
  isExpanded,
  onToggle,
  isOver
}: {
  projectTitle: string;
  notesCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({
    id: `project-${projectTitle}`,
    data: { projectTitle }
  });

  return (
    <button
      ref={setNodeRef}
      onClick={onToggle}
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-sm',
        'text-left',
        isOver && 'bg-accent ring-2 ring-primary'
      )}
    >
      {isExpanded ? (
        <ChevronDown className="h-4 w-4 flex-shrink-0" />
      ) : (
        <ChevronRight className="h-4 w-4 flex-shrink-0" />
      )}
      <Folder className="h-4 w-4 flex-shrink-0 text-blue-500" />
      <span className="truncate flex-1">{projectTitle}</span>
      <span className="text-xs text-muted-foreground flex-shrink-0">{notesCount}</span>
    </button>
  );
}

export default function NotesSidebar({ notes, selectedNoteId, onNoteSelect, className }: NotesSidebarProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [searchTitle, setSearchTitle] = useState<string>('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const { user } = useUser();
  const { mutate } = useSWRConfig();
  const noteModal = useNoteModal();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  const groupedNotes = useMemo(() => {
    const groups: GroupedNotes = {};

    // Filter notes by search title or project title
    const searchLower = searchTitle.toLowerCase();
    const filteredNotes = searchTitle
      ? notes.filter(
          note =>
            note.title.toLowerCase().includes(searchLower) ||
            (note.project_title && note.project_title.toLowerCase().includes(searchLower))
        )
      : notes;

    filteredNotes.forEach(note => {
      const projectKey = note.project_title || 'No Project';
      if (!groups[projectKey]) {
        groups[projectKey] = [];
      }
      groups[projectKey].push(note);
    });

    // Sort notes within each project by title
    Object.keys(groups).forEach(key => {
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

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !active.data.current?.note) {
      return;
    }

    const draggedNote = active.data.current.note as NoteWithProject;
    const targetProjectTitle = over.data.current?.projectTitle as string;

    // If dropped on the same project, do nothing
    if (draggedNote.project_title === targetProjectTitle) {
      return;
    }

    // Optimistically update the UI
    try {
      toast.promise(
        async () => {
          const response = await fetch('/api/note', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user?.api_key}`
            },
            body: JSON.stringify({
              noteData: {
                id: draggedNote.id,
                title: draggedNote.title,
                content: draggedNote.content,
                salt: draggedNote.salt,
                iv: draggedNote.iv
              },
              project: {
                id: 0,
                title: targetProjectTitle === 'No Project' ? '' : targetProjectTitle
              }
            })
          });

          if (!response.ok) {
            throw new Error('Failed to update note');
          }

          // Revalidate the notes data
          mutate((key: unknown) => typeof key === 'string' && (key === '/api/note' || key.startsWith('/api/note?')));
        },
        {
          loading: `Moving "${draggedNote.title}" to ${targetProjectTitle}...`,
          success: `Moved to ${targetProjectTitle}`,
          error: 'Failed to move note'
        }
      );
    } catch (error) {
      console.error('Error moving note:', error);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeDraggedNote = useMemo(() => {
    if (!activeId) return null;
    const noteId = parseInt(activeId.replace('note-', ''));
    return notes.find(note => note.id === noteId);
  }, [activeId, notes]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={cn('border-r bg-muted/20 flex flex-col h-full w-full', className)}>
        {/* Header */}
        <div className="p-4 border-b flex-shrink-0 flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Notes
          </h2>
          <div
            className="ml-2 lg:ml-0"
          >
            <Button
              variant="outline"
              size="icon"
              className={'whitespace-nowrap transition-transform duration-300'}
              onClick={() => noteModal.openModal()}
            >
              <Plus size={24} />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <CustomScrollArea className="flex-1">
          <div className="p-4">
            <div className="space-y-1">
              {sortedProjectKeys.map(projectTitle => {
                const projectNotes = groupedNotes[projectTitle];
                const isExpanded = expandedProjects.has(projectTitle);
                const notesCount = projectNotes.length;

                return (
                  <div key={projectTitle} className="space-y-1">
                    {/* Project Folder */}
                    <DroppableProjectFolder
                      projectTitle={projectTitle}
                      notesCount={notesCount}
                      isExpanded={isExpanded}
                      onToggle={() => toggleProject(projectTitle)}
                      isOver={activeId !== null && activeId.startsWith('note-')}
                    />

                    {/* Notes in Project */}
                    {isExpanded && (
                      <div className="ml-6 space-y-0.5 w-full max-w-[90%]">
                        {projectNotes.map(note => {
                          const isSelected = selectedNoteId === note.id;
                          return (
                            <DraggableNote
                              key={note.id}
                              note={note}
                              isSelected={isSelected}
                              onNoteSelect={onNoteSelect}
                            />
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
            onChange={e => setSearchTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <DragOverlay>
        {activeDraggedNote ? (
          <div className="bg-accent px-2 py-1.5 rounded-md flex items-center gap-2 shadow-lg opacity-80">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">{activeDraggedNote.title}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
