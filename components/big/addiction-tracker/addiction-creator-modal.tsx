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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAddictionCreatorModal } from "@/contexts/modal-commands-context"
import { useState, useEffect, useRef } from "react"
import { useCreateAddiction } from "@/hooks/use-addiction-tracker"
import { toast } from "sonner"

export default function AddictionCreatorModal() {
    const { isOpen, closeModal } = useAddictionCreatorModal()
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [formChanged, setFormChanged] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const closeDialogRef = useRef<(() => void)>(() => {})

    const createAddiction = useCreateAddiction()

    // Track form changes
    useEffect(() => {
        if (isOpen) {
            const hasChanges = name.trim() !== "" || description.trim() !== ""
            setFormChanged(hasChanges)
        }
    }, [name, description, isOpen])

    // Reset when modal closes
    useEffect(() => {
        if (!isOpen) {
            setName("")
            setDescription("")
            setFormChanged(false)
        }
    }, [isOpen])

    const handleClose = () => {
        if (formChanged && !createAddiction.isPending) {
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
        
        if (!name.trim()) {
            toast.error("Please enter an addiction name")
            return
        }

        createAddiction.mutate(
            { title: name.trim(), description: description.trim() || undefined },
            {
                onSuccess: () => {
                    toast.success("Addiction created successfully")
                    closeModal()
                },
                onError: () => {
                    toast.error("Failed to create addiction")
                }
            }
        )
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-150" maxHeight="h-fit">
                    <DialogHeader>
                        <DialogTitle>Create Addiction</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Addiction Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                placeholder="e.g., Smoking, Social Media, Sugar"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                                disabled={createAddiction.isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Description (optional)
                            </label>
                            <Textarea
                                placeholder="What is your goal? Why are you tracking this?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="resize-none"
                                disabled={createAddiction.isPending}
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={handleClose}
                                disabled={createAddiction.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="flex-1"
                                disabled={createAddiction.isPending || !name.trim()}
                            >
                                {createAddiction.isPending ? "Creating..." : "Create"}
                            </Button>
                        </div>
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
