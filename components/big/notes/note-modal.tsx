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
import { useIsMobile } from "@/hooks/use-mobile"
import {Checkbox} from "@/components/ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

// Local storage key for note modal content
const NOTE_MODAL_STORAGE_KEY = 'note_modal_draft'

export default function NoteModal() {
    const user = useUser().user;
    const isMobile = useIsMobile();

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
    const [keepEditing, setKeepEditing] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [isTitleDirty, setIsTitleDirty] = useState(false)
    // Track the last saved state for comparison when keep editing is enabled
    const [lastSavedTitle, setLastSavedTitle] = useState<string>("")
    const [lastSavedContent, setLastSavedContent] = useState<string>("")
    const [lastSavedProjectId, setLastSavedProjectId] = useState<number>(-1)

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

    // Auto-generate title from content when title is not dirty
    useEffect(() => {
        if (!isTitleDirty && inputNoteContent) {
            // Remove markdown syntax for a cleaner title
            const cleanContent = inputNoteContent.replace(/[#*_~`]/g, '').trim()
            let autoTitle = cleanContent.substring(0, 27)
            if (cleanContent.length > 28) {
                autoTitle += '...'
            }
            if (autoTitle && autoTitle !== inputNoteTitle) {
                setInputNoteTitle(autoTitle)
            }
        }
    }, [inputNoteContent, isTitleDirty, inputNoteTitle])

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
            setIsTitleDirty(true) // In edit mode, title is from database so it's considered "dirty"
            // Set last saved values for edit mode
            setLastSavedTitle(safeTitle)
            setLastSavedContent(safeContent)
            setLastSavedProjectId(note.project_id || -1)
        } else if (mode === "create") {
            // Try to load from local storage first
            let loadedFromLocalStorage = false
            if (typeof window !== 'undefined') {
                const savedData = window.localStorage.getItem(NOTE_MODAL_STORAGE_KEY)
                if (savedData) {
                    try {
                        const parsed = JSON.parse(savedData)
                        // Only restore if it's recent (within last 24 hours) and was create mode
                        if (parsed.mode === "create" && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
                            setInputNoteTitle(parsed.title || "")
                            setNoteTitle(parsed.title || "")
                            setInputNoteContent(parsed.content || "")
                            setNoteContent(parsed.content || "")
                            if (parsed.projectTitle || (parsed.projectId != null && parsed.projectId !== -1)) {
                                setProject({ title: parsed.projectTitle || "", id: parsed.projectId || -1 })
                            } else {
                                setProject({ title: "", id: -1 })
                            }
                            // If there's a saved title, consider it dirty
                            setIsTitleDirty(!!parsed.title)
                            loadedFromLocalStorage = true
                        }
                    } catch (e) {
                        console.error("Failed to parse local storage data:", e)
                    }
                }
            }
            
            // If not loaded from local storage, use database draft
            if (!loadedFromLocalStorage) {
                const draftTitle = user?.note_draft_title || ""
                const draftContent = user?.note_draft_content || ""
                setInputNoteTitle(draftTitle)
                setNoteTitle(draftTitle)
                setInputNoteContent(draftContent)
                setNoteContent(draftContent)
                setProject(user?.note_draft_project_title ? { title: user.note_draft_project_title, id: -1 } : { title: "", id: -1 })
                // If there's a draft title, consider it dirty
                setIsTitleDirty(!!draftTitle)
            }
            setPasswordValue(password || "")
            setDecryptedContent(null)
            // Reset last saved values for create mode
            setLastSavedTitle("")
            setLastSavedContent("")
            setLastSavedProjectId(-1)
        }
    }, [isOpen, mode, note?.id, note?.title, note?.content, note?.project_id, note?.project_title, user?.note_draft_title, user?.note_draft_content, user?.note_draft_project_title, password, allProjects])

    useEffect(() => {
        if (mode === "create") {
            updateUserDraftNoteDebounced()
        }
    }, [mode, updateUserDraftNoteDebounced])

    // Save to local storage whenever content changes
    useEffect(() => {
        if (typeof window === 'undefined') return
        
        // Save to local storage for create mode or when editing (if content has changed)
        // Note: We only restore from local storage for create mode, not edit mode.
        // For edit mode, the authoritative source is always the database.
        // Use inputNoteTitle/inputNoteContent (not debounced versions) for immediate updates
        if (isOpen && (mode === "create" || formChanged)) {
            const draftData = {
                title: inputNoteTitle,
                content: inputNoteContent,
                projectTitle: project.title,
                projectId: project.id,
                mode,
                noteId: note?.id,
                timestamp: Date.now()
            }
            window.localStorage.setItem(NOTE_MODAL_STORAGE_KEY, JSON.stringify(draftData))
        }
    }, [inputNoteTitle, inputNoteContent, project, mode, note?.id, isOpen, formChanged])

    useEffect(() => {
        // Use lastSaved values if they exist (when keepEditing was used), otherwise use original note
        const compareTitle = lastSavedTitle || (note?.title || "")
        const compareContent = lastSavedContent || (mode === "edit" && passwordValue && decryptedContent !== null ? decryptedContent : (note?.content || ""))
        const compareProjectId = lastSavedProjectId !== -1 ? lastSavedProjectId : (note?.project_id || -1)
        
        // For project comparison, check both ID and title
        const originalProjectTitle = note?.project_title || ""
        const projectChanged = project.id !== compareProjectId || 
            (project.id === -1 && project.title !== originalProjectTitle)
        
        setFormChanged(
            mode === "edit"
                ? inputNoteTitle.trim() !== compareTitle.trim()
                    || inputNoteContent.trim() !== compareContent.trim()
                    || projectChanged
                    || passwordValue.trim() !== (password || "").trim()
                : inputNoteTitle.trim() !== "" && inputNoteContent.trim() !== ""
        )
    }, [inputNoteTitle, inputNoteContent, project, passwordValue, mode, note?.title, note?.content, note?.project_id, note?.project_title, password, decryptedContent, lastSavedTitle, lastSavedContent, lastSavedProjectId])

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
    const closeDialogRef = useRef<() => void>(() => {})

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
        setIsTitleDirty(false)

        // Clear local storage
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem(NOTE_MODAL_STORAGE_KEY)
        }

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

    // Handle dialog close attempt
    const handleCloseAttempt = () => {
        if (formChanged) {
            // Store the close function for later use
            closeDialogRef.current = () => close()
            // Show confirmation dialog
            setShowConfirmDialog(true)
        } else {
            // No changes, close immediately
            close()
        }
    }

    // Handle confirmation dialog result
    const handleConfirmDiscard = () => {
        // Close confirmation dialog
        setShowConfirmDialog(false)
        // Execute the stored close function
        setTimeout(() => {
            closeDialogRef.current()
        }, 100)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (isSubmittingRef.current) return
        isSubmittingRef.current = true
        setIsSubmitting(true)

        try {
            if (!noteTitle.trim()) {
                isSubmittingRef.current = false
                setIsSubmitting(false)
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

            toast.success(`Note ${mode === "edit" ? "updated" : "created"} successfully`)

            // Clear local storage after successful save
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(NOTE_MODAL_STORAGE_KEY)
            }

            if (!keepEditing) {
                close()
            } else {
                // If keepEditing is true, update the lastSaved values so form change detection works correctly
                setLastSavedTitle(noteTitle)
                setLastSavedContent(noteContent)
                setLastSavedProjectId(project.id)
            }
            
            mutate((key) => typeof key === "string" && (key === "/api/note" || key.startsWith("/api/note?")))
            isSubmittingRef.current = false
            setIsSubmitting(false)
        } catch (error) {
            console.error("Erreur lors de la soumission:", error)
            toast.error(`Failed to ${mode === "edit" ? "update" : "create"} note. Try again later.`)
            mutate((key) => typeof key === "string" && (key === "/api/note" || key.startsWith("/api/note?")))
            isSubmittingRef.current = false
            setIsSubmitting(false)
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

    // Warn before leaving page with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isOpen && formChanged) {
                e.preventDefault()
                // Chrome requires returnValue to be set
                e.returnValue = ''
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [isOpen, formChanged])

    // Effects

    return (
        <>
        <Dialog open={isOpen} onOpenChange={(newOpenState) => {
            if (isOpen && !newOpenState) {
                // Attempting to close
                handleCloseAttempt()
            } else {
                // Opening the dialog
                openModal()
            }
        }}>
            <DialogContent
                aria-describedby={undefined}
                maxHeight="max-h-155"
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
                                    setIsTitleDirty(true)
                                }}
                                disabled={isSubmitting}
                                className="text-sm lg:text-base"
                            />
                        </div>
                        <div className="w-full">
                            <Label htmlFor="content" required>Content</Label>
                            <div data-color-mode={colorMode} className="max-w-full">
                                <MDEditor
                                    key={colorMode}
                                    id="content"
                                    value={inputNoteContent}
                                    onChange={(val) => !isSubmitting && setInputNoteContent(val || '')}
                                    textareaProps={{ placeholder: 'Write your note in Markdown...', disabled: isSubmitting }}
                                    preview={isMobile ? 'edit' : 'live'}
                                    className="!text-black"
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

                    <DialogFooter className="w-full sm:justify-between">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="keep-editing"
                                checked={keepEditing}
                                onCheckedChange={() => setKeepEditing(!keepEditing)}
                                disabled={isSubmitting}
                            />
                            <label htmlFor="keep-editing" className={`text-sm ${isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                Keep editing the note?
                            </label>
                        </div>
                        <Button type="submit" disabled={!formChanged || isSubmitting}>
                            {isSubmitting ? "Saving..." : (mode === "create" ? "Create" : "Save")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        {/* Confirmation dialog for unsaved changes */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                    <AlertDialogDescription>
                        You have unsaved changes. Are you sure you want to close without saving?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmDiscard}>Discard</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
    )
}
