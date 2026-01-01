"use client"

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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { HorizontalList, HorizontalListSkeleton } from "@/components/ui/horizontal-list"
import { useRelapseRecorderModal } from "@/contexts/modal-commands-context"
import { useAddictionsQuery } from "@/hooks/use-addiction-tracker"
import { Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { RelapseRecorder } from "./relapse-recorder"

export default function RelapseRecorderModal() {
    const { isOpen, closeModal } = useRelapseRecorderModal()
    const [selectedAddictionId, setSelectedAddictionId] = useState<number | null>(null)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const closeDialogRef = useRef<(() => void)>(() => { })

    // Fetch addictions
    const { addictions, isLoading: isLoadingAddictions } = useAddictionsQuery()

    // Auto-select first addiction when data loads
    useEffect(() => {
        if (isOpen && addictions.length > 0 && selectedAddictionId === null) {
            setSelectedAddictionId(addictions[0].id)
        }
    }, [isOpen, addictions, selectedAddictionId])

    // Reset when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedAddictionId(null)
        }
    }, [isOpen])

    const handleClose = () => {
        closeModal()
    }

    closeDialogRef.current = handleClose

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            handleClose()
        }
    }

    const currentAddiction = addictions.find(a => a.id === selectedAddictionId) ?? null

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-150" maxHeight="h-fit">
                    <DialogHeader>
                        <DialogTitle>Record Relapse</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Horizontal list for addiction selection */}
                        {isLoadingAddictions ? (
                            <HorizontalListSkeleton className="border rounded-md" itemCount={4} />
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

                                {/* Relapse recorder - shown when addiction is selected */}
                                {currentAddiction && (
                                    <RelapseRecorder
                                        addictionId={currentAddiction.id}
                                        onSuccess={handleClose}
                                        onCancel={handleClose}
                                    />
                                )}
                            </>
                        )}
                    </div>
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
