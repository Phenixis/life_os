"use client"

import { useState } from "react"
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
import * as Schema from "@/lib/db/schema"
import { Trash, Edit3 } from "lucide-react"
import Image from "next/image"
import { useDeleteMeal } from "@/hooks/use-meals"
import { useMealModal } from "@/contexts/modal-commands-context"
import { toast } from "sonner"

export default function MealDisplay({
    meal,
}: Readonly<{
    meal: Schema.MealPlanner.Meal.Select;
}>) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const deleteMeal = useDeleteMeal()
    const { openModal, setMeal } = useMealModal()

    if (!meal) {
        return null
    }

    const handleDelete = async () => {
        try {
            await deleteMeal.mutateAsync(meal.id)
            toast.success("Meal deleted successfully")
            setShowDeleteDialog(false)
        } catch (error) {
            toast.error("Failed to delete meal")
            console.error("Error deleting meal:", error)
        }
    }

    const handleEdit = () => {
        setMeal(meal)
        openModal()
    }

    return (
        <>
            <div
                className="group/meal px-2 py-1 bg-gray-200 rounded-md mb-2 text-xs md:text-sm"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="relative mr-2 size-10">
                            {
                                (!meal.image_url) ? (
                                    <div className="rounded-md bg-gray-400 size-10" />
                                ) : (
                                    <Image
                                        src={meal.image_url}
                                        alt={meal.name}
                                        width={40}
                                        height={40}
                                        className="rounded-md object-cover size-10"
                                    />
                                )
                            }
                            {/* Overlay on hover - desktop only */}
                            <div className="hidden lg:flex absolute inset-0 bg-black/60 rounded-md items-center justify-center opacity-0 group-hover/meal:opacity-100 transition-opacity">
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={handleEdit}
                                    className="size-7"
                                >
                                    <Edit3 className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                        {meal.name}
                    </div>
                    <div className="flex gap-1">
                        {/* Edit button visible on mobile, hidden on desktop (shows on hover) */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={handleEdit}
                        >
                            <Edit3 className="size-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 lg:hover:text-red-700 lg:opacity-0 lg:group-hover/meal:opacity-100 transition-opacity"
                            onClick={() => setShowDeleteDialog(true)}
                            disabled={deleteMeal.isPending}
                        >
                            <Trash className="size-4" />
                        </Button>
                    </div>
                </div>
                {meal.description && (
                    <p className="mt-1 text-muted-foreground text-xs break-words">
                        {meal.description}
                    </p>
                )}
            </div>

            {/* Delete confirmation dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete meal?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{meal.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}