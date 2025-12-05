'use client';

import { Note } from '@/lib/db/schema';
import { NoteWithProject } from '@/lib/db/queries/note';
import { useState, useEffect } from 'react';
import { Lock, ClipboardCheck, ClipboardPlus, PenIcon, Trash, FileText } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import ShareNoteButton from './share-note-button';

interface NoteViewerProps {
    note: NoteWithProject | null;
    className?: string;
}

export default function NoteViewer({ note, className }: NoteViewerProps) {
    const user = useUser().user;
    const noteModal = useNoteModal();
    const { mutate } = useSWRConfig();

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
        const obs = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.type === 'attributes' && m.attributeName === 'data-color-mode') {
                    setColorMode(read());
                }
            }
        });
        obs.observe(el, { attributes: true });
        return () => obs.disconnect();
    }, []);

    // Reset decryption state when note changes
    useEffect(() => {
        setDecryptedContent(null);
        setPassword('');
        setDecryptError(false);
        setIsCopied(false);
    }, [note?.id, note?.content, note?.title]);

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

    const handleCopy = () => {
        if (!note) return;
        navigator.clipboard.writeText(
            note.salt && note.iv && decryptedContent ? decryptedContent : note.content
        );
        setIsCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => {
            setIsCopied(false);
        }, 2000);
    };

    const handleEdit = () => {
        if (!note) return;
        noteModal.setNote({
            note: note,
            password: password
        });
        noteModal.openModal();
    };

    if (!note) {
        return (
            <div className={cn('flex items-center justify-center h-full', className)}>
                <div className="text-center text-muted-foreground">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">Select a note to view</p>
                </div>
            </div>
        );
    }

    const isEncrypted = !!(note.salt && note.iv);
    const canShowContent = !isEncrypted || decryptedContent;

    return (
        <>
            <div className={cn('flex flex-col h-full', className)}>
                {/* Header */}
                <div className="border-b p-6 flex-shrink-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                {isEncrypted && (
                                    <Lock className="h-4 w-4 text-amber-500" />
                                )}
                                <h1 className="text-2xl font-bold">{note.title}</h1>
                            </div>
                            {note.project_title && (
                                <p className="text-sm text-muted-foreground">
                                    Project: {note.project_title}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                                Last updated: {new Date(note.updated_at).toLocaleDateString()}
                            </p>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                            {isEncrypted && decryptedContent && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={cancelDecrypt}
                                    title="Lock note"
                                >
                                    <Lock className="h-4 w-4" />
                                </Button>
                            )}
                            {canShowContent && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleCopy}
                                        title="Copy to clipboard"
                                    >
                                        {isCopied ? (
                                            <ClipboardCheck className="h-4 w-4" />
                                        ) : (
                                            <ClipboardPlus className="h-4 w-4" />
                                        )}
                                    </Button>
                                    {user && (
                                        <ShareNoteButton
                                            noteId={note.id}
                                            noteTitle={note.title}
                                            initialShareToken={note.share_token}
                                            apiKey={user.api_key}
                                            isEncrypted={isEncrypted}
                                            variant="icon"
                                        />
                                    )}
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleEdit}
                                        title="Edit note"
                                    >
                                        <PenIcon className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleDelete}
                                title="Delete note"
                                className="text-red-500 hover:text-red-600"
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1">
                    <div className="p-6">
                        {isEncrypted && !decryptedContent ? (
                            <Card className="p-6 max-w-md mx-auto">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-amber-500">
                                        <Lock className="h-5 w-5" />
                                        <h3 className="font-semibold">Encrypted Note</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <Label required>Enter password to decrypt</Label>
                                        <Input
                                            type="password"
                                            placeholder="Enter password"
                                            value={password}
                                            onChange={e => {
                                                setPassword(e.target.value);
                                                setDecryptError(false);
                                            }}
                                            onKeyDown={handleKeyPress}
                                        />
                                        {decryptError && (
                                            <p className="text-red-500 text-sm">
                                                Incorrect password. Please try again.
                                            </p>
                                        )}
                                        <Button
                                            onClick={handleDecrypt}
                                            className="w-full"
                                            disabled={!password}
                                        >
                                            Decrypt
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ) : (
                            <div
                                data-color-mode={colorMode}
                                key={colorMode}
                                className="max-w-none"
                            >
                                <MDEditor.Markdown
                                    source={isEncrypted && decryptedContent ? decryptedContent : note.content}
                                    className="!bg-transparent"
                                />
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent maxHeight='max-h-55'>
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
