"use client"

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Angry, Frown, Laugh, Meh, Smile, SmilePlus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useUser } from "@/hooks/use-user"
import { useDailyMoods } from "@/hooks/use-daily-moods"
import { useSWRConfig } from "swr"
import { DailyMood } from "@/lib/db/schema"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function DailyMoodModal({ 
    date,
    children,
    isOpen,
    onOpenChange
}: { 
    date?: Date
    children?: React.ReactNode
    isOpen?: boolean
    onOpenChange?: (open: boolean) => void
}) {
    const { user } = useUser()
    
    // State - use external control if provided
    const [internalOpen, setInternalOpen] = useState(false)
    const open = isOpen !== undefined ? isOpen : internalOpen
    const setOpen = onOpenChange || setInternalOpen
    
    const [selectedMood, setSelectedMood] = useState<number | null>(null)
    const [comment, setComment] = useState("")
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    
    // Use the passed date or fallback to today
    const targetDate = date || new Date()
    const normalizedDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0)
    const nextDay = new Date(normalizedDate.getFullYear(), normalizedDate.getMonth(), normalizedDate.getDate() + 1, 0, 0, 0)
    const { mutate } = useSWRConfig()

    const { data: dailyMoods, mutate: mutateDailyMoods } = useDailyMoods({
        startDate: normalizedDate,
        endDate: nextDay,
    })

    // Get current mood for the target date // Use the last mood entry if multiple exist because the first one might be the one from the previous day
    const currentMood = dailyMoods && dailyMoods.length > 0 ? dailyMoods[dailyMoods.length-1].mood : null
    const currentComment = dailyMoods && dailyMoods.length > 0 ? dailyMoods[dailyMoods.length-1].comment : ""

    // Initialize form state when dialog opens
    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            setSelectedMood(currentMood)
            setComment(currentComment || "")
        }
        setOpen(newOpen)
    }

    // Function to get mood icon based on mood value
    const getMoodIcon = (mood: number | null) => {
        switch (mood) {
            case 0:
                return <Angry className="min-w-[24px] max-w-[24px] min-h-[24px] text-red-700" />
            case 1:
                return <Frown className="min-w-[24px] max-w-[24px] min-h-[24px] text-blue-400" />
            case 2:
                return <Meh className="min-w-[24px] max-w-[24px] min-h-[24px] text-amber-300" />
            case 3:
                return <Smile className="min-w-[24px] max-w-[24px] min-h-[24px] text-green-400" />
            case 4:
                return <Laugh className="min-w-[24px] max-w-[24px] min-h-[24px] text-green-800" />
            default:
                return <SmilePlus className="min-w-[24px] max-w-[24px] min-h-[24px]" />
        }
    }

    const confirmMoodDelete = () => {
        setShowDeleteConfirm(false)
        handleMoodDelete()
    }

    const handleMoodDelete = () => {
        if (!dailyMoods || dailyMoods.length === 0) {
            toast.error("No mood to delete")
            return
        }

        setOpen(false)
        
        // Generate monthly query key for calendar optimistic updates
        const monthStart = new Date(normalizedDate.getFullYear(), normalizedDate.getMonth(), 1)
        const monthEnd = new Date(normalizedDate.getFullYear(), normalizedDate.getMonth() + 1, 0)
        const monthlyParams = new URLSearchParams()
        monthlyParams.append('startDate', monthStart.toISOString())
        monthlyParams.append('endDate', monthEnd.toISOString())
        const monthlyQueryKey = `/api/mood?${monthlyParams.toString()}`

        // Optimistic update for current query (specific date range)
        mutateDailyMoods((prevData: DailyMood.Select[] | undefined) => {
            if (prevData !== undefined && Array.isArray(prevData)) {
                return prevData.filter((item: DailyMood.Select) => {
                    const itemDate = new Date(item.date)
                    const targetDate = new Date(normalizedDate)
                    return itemDate.toDateString() !== targetDate.toDateString()
                })
            }
            return prevData
        }, { revalidate: false })

        // Optimistic update for calendar monthly query
        mutate(monthlyQueryKey, (prevData: DailyMood.Select[] | undefined) => {
            if (prevData !== undefined && Array.isArray(prevData)) {
                return prevData.filter((item: DailyMood.Select) => {
                    const itemDate = new Date(item.date)
                    const targetDate = new Date(normalizedDate)
                    return itemDate.toDateString() !== targetDate.toDateString()
                })
            }
            return prevData
        }, { revalidate: false })

        // Optimistic update for global cache
        mutate("/api/mood", (prevData: DailyMood.Select[] | undefined) => {
            if (prevData !== undefined && Array.isArray(prevData)) {
                return prevData.filter((item: DailyMood.Select) => {
                    const itemDate = new Date(item.date)
                    const targetDate = new Date(normalizedDate)
                    return itemDate.toDateString() !== targetDate.toDateString()
                })
            }
            return prevData
        }, { revalidate: false })

        // Make API call
        fetch("/api/mood", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user?.api_key || ""}`,
            },
            body: JSON.stringify({
                date: normalizedDate.toString(),
            }),
        })
            .then(response => {
                if (!response.ok) {
                    // Rollback optimistic updates on error
                    mutateDailyMoods()
                    mutate("/api/mood")
                    mutate(monthlyQueryKey)
                    
                    response.json().then(data => {
                        const errorMessage = data?.error || "Failed to delete mood";
                        toast.error(errorMessage);
                    }).catch(() => {
                        toast.error("Failed to delete mood");
                    })
                } else {
                    toast.success("Mood deleted successfully")
                    // Revalidate to get the actual server data
                    mutateDailyMoods()
                    mutate("/api/mood")
                    mutate(monthlyQueryKey)
                }
            })
            .catch(() => {
                // Rollback optimistic updates on network error
                mutateDailyMoods()
                mutate("/api/mood")
                mutate(monthlyQueryKey)
                toast.error("Failed to delete mood");
            })
    }

    const handleMoodSubmit = () => {
        // Prevent mood selection for future dates
        if (isFutureDate()) {
            toast.error("Cannot set mood for future dates")
            return
        }

        if (selectedMood === null) {
            toast.error("Please select a mood")
            return
        }

        setOpen(false)
        const method = dailyMoods.length == 0 ? "POST" : "PUT"
        
        // Generate monthly query key for calendar optimistic updates (using same logic as useFilteredData)
        const monthStart = new Date(normalizedDate.getFullYear(), normalizedDate.getMonth(), 1)
        const monthEnd = new Date(normalizedDate.getFullYear(), normalizedDate.getMonth() + 1, 0)
        const monthlyParams = new URLSearchParams()
        monthlyParams.append('startDate', monthStart.toISOString())
        monthlyParams.append('endDate', monthEnd.toISOString())
        const monthlyQueryKey = `/api/mood?${monthlyParams.toString()}`

        // Optimistic update for current query (specific date range)
        mutateDailyMoods((prevData: DailyMood.Select[] | undefined) => {
            if (method === "POST") {
                const newMood: DailyMood.Select = { 
                    mood: selectedMood, 
                    date: normalizedDate, 
                    created_at: new Date(), 
                    comment: comment, 
                    id: Date.now(), // Temporary ID for optimistic update
                    user_id: user?.id || "", 
                    updated_at: new Date(), 
                    deleted_at: null 
                }
                return [newMood, ...(prevData || [])]
            }
            if (prevData !== undefined && Array.isArray(prevData) && method === "PUT") {
                return prevData.map((item: DailyMood.Select) => {
                    // Compare dates properly for optimistic update
                    const itemDate = new Date(item.date)
                    const targetDate = new Date(normalizedDate)
                    if (itemDate.toDateString() === targetDate.toDateString()) {
                        return { ...item, mood: selectedMood, comment: comment, updated_at: new Date() }
                    }
                    return item
                })
            }
            return prevData
        }, { revalidate: false })

        // Optimistic update for calendar monthly query (for calendar component)
        mutate(monthlyQueryKey, (prevData: DailyMood.Select[] | undefined) => {
            if (method === "POST") {
                const newMood: DailyMood.Select = { 
                    mood: selectedMood, 
                    date: normalizedDate, 
                    created_at: new Date(), 
                    comment: comment, 
                    id: Date.now(), // Temporary ID for optimistic update
                    user_id: user?.id || "", 
                    updated_at: new Date(), 
                    deleted_at: null 
                }
                return [newMood, ...(prevData || [])]
            }
            if (prevData !== undefined && Array.isArray(prevData) && method === "PUT") {
                return prevData.map((item: DailyMood.Select) => {
                    const itemDate = new Date(item.date)
                    const targetDate = new Date(normalizedDate)
                    if (itemDate.toDateString() === targetDate.toDateString()) {
                        return { ...item, mood: selectedMood, comment: comment, updated_at: new Date() }
                    }
                    return item
                })
            }
            return prevData
        }, { revalidate: false })

        // Optimistic update for global cache (for calendar component)
        mutate("/api/mood", (prevData: DailyMood.Select[] | undefined) => {
            if (method === "POST") {
                const newMood: DailyMood.Select = { 
                    mood: selectedMood, 
                    date: normalizedDate, 
                    created_at: new Date(), 
                    comment: comment, 
                    id: Date.now(), // Temporary ID for optimistic update
                    user_id: user?.id || "", 
                    updated_at: new Date(), 
                    deleted_at: null 
                }
                return [newMood, ...(prevData || [])]
            }
            if (prevData !== undefined && Array.isArray(prevData) && method === "PUT") {
                return prevData.map((item: DailyMood.Select) => {
                    const itemDate = new Date(item.date)
                    const targetDate = new Date(normalizedDate)
                    if (itemDate.toDateString() === targetDate.toDateString()) {
                        return { ...item, mood: selectedMood, comment: comment, updated_at: new Date() }
                    }
                    return item
                })
            }
            return prevData
        }, { revalidate: false })

        // Make API call
        fetch("/api/mood", {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user?.api_key || ""}`,
            },
            body: JSON.stringify({
                mood: selectedMood,
                comment: comment,
                date: normalizedDate.toString(),
            }),
        })
            .then(response => {
                if (!response.ok) {
                    // Rollback optimistic updates on error
                    mutateDailyMoods()
                    mutate("/api/mood")
                    mutate(monthlyQueryKey)
                    
                    response.json().then(data => {
                        const errorMessage = data?.error || "Failed to save mood";
                        toast.error(errorMessage);
                    }).catch(() => {
                        toast.error(`Failed to ${method === "POST" ? "save" : "update"} mood`);
                    })
                } else {
                    toast.success(`Mood ${method === "POST" ? "saved" : "updated"} successfully`)
                    // Revalidate to get the actual server data
                    mutateDailyMoods()
                    mutate("/api/mood")
                    mutate(monthlyQueryKey)
                }
            })
            .catch(() => {
                // Rollback optimistic updates on network error
                mutateDailyMoods()
                mutate("/api/mood")
                mutate(monthlyQueryKey)
                toast.error(`Failed to ${method === "POST" ? "save" : "update"} mood`);
            })
    }

    // Helper function to determine if the date is today
    const isToday = () => {
        const today = new Date()
        return normalizedDate.toDateString() === today.toDateString()
    }

    // Helper function to determine if the date is in the future
    const isFutureDate = () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Normalize today to start of day
        return normalizedDate > today
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {children ? (
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
            ) : (
                <DialogTrigger asChild>
                    <Button
                        variant="ghost"
                        className={`h-10 px-2 flex items-center border-none w-fit text-xs ${isFutureDate() ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={isFutureDate()}
                    >
                        {getMoodIcon(currentMood)}
                        <p className="hidden">
                            {isFutureDate() 
                                ? `Cannot set mood for future date: ${normalizedDate.toLocaleDateString()}`
                                : isToday() 
                                    ? "What's your mood today?" 
                                    : `Mood for ${normalizedDate.toLocaleDateString()}`
                            }
                        </p>
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isFutureDate() 
                            ? `Cannot set mood for future date: ${normalizedDate.toLocaleDateString()}`
                            : isToday() 
                                ? "What's your mood today?" 
                                : `Set mood for ${normalizedDate.toLocaleDateString()}`
                        }
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label>Select your mood</Label>
                        <div className="grid grid-cols-5 gap-2 mt-2">
                            <Button
                                variant={selectedMood === 0 ? "default" : "outline"}
                                size="sm"
                                className={`p-3 flex flex-col gap-1 h-auto aspect-square ${selectedMood === 0 ? "bg-red-100 border border-red-500 dark:bg-red-900/30 text-black dark:text-white" : ""}`}
                                onClick={() => setSelectedMood(0)}
                                disabled={isFutureDate()}
                            >
                                <Angry className="size-6 text-red-700 flex-shrink-0" />
                                <span className="text-xs">Angry</span>
                            </Button>
                            <Button
                                variant={selectedMood === 1 ? "default" : "outline"}
                                size="sm"
                                className={`p-3 flex flex-col gap-1 h-auto aspect-square ${selectedMood === 1 ? "bg-blue-100 border border-blue-500 dark:bg-blue-900/30 text-black dark:text-white" : ""}`}
                                onClick={() => setSelectedMood(1)}
                                disabled={isFutureDate()}
                            >
                                <Frown className="size-6 text-blue-400 flex-shrink-0" />
                                <span className="text-xs">Sad</span>
                            </Button>
                            <Button
                                variant={selectedMood === 2 ? "default" : "outline"}
                                size="sm"
                                className={`p-3 flex flex-col gap-1 h-auto aspect-square ${selectedMood === 2 ? "bg-amber-100 border border-amber-500 dark:bg-amber-900/30 text-black dark:text-white" : ""}`}
                                onClick={() => setSelectedMood(2)}
                                disabled={isFutureDate()}
                            >
                                <Meh className="size-6 text-amber-300 flex-shrink-0" />
                                <span className="text-xs">Meh</span>
                            </Button>
                            <Button
                                variant={selectedMood === 3 ? "default" : "outline"}
                                size="sm"
                                className={`p-3 flex flex-col gap-1 h-auto aspect-square ${selectedMood === 3 ? "bg-green-100 border border-green-500 dark:bg-green-900/30 text-black dark:text-white" : ""}`}
                                onClick={() => setSelectedMood(3)}
                                disabled={isFutureDate()}
                            >
                                <Smile className="size-6 text-green-400 flex-shrink-0" />
                                <span className="text-xs">Happy</span>
                            </Button>
                            <Button
                                variant={selectedMood === 4 ? "default" : "outline"}
                                size="sm"
                                className={`p-3 flex flex-col gap-1 h-auto aspect-square ${selectedMood === 4 ? "bg-green-100 border border-green-500 dark:bg-green-900/30 text-black dark:text-white" : ""}`}
                                onClick={() => setSelectedMood(4)}
                                disabled={isFutureDate()}
                            >
                                <Laugh className="size-6 text-green-800 flex-shrink-0" />
                                <span className="text-xs">Amazing</span>
                            </Button>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="comment">Comment (optional)</Label>
                        <Textarea
                            id="comment"
                            placeholder="Add a comment about your mood..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            disabled={isFutureDate()}
                            className="mt-1"
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter className="flex gap-2">
                    {currentMood !== null && !isFutureDate() && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setSelectedMood(null)
                                setComment("")
                                setShowDeleteConfirm(true)
                            }}
                            className="text-destructive hover:text-destructive"
                        >
                            Delete Mood
                        </Button>
                    )}
                    <Button
                        type="button"
                        onClick={handleMoodSubmit}
                        disabled={isFutureDate() || selectedMood === null}
                    >
                        Save Mood
                    </Button>
                </DialogFooter>
            </DialogContent>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Mood</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete your mood for {normalizedDate.toLocaleDateString()}? 
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmMoodDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Dialog>
    )
}