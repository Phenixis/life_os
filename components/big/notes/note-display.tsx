'use client';

import { Note } from '@/lib/db/schema';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, Fragment, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  ClipboardPlus,
  ExternalLink,
  Lock,
  PenIcon,
  Trash
} from 'lucide-react';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { useUser } from '@/hooks/use-user';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { decryptNote } from '@/lib/utils/crypt';
import MDEditor from '@uiw/react-md-editor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NotesAndData } from '@/lib/db/queries/note';
import { cn } from '@/lib/utils';
import { useNoteModal } from '@/contexts/modal-commands-context';
import { useProjects } from '@/hooks/use-projects';
import Link from 'next/link';
import ShareNoteButton from './share-note-button';

export default function NoteDisplay({ note, className }: { note?: Note.Note.Select; className?: string }) {
  const user = useUser().user;
  const noteModal = useNoteModal();
  const { mutate } = useSWRConfig();
  const { projects: allProjects } = useProjects({});

  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [decryptError, setDecryptError] = useState(false);

  // Track color mode so markdown preview matches app theme
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const el = document.documentElement;
    const read = () => (el.getAttribute('data-color-mode') === 'dark' ? 'dark' : 'light');
    setColorMode(read());
    const obs = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-color-mode') {
          setColorMode(read());
        }
      }
    });
    obs.observe(el, { attributes: true });
    return () => obs.disconnect();
  }, []);

  const projectTitle = note?.project_id ? allProjects.find(p => p.id === note.project_id)?.title : undefined;

  const handleDecrypt = () => {
    if (note && note.salt && note.iv && password && !decryptedContent) {
      decryptNote(note.content, password, note.salt, note.iv)
        .then(setDecryptedContent)
        .catch((e: unknown) => {
          setDecryptError(true);
          console.log(e);
          toast.error('Decryption failed. Wrong password or corrupted data.');
        });
    }
  };

  const cancelDecrypt = () => {
    setDecryptedContent(null);
    setPassword('');
    setDecryptError(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleDecrypt();
    }
  };

  const handleDelete = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (!note) return;

    if (!isDeleteDialogOpen) {
      setIsDeleteDialogOpen(true);
      return;
    }

    setIsDeleteDialogOpen(false);

    try {
      mutate(
        (key: unknown) => typeof key === 'string' && (key === '/api/note' || key.startsWith('/api/note?')),
        async (currentData: unknown): Promise<unknown> => {
          try {
            const data = currentData as NotesAndData;
            if (!data) return currentData;
            const currentNotes = data.notes || [];

            return {
              ...data,
              notes: currentNotes.filter((n: Note.Note.Select) => n.id !== note.id),
              totalCount: data.totalCount - 1,
              totalPages: Math.ceil((data.totalCount - 1) / data.limit)
            };
          } catch (error: unknown) {
            console.error('Error updating notes data:', error);
            return currentData;
          }
        },
        { revalidate: false }
      );

      toast.success(`"${note.title}" deleted successfully`);

      fetch(`/api/note`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.api_key}` },
        body: JSON.stringify({ id: note.id })
      });

      mutate(key => typeof key === 'string' && (key === '/api/note' || key.startsWith('/api/note?')));
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Error deleting note. Try again later.');
      mutate(key => typeof key === 'string' && (key === '/api/note' || key.startsWith('/api/note?')));
    }
  };

  return (
    <>
      <Card className={cn(`h-fit group/Note`, className)}>
        <CardHeader
          className={`flex flex-row justify-between items-center space-y-0 px-2 pt-2 pb-2 md:px-4 md:pt-2 md:pb-2 xl:px-2 xl:pt-2 ${
            note === undefined ? 'h-12 w-full bg-accent animate-pulse rounded-md' : 'cursor-pointer'
          }`}
          onClick={() => {
            setIsOpen(note ? !isOpen : false);
            if (note && note.salt && note.iv && decryptedContent && !isOpen) {
              cancelDecrypt();
            }
          }}
        >
          {note && (
            <div className="w-full">
              <CardTitle className={`w-full text-sm lg:text-base xl:text-base flex flex-row items-center gap-1`}>
                {note.salt && note.iv ? <Lock className="size-3 cursor-pointer" /> : null}
                {note.title}
              </CardTitle>
                <div className="flex w-full justify-between items-center">
                  {projectTitle ? (
                    <p className="text-xs lg:text-sm text-gray-500">{projectTitle}</p>
                  ) : (
                    <span />
                  )}
                  {note.created_at && (
                    <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                      {new Date(note.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  )}
                </div>
            </div>
          )}
          <div
            className={`${!note && 'hidden'} flex flex-row items-center duration-200 ${
              isOpen ? 'opacity-100' : 'lg:opacity-0'
            } ${note && 'lg:group-hover/Note:opacity-100'}`}
          >
            {note && isOpen ? (
              <ChevronUp className={`w-4 h-4`} onClick={() => setIsOpen(note ? !isOpen : false)} />
            ) : (
              <ChevronDown className={`w-4 h-4`} onClick={() => setIsOpen(note ? !isOpen : false)} />
            )}
          </div>
        </CardHeader>
        {note && isOpen && (
          <>
            <CardContent className="xl:pb-2 text-xs lg:text-sm break-words">
              {note.salt && note.iv ? (
                !decryptedContent ? (
                  <>
                    <Label required>Enter the password to decrypt the note</Label>
                    <Input
                      type="password"
                      placeholder="Enter password to decrypt"
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        setDecryptError(false);
                      }}
                      onKeyDown={handleKeyPress}
                    />
                    {decryptError && <p className="text-red-500 text-sm">Incorrect password.</p>}
                  </>
                ) : (
                  <div data-color-mode={colorMode} key={colorMode} className="max-w-full max-h-96">
                    <MDEditor.Markdown source={decryptedContent || ''} />
                  </div>
                )
              ) : (
                <div data-color-mode={colorMode} key={colorMode} className="max-w-full max-h-72 overflow-auto">
                  <MDEditor.Markdown source={note.content} />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-row justify-between space-x-2">
              <Link href={`/my/notes?note_id=${note.id}`} className="flex items-center hover:underline cursor-pointer">
                See more
              </Link>
              <div className="flex items-center justify-end space-x-2">
                {note.salt && note.iv && decryptedContent && (
                  <Lock className="w-4 h-4 cursor-pointer" onClick={cancelDecrypt} />
                )}
                {user && (
                  <ShareNoteButton
                    noteId={note.id}
                    noteTitle={note.title}
                    initialShareToken={note.share_token}
                    apiKey={user.api_key}
                    isEncrypted={!!(note.salt && note.iv)}
                  />
                )}
                <Trash className="w-4 h-4 cursor-pointer text-red-500" onClick={handleDelete} />
                {isCopied ? (
                  <ClipboardCheck className="w-4 h-4 cursor-pointer" />
                ) : (
                  ((note.salt && note.iv && decryptedContent) || !(note.salt && note.iv)) && (
                    <ClipboardPlus
                      className="w-4 h-4 cursor-pointer"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          note.salt && note.iv && decryptedContent ? decryptedContent : note.content
                        );
                        setIsCopied(true);
                        toast.success('Copied to clipboard');
                        setTimeout(() => {
                          setIsCopied(false);
                        }, 2000);
                      }}
                    />
                  )
                )}
                {((note.salt && note.iv && decryptedContent) || !(note.salt && note.iv)) && (
                  <PenIcon
                    className={cn('min-w-[16px] max-w-[16px] min-h-[24px] max-h-[24px] cursor-pointer', className)}
                    onClick={() => {
                      noteModal.setNote({
                        note: note,
                        password: password
                      });
                      noteModal.openModal();
                    }}
                  />
                )}
              </div>
            </CardFooter>
          </>
        )}
      </Card>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note?
              <br />
              <br />
              You will be able to find it back in your Trash (Settings &gt; Trash &gt; Notes).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>

            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
