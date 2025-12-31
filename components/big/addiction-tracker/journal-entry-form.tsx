"use client"

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useCreateEntry } from "@/hooks/use-addiction-tracker";

interface JournalEntryFormProps {
    addictionId: number;
    onSuccess?: () => void;
}

export function JournalEntryForm({ addictionId, onSuccess }: JournalEntryFormProps) {
    const [content, setContent] = useState("");

    const createEntry = useCreateEntry();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!content.trim()) return;

        createEntry.mutate(
            { addictionId, content },
            {
                onSuccess: () => {
                    setContent("");
                    onSuccess?.();
                },
            }
        );
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full pb-4 border-b bg-background dark:bg-black z-10 sticky -top-4 lg:top-0 pt-4"
        >
            <header className="flex items-center justify-between">
                <h3 className="text-lg font-medium mb-2 text-center lg:text-left">Journal</h3>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="mb-2" 
                    type="submit"
                    disabled={createEntry.isPending || !content.trim()}
                >
                    {createEntry.isPending ? "Adding..." : "Add Entry"}
                </Button>
            </header>
            <Textarea
                id="journal-entry"
                placeholder="Write about your thoughts, feelings, and experiences related to your addiction..."
                className="w-full resize-none"
                rows={2}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={createEntry.isPending}
            />
        </form>
    );
}
