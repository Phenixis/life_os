"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { HorizontalList } from "@/components/ui/horizontal-list"
import { useEntryLoggerModal } from "@/contexts/modal-commands-context"
import { useState, useEffect, useRef } from "react"
import { useAddictionsQuery, useCreateEntry } from "@/hooks/use-addiction-tracker"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function EntryLoggerModal() {
    const { isOpen, closeModal } = useEntryLoggerModal()
    const [selectedAddictionId, setSelectedAddictionId] = useState<number | null>(null)
    const [content, setContent] = useState("")
    const [formChanged, setFormChanged] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const closeDialogRef = useRef<(() => void)>(() => {})

    // Fetch addictions
    const { addictions, isLoading: isLoadingAddictions } = useAddictionsQuery()
    const createEntry = useCreateEntry()

    // Auto-select first addiction when data loads
    useEffect(() => {
        if (isOpen && addictions.length > 0 && selectedAddictionId === null) {
            setSelectedAddictionId(addictions[0].id)
        }
    }, [isOpen, addictions, selectedAddictionId])

    // Track form changes
    useEffect(() => {
        if (isOpen) {
            setFormChanged(content.trim() !== "")
        }
    }, [content, isOpen])

    // Reset when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedAddictionId(null)
            setContent("")
            setFormChanged(false)
        }
    }, [isOpen])

    const handleClose = () => {
        if (formChanged && !createEntry.isPending) {
            setShowConfirmDialog(true)
        } else {
            closeModal()
        }
    }

    const handleForceClose = () => {
        setShowConfirmDialog(false)
        closeModal()
    }

    closeDialogRef.current = handleForceClose

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            handleClose()
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!selectedAddictionId) {
            toast.error("Please select an addiction")
            return
        }

        if (!content.trim()) {
            toast.error("Please enter some content")
            return
        }

        createEntry.mutate(
            { addictionId: selectedAddictionId, content: content.trim() },
            {
                onSuccess: () => {
                    toast.success("Entry logged successfully")
                    closeModal()
                },
                onError: () => {
                    toast.error("Failed to log entry")
                }
            }
        )
    }

    const currentAddiction = addictions.find(a => a.id === selectedAddictionId) ?? null

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-150" maxHeight="h-fit">
                    <DialogHeader>
                        <DialogTitle>Log Journal Entry</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Horizontal list for addiction selection */}
                        {isLoadingAddictions ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                            </div>
                        ) : addictions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No addictions found. Create one first in the Addiction Tracker.
                            </div>
                        ) : (
                            <>
                                <HorizontalList
                                    itemsName={addictions.map(a => a.title)}
                                    onClick={(name) => {
                                        const addiction = addictions.find(a => a.title === name)
                                        if (addiction) {
                                            setSelectedAddictionId(addiction.id)
                                        }
                                    }}
                                    activeItemName={currentAddiction?.title || ""}
                                    className="border rounded-md"
                                />

                                {/* Journal entry form - shown when addiction is selected */}
                                {currentAddiction && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Journal Entry <span className="text-red-500">*</span>
                                        </label>
                                        <Textarea
                                            placeholder="Write about your thoughts, feelings, and experiences related to your addiction..."
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            rows={3}
                                            className="resize-none"
                                            disabled={createEntry.isPending}
                                            autoFocus
                                        />
                                    </div>
                                )}

                                {currentAddiction && (
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="flex-1"
                                            onClick={handleClose}
                                            disabled={createEntry.isPending}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            size="sm"
                                            className="flex-1"
                                            disabled={createEntry.isPending || !content.trim()}
                                        >
                                            {createEntry.isPending ? "Logging..." : "Log Entry"}
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </form>
                </DialogContent>
            </Dialog>

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
                        <AlertDialogAction onClick={closeDialogRef.current}>Discard</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
