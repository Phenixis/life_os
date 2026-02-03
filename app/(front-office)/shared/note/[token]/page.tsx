'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MDEditor from '@uiw/react-md-editor';
import { FileText, Lock } from 'lucide-react';
import { NoteWithProject } from '@/lib/db/queries/note';

export default function SharedNotePage() {
    const params = useParams();
    const token = params.token as string;
    const [note, setNote] = useState<NoteWithProject | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    useEffect(() => {
        if (!token) return;

        fetch(`/api/note/shared/${token}`)
            .then(async (res) => {
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Failed to load note');
                }
                return res.json();
            })
            .then((data) => {
                setNote(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [token]);

    if (!note) {
        return null;
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-4xl">
                    <CardContent className="p-8 text-center" fullPadding>
                        <div className="animate-pulse">
                            <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                            <p className="text-muted-foreground">Loading note...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-4xl" >
                    <CardContent className="p-8 text-center">
                        {error.includes('Encrypted') ? (
                            <>
                                <Lock className="h-16 w-16 mx-auto mb-4 text-amber-500" />
                                <h1 className="text-2xl font-bold mb-2">Encrypted Note</h1>
                                <p className="text-muted-foreground">
                                    This note is encrypted and cannot be shared publicly.
                                </p>
                            </>
                        ) : (
                            <>
                                <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                <h1 className="text-2xl font-bold mb-2">Note Not Found</h1>
                                <p className="text-muted-foreground">
                                    {error || 'This note does not exist or is no longer shared.'}
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <Card className="w-full max-w-4xl mx-auto">
                <CardHeader className="border-b">
                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            <CardTitle className="text-2xl md:text-3xl mb-2">
                                {note.title}
                            </CardTitle>
                            {note.project_title && (
                                <p className="text-sm text-muted-foreground">
                                    Project: {note.project_title}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                                Last updated: {new Date(note.updated_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 md:p-8">
                    <div
                        data-color-mode={colorMode}
                        key={colorMode}
                        className="max-w-none prose dark:prose-invert"
                    >
                        <MDEditor.Markdown source={note.content} className="!bg-transparent" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
