"use client"

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus, PenIcon, ChevronDown } from "lucide-react"
import { useUser } from "@/hooks/use-user"
import { Note } from "@/lib/db/schema"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useSWRConfig } from "swr"
import { toast } from "sonner"
import { encryptNote, decryptNote } from "@/lib/utils/crypt"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useDebouncedCallback } from "use-debounce"
import SearchProjectsInput from "@/components/big/projects/search-projects-input"
import { NotesAndData } from "@/lib/db/queries/note"
import { updateUserDraftNote } from "@/lib/db/queries/user/user"

export default function NoteModal({
    className,
    note,
    password,
    children,
    isOpen,
    onOpenChange,
}: {
    className?: string
    note?: Note.Note.Select
    password?: string
    children?: React.ReactNode
    isOpen?: boolean
    onOpenChange?: (open: boolean) => void
}) {
    const user = useUser().user;
    const mode = note ? "edit" : "create"
    const { mutate } = useSWRConfig()

    // State - use external control if provided
    const [internalOpen, setInternalOpen] = useState(false)
    const open = isOpen !== undefined ? isOpen : internalOpen
    const setOpen = onOpenChange || setInternalOpen
    const [formChanged, setFormChanged] = useState(false)
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
    const [decryptedContent, setDecryptedContent] = useState<string | null>(null)
    const [passwordValue, setPasswordValue] = useState<string>(password || "")

    const [noteTitle, setNoteTitle] = useState<string>(note ? (note.title ? note.title : "") : user?.note_draft_title || "")
    const [inputNoteTitle, setInputNoteTitle] = useState<string>(note ? (note.title ? note.title : "") : user?.note_draft_title || "")
    const [noteContent, setNoteContent] = useState<string>(note ? (note.content ? note.content : "") : user?.note_draft_content || "")
    const [inputNoteContent, setInputNoteContent] = useState<string>(note ? (note.content ? note.content : "") : user?.note_draft_content || "")
    const [project, setProject] = useState<string>(note ? (note.project_title ? note.project_title : "") : user?.note_draft_project_title || "")

    const updateNoteTitle = useDebouncedCallback((value: string) => {
        setNoteTitle(value)
    }, 200)

    const updateNoteContent = useDebouncedCallback((value: string) => {
        setNoteContent(value)
    }, 200)

    const updateUserDraftNoteDebounced = useDebouncedCallback(() => {
        if (!user || mode == "edit") return

        updateUserDraftNote({
            userId: user?.id,
            note_title: noteTitle,
            note_content: noteContent,
            note_project_title: project,
        }).then(() => {
        }
        ).catch((error) => {
            console.error("Error updating draft note:", error)
        })
    }, 1000)

    useEffect(() => {
        updateNoteTitle(inputNoteTitle)
    }, [inputNoteTitle])

    useEffect(() => {
        updateNoteContent(inputNoteContent)
    }, [inputNoteContent])


    useEffect(() => {
        updateUserDraftNoteDebounced()
    }, [noteContent, noteTitle, project])

    useEffect(() => {
        console.log("[", inputNoteTitle.trim(), "] [", note?.title.trim(), "]", "[", inputNoteContent.trim(), "] [", note?.content.trim(), "]", "[", project.trim(), "] [", note?.project_title?.trim(), "]", "[", passwordValue.trim(), "] [", password?.trim(), "]")
        setFormChanged(
            mode === "edit" ?
                inputNoteTitle.trim() !== note?.title.trim() || inputNoteContent.trim() !== note?.content.trim() || project.trim() !== (note?.project_title ? note.project_title.trim() : "") || passwordValue.trim() !== password?.trim() :
                inputNoteTitle.trim() !== "" && inputNoteContent.trim() !== ""
        )
    }, [inputNoteTitle, inputNoteContent, project, passwordValue])

    // Refs
    const isSubmittingRef = useRef(false)

    // Handlers
    const resetForm = () => {
        setNoteTitle("")
        setInputNoteTitle("")
        setNoteContent("")
        setInputNoteContent("")
        setProject("")
        setPasswordValue("")
        setDecryptedContent(null)
        setFormChanged(false)
        setShowAdvancedOptions(false)

        updateUserDraftNote({
            userId: user?.id || "-1",
            note_title: "",
            note_content: "",
            note_project_title: "",
        }).then(() => {
        }).catch((error: unknown) => {
            console.error("Error resetting draft note:", error)
        })
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (isSubmittingRef.current) return
        isSubmittingRef.current = true

        try {
            if (!noteTitle.trim()) {
                isSubmittingRef.current = false
                return
            }

            let noteData: Note.Note.Select

            // 🔐 Encrypt the note content
            if (passwordValue) {
                const encrypted = await encryptNote(noteContent, passwordValue)

                noteData = {
                    id: mode === "edit" ? note?.id : -1,
                    user_id: user?.id,
                    title: noteTitle,
                    content: encrypted.ciphertext,
                    project_title: project,
                    salt: encrypted.salt,
                    iv: encrypted.iv,
                    created_at: mode === "create" ? new Date() : note?.created_at,
                    updated_at: new Date(),
                } as Note.Note.Select
            } else {
                noteData = {
                    id: mode === "edit" ? note?.id : -1,
                    user_id: user?.id,
                    title: noteTitle,
                    content: noteContent,
                    project_title: project,
                    created_at: mode === "create" ? new Date() : note?.created_at,
                    updated_at: new Date(),
                } as Note.Note.Select
            }

            resetForm()
            setOpen(false)

            mutate(
                (key: unknown) => typeof key === "string" && (key === "/api/note" || key.startsWith("/api/note?")),
                async (currentData: unknown): Promise<NotesAndData | unknown> => {
                    try {
                        const data = currentData as NotesAndData
                        if (!data) return currentData
                        const currentNotes = data.notes || []

                        let updatedData: Note.Note.Select[]
                        if (mode === "edit") {
                            updatedData = currentNotes.map((item: Note.Note.Select) => (item.id === note?.id ? noteData : item))
                        } else {
                            updatedData = [...currentNotes, noteData]
                        }

                        return {
                            ...data,
                            notes: updatedData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
                        }
                    } catch (error: unknown) {
                        console.error("Error updating local data:", error)
                        return currentData
                    }
                },
                { revalidate: false },
            )

            toast.success(`Note ${mode === "edit" ? "updated" : "created"} successfully`)

            await fetch("/api/note", {
                method: mode === "edit" ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user?.api_key}`
                },
                body: JSON.stringify(noteData),
            })

            mutate((key) => typeof key === "string" && (key === "/api/note" || key.startsWith("/api/note?")))
            isSubmittingRef.current = false
        } catch (error) {
            console.error("Erreur lors de la soumission:", error)
            toast.error(`Failed to ${mode === "edit" ? "update" : "create"} note. Try again later.`)
            mutate((key) => typeof key === "string" && (key === "/api/note" || key.startsWith("/api/note?")))
            isSubmittingRef.current = false
        }
    }

    const debouncedDecrypt = useDebouncedCallback((pwd: string) => {
        if (mode === "edit" && note?.salt && note?.iv && pwd) {
            // Decrypt content when password is available and note exists
            decryptNote(note.content, pwd, note.salt, note.iv)
                .then((decryptedContent) => {
                    setDecryptedContent(decryptedContent)
                    setInputNoteContent(decryptedContent)
                    setNoteContent(decryptedContent)
                })
                .catch((err) => {
                    console.error("Decryption failed", err)
                    toast.error("Failed to decrypt note content.")
                })
        }
    }, 200)

    // Decrypt content when dialog opens
    useEffect(() => {
        debouncedDecrypt(password || "")
    }, [password])

    // Effects

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children ? children : (
                    mode === "create" ? (
                        <Button variant="outline" size="icon" className={cn("whitespace-nowrap transition-transform duration-300 border-none", className)}>
                            <Plus size={24} />
                        </Button>
                    ) : (
                        <PenIcon className={cn("min-w-[16px] max-w-[16px] min-h-[24px] max-h-[24px] cursor-pointer", className)} />
                    )
                )}
            </DialogTrigger>
            <DialogContent
                aria-describedby={undefined}
                maxHeight="max-h-115"
            >
                <form id="note-form" onSubmit={handleSubmit} className="flex flex-col gap-4 justify-between">
                    <main className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>
                                {mode === "create" ? "Create Note" : "Edit Note"}
                            </DialogTitle>
                        </DialogHeader>

                        <div>
                            <Label htmlFor="title" required>Title</Label>
                            <Input
                                type="text"
                                id="title"
                                name="title"
                                defaultValue={noteTitle}
                                autoFocus
                                onChange={(e) => {
                                    setInputNoteTitle(e.target.value)
                                }}
                                className="text-sm lg:text-base"
                            />
                        </div>
                        <div>
                            <Label htmlFor="content" required>Content</Label>
                            <Textarea
                                id="content"
                                name="content"
                                className="text-xs lg:text-sm"
                                defaultValue={decryptedContent || noteContent}
                                onChange={(e) => {
                                    setInputNoteContent(e.target.value)
                                }}
                            />
                        </div>
                        <SearchProjectsInput
                            project={project}
                            setProject={setProject}
                            defaultValue={project}
                        />
                        <Collapsible className="w-full" open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
                            <CollapsibleTrigger className="flex text-sm font-medium text-muted-foreground mb-4">
                                Advanced Options
                                <ChevronDown className={`ml-2 h-4 w-4 duration-300 ${showAdvancedOptions && "rotate-180"}`} />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-4">
                                <div>
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        type="text"
                                        id="password"
                                        name="password"
                                        value={passwordValue}
                                        onChange={(e) => setPasswordValue(e.target.value)}
                                    />
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    </main>

                    <DialogFooter>
                        <Button type="submit" disabled={!formChanged}>
                            {mode === "create" ? "Create" : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    )
}
