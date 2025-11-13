"use client"

import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog"
import {Button} from "@/components/ui/button"
import {ChevronDown} from "lucide-react"
import {useUser} from "@/hooks/use-user"
import {Note} from "@/lib/db/schema"
import {useEffect, useRef, useState} from "react"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import MDEditor from '@uiw/react-md-editor'
import {useSWRConfig} from "swr"
import {toast} from "sonner"
import {decryptNote, encryptNote} from "@/lib/utils/crypt"
import {Collapsible, CollapsibleContent, CollapsibleTrigger,} from "@/components/ui/collapsible"
import {useDebouncedCallback} from "use-debounce"
import SearchProjectsInput from "@/components/big/projects/search-projects-input"
import {NotesAndData, NoteWithProject} from "@/lib/db/queries/note"
import {updateUserDraftNote} from "@/lib/db/queries/user/user"
import {useNoteModal} from "@/contexts/modal-commands-context";
import {simplifiedProject} from "@/components/big/tasks/tasks-card";
import {useProjects} from "@/hooks/use-projects";

export default function NoteModal() {
    const user = useUser().user;

    const {
        isOpen,
        openModal,
        closeModal,
        note,
        password
    } = useNoteModal()
    const mode = (note !== undefined && note !== null) ? "edit" : "create"
    const {mutate} = useSWRConfig()
    const {projects: allProjects} = useProjects({})

    // State - use external control if provided
    const [formChanged, setFormChanged] = useState(false)
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
    const [decryptedContent, setDecryptedContent] = useState<string | null>(null)
    const [passwordValue, setPasswordValue] = useState<string>(password || "")

    const [noteTitle, setNoteTitle] = useState<string>(note ? note.title : (user?.note_draft_title || ""))
    const [inputNoteTitle, setInputNoteTitle] = useState<string>(note ? note.title : (user?.note_draft_title || ""))
    const [noteContent, setNoteContent] = useState<string>(note ? note.content : (user?.note_draft_content || ""))
    const [inputNoteContent, setInputNoteContent] = useState<string>(note ? note.content : (user?.note_draft_content || ""))
    const [project, setProject] = useState<simplifiedProject>(
        note && note.project_id
            ? { 
                title: note.project_title || allProjects.find(p => p.id === note.project_id)?.title || "", 
                id: note.project_id 
            }
            : user?.note_draft_project_title
                ? { title: user.note_draft_project_title, id: -1 }
                : { title: "", id: -1 }
    )

    // Track color mode from root `data-color-mode` so editor follows app theme
    const [colorMode, setColorMode] = useState<'light' | 'dark'>('light')
    useEffect(() => {
        if (typeof document === 'undefined') return
        const el = document.documentElement
        const read = () => (el.getAttribute('data-color-mode') === 'dark' ? 'dark' : 'light')
        setColorMode(read())
        const obs = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.type === 'attributes' && m.attributeName === 'data-color-mode') {
                    setColorMode(read())
                }
            }
        })
        obs.observe(el, { attributes: true })
        return () => obs.disconnect()
    }, [])

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
            note_project_title: project.title,
        }).then(() => {
            }
        ).catch((error) => {
            console.error("Error updating draft note:", error)
        })
    }, 1000)

    useEffect(() => {
        updateNoteTitle(inputNoteTitle)
    }, [inputNoteTitle, updateNoteTitle])

    useEffect(() => {
        updateNoteContent(inputNoteContent)
    }, [inputNoteContent, updateNoteContent])

    // Sync form state when modal opens or when incoming note/user draft changes
    useEffect(() => {
        if (!isOpen) return

        if (mode === "edit" && note) {
            const safeTitle = note.title || ""
            const safeContent = note.content || ""
            setInputNoteTitle(safeTitle)
            setNoteTitle(safeTitle)
            setInputNoteContent(safeContent)
            setNoteContent(safeContent)
            setProject(
                note.project_id
                    ? { 
                        title: note.project_title || allProjects.find(p => p.id === note.project_id)?.title || "", 
                        id: note.project_id 
                    }
                    : { title: "", id: -1 }
            )
            setPasswordValue(password || "")
            setDecryptedContent(null)
        } else if (mode === "create") {
            const draftTitle = user?.note_draft_title || ""
            const draftContent = user?.note_draft_content || ""
            setInputNoteTitle(draftTitle)
            setNoteTitle(draftTitle)
            setInputNoteContent(draftContent)
            setNoteContent(draftContent)
            setProject(user?.note_draft_project_title ? { title: user.note_draft_project_title, id: -1 } : { title: "", id: -1 })
            setPasswordValue(password || "")
            setDecryptedContent(null)
        }
    }, [isOpen, mode, note?.id, note?.title, note?.content, note?.project_id, note?.project_title, user?.note_draft_title, user?.note_draft_content, user?.note_draft_project_title, password, allProjects])

    useEffect(() => {
        if (mode === "create") {
            updateUserDraftNoteDebounced()
        }
    }, [mode, updateUserDraftNoteDebounced])

    useEffect(() => {
        const originalContent = (mode === "edit" && passwordValue && decryptedContent !== null)
            ? decryptedContent
            : (note?.content || "")
        
        // For project comparison, check both ID and title
        const originalProjectId = note?.project_id ? note.project_id : -1
        const originalProjectTitle = note?.project_title || ""
        const projectChanged = project.id !== originalProjectId || 
            (project.id === -1 && project.title !== originalProjectTitle)
        
        setFormChanged(
            mode === "edit"
                ? inputNoteTitle.trim() !== (note?.title || "").trim()
                    || inputNoteContent.trim() !== originalContent.trim()
                    || projectChanged
                    || passwordValue.trim() !== (password || "").trim()
                : inputNoteTitle.trim() !== "" && inputNoteContent.trim() !== ""
        )
    }, [inputNoteTitle, inputNoteContent, project, passwordValue, mode, note?.title, note?.content, note?.project_id, note?.project_title, password, decryptedContent])

    // Keep project title in sync when projects list loads/changes
    useEffect(() => {
        if (project.id > 0) {
            const found = allProjects.find(p => p.id === project.id)
            if (found && project.title !== found.title) {
                setProject({ title: found.title, id: project.id })
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allProjects, project.id])

    // Refs
    const isSubmittingRef = useRef(false)

    // Handlers
    const resetForm = () => {
        setNoteTitle("")
        setInputNoteTitle("")
        setNoteContent("")
        setInputNoteContent("")
        setProject({
            title: "",
            id: -1,
        })
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

    const close = () => {
        resetForm()
        closeModal()
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
                    id: mode === "edit" && note?.id ? note.id : -1,
                    user_id: user ? user.id : "00000000",
                    title: noteTitle,
                    content: encrypted.ciphertext,
                    project_id: project.id > 0 ? project.id : null,
                    salt: encrypted.salt,
                    iv: encrypted.iv,
                    created_at: mode === "create" ? new Date() : note?.created_at,
                    updated_at: new Date(),
                } as Note.Note.Select
            } else {
                noteData = {
                    id: mode === "edit" && note?.id ? note.id : -1,
                    user_id: user ? user.id : "00000000",
                    title: noteTitle,
                    content: noteContent,
                    project_id: project.id > 0 ? project.id : null,
                    created_at: mode === "create" ? new Date() : note?.created_at,
                    updated_at: new Date(),
                } as Note.Note.Select
            }

            toast.success(`Note ${mode === "edit" ? "updated" : "created"} successfully`)

            const response = await fetch("/api/note", {
                method: mode === "edit" ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user?.api_key}`
                },
                body: JSON.stringify({
                    noteData,
                    project
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to save note")
            }

            close()
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

    // Decrypt content when dialog opens or when password/note changes
    useEffect(() => {
        const pwd = passwordValue || password || ""
        if (!pwd) return
        debouncedDecrypt(pwd)
    }, [debouncedDecrypt, passwordValue, password, note?.id, note?.content, note?.salt, note?.iv, isOpen])

    // Effects

    return (
        <Dialog open={isOpen} onOpenChange={(newOpenState) => {
            if (isOpen && !newOpenState) {
                // Attempting to close
                close()
            } else {
                // Opening the dialog
                openModal()
            }
        }}>
            <DialogContent
                aria-describedby={undefined}
                maxHeight="max-h-120"
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
                                value={inputNoteTitle}
                                autoFocus
                                onChange={(e) => {
                                    setInputNoteTitle(e.target.value)
                                }}
                                className="text-sm lg:text-base"
                            />
                        </div>
                        <div>
                            <Label htmlFor="content" required>Content</Label>
                            <div data-color-mode={colorMode} className="prose max-w-full">
                                <MDEditor
                                    key={colorMode}
                                    id="content"
                                    value={inputNoteContent}
                                    onChange={(val) => setInputNoteContent(val || '')}
                                    textareaProps={{ placeholder: 'Write your note in Markdown...' }}
                                />
                            </div>
                        </div>
                        <SearchProjectsInput
                            project={project}
                            setProject={setProject}
                            defaultValue={project.title}
                        />
                        <Collapsible className="w-full" open={showAdvancedOptions}
                                     onOpenChange={setShowAdvancedOptions}>
                            <CollapsibleTrigger className="flex text-sm font-medium text-muted-foreground mb-4">
                                Advanced Options
                                <ChevronDown
                                    className={`ml-2 h-4 w-4 duration-300 ${showAdvancedOptions && "rotate-180"}`}/>
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
        </Dialog>
    )
}
