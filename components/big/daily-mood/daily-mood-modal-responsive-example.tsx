"use client"

/**
 * Example: DailyMoodModal converted to use ResponsiveModal
 * 
 * This is a demonstration of how to migrate an existing modal to use ResponsiveModal.
 * The only changes needed are the import statements - everything else remains the same!
 */

import {
    ResponsiveModal as Dialog,
    ResponsiveModalContent as DialogContent,
    ResponsiveModalFooter as DialogFooter,
    ResponsiveModalHeader as DialogHeader,
    ResponsiveModalTitle as DialogTitle,
} from "@/components/ui/responsive-modal"
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
import { Angry, Frown, Laugh, Meh, Smile, SmilePlus } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useUser } from "@/hooks/use-user"
import { useDailyMoods } from "@/hooks/use-daily-moods"
import { useSWRConfig } from "swr"
import { DailyMood } from "@/lib/db/schema"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useDailyMoodModal } from "@/contexts/modal-commands-context"

export default function DailyMoodModalResponsive() {
    const { user } = useUser()
    const { isOpen, openModal, closeModal, date } = useDailyMoodModal()

    const [selectedMood, setSelectedMood] = useState<number | null>(null)
    const [comment, setComment] = useState("")
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [formChanged, setFormChanged] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)

    // Use the passed date or fallback to today
    const targetDate = date || new Date()
    const normalizedDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0)
    // Get the last millisecond of the current day
    const nextDay = new Date(normalizedDate.getFullYear(), normalizedDate.getMonth(), normalizedDate.getDate(), 23, 59, 59, 999)
    const { mutate } = useSWRConfig()

    const { data: dailyMoods, mutate: mutateDailyMoods } = useDailyMoods({
        startDate: normalizedDate,
        endDate: nextDay,
    })

    const currentMoodData = dailyMoods?.find((mood: DailyMood.Select) => {
        const moodDate = new Date(mood.date)
        return moodDate.toDateString() === normalizedDate.toDateString()
    })
    const currentMood = currentMoodData?.mood ?? null
    const currentComment = currentMoodData?.comment ?? ""

    useEffect(() => {
        if (isOpen) {
            setSelectedMood(currentMood)
            setComment(currentComment || "")
            setFormChanged(false)
        }
    }, [isOpen, currentMood, currentComment, normalizedDate.getTime()])

    useEffect(() => {
        if (isOpen) {
            const moodChanged = selectedMood !== currentMood
            const commentChanged = comment !== (currentComment || "")
            setFormChanged(moodChanged || commentChanged)
        }
    }, [selectedMood, comment, currentMood, currentComment, isOpen])

    const getMoodIcon = (mood: number | null) => {
        switch (mood) {
            case 0:
                return <Angry className="min-w-6 max-w-6 min-h-6 text-red-700" />
            case 1:
                return <Frown className="min-w-6 max-w-6 min-h-6 text-blue-400" />
            case 2:
                return <Meh className="min-w-6 max-w-6 min-h-6 text-amber-300" />
            case 3:
                return <Smile className="min-w-6 max-w-6 min-h-6 text-green-400" />
            case 4:
                return <Laugh className="min-w-6 max-w-6 min-h-6 text-green-800" />
            default:
                return <SmilePlus className="min-w-6 max-w-6 min-h-6" />
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // Submit logic here
        toast.success("Mood saved!")
        closeModal()
    }

    const handleClose = () => {
        if (formChanged) {
            setShowConfirmDialog(true)
        } else {
            closeModal()
        }
    }

    return (
        <>
            {/* Main Modal - Now responsive! */}
            <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent maxHeight="max-h-135 md:max-h-95">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {currentMood !== null ? "Edit" : "Record"} Daily Mood
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            {/* Mood Selection */}
                            <div className="space-y-2">
                                <Label>How are you feeling?</Label>
                                <div className="grid grid-cols-5 gap-2">
                                    {[0, 1, 2, 3, 4].map((mood) => (
                                        <button
                                            key={mood}
                                            type="button"
                                            onClick={() => setSelectedMood(mood)}
                                            className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                                                selectedMood === mood
                                                    ? "border-primary bg-primary/10"
                                                    : "border-border hover:border-primary/50"
                                            }`}
                                        >
                                            {getMoodIcon(mood)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Comment */}
                            <div className="space-y-2">
                                <Label htmlFor="comment">Comment (optional)</Label>
                                <Textarea
                                    id="comment"
                                    placeholder="How was your day?"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={selectedMood === null}>
                                Save Mood
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Confirm Dialog for unsaved changes */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Are you sure you want to close?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Continue Editing</AlertDialogCancel>
                        <AlertDialogAction onClick={closeModal}>Discard Changes</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
