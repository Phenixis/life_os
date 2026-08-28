"use client"

import { useState, useRef, useEffect } from "react"
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
import { useDeleteIngredient } from "@/hooks/use-ingredients"
import { useIngredientModal } from "@/contexts/modal-commands-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import IngredientImage from "./ingredient-image"

export default function IngredientDisplay({
    ingredient,
}: Readonly<{
    ingredient: Schema.MealPlanner.Ingredient.Select;
}>) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showAllDescription, setShowAllDescription] = useState(false)
    const [isDescriptionClamped, setIsDescriptionClamped] = useState(false)
    const descriptionRef = useRef<HTMLParagraphElement>(null)
    const deleteIngredient = useDeleteIngredient()
    const { openModal, setIngredient } = useIngredientModal()

    // Check if description text is truncated
    useEffect(() => {
        const checkTextOverflow = () => {
            if (descriptionRef.current && ingredient.description && !showAllDescription) {
                // Small delay to ensure rendering is complete
                setTimeout(() => {
                    if (descriptionRef.current) {
                        // For line-clamp, we need to check if scrollHeight > clientHeight
                        console.log('Checking overflow for description:', descriptionRef.current)
                        console.log("scrollHeight:", descriptionRef.current.scrollHeight, "clientHeight:", descriptionRef.current.clientHeight)
                        const isOverflowing = descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight
                        setIsDescriptionClamped(isOverflowing)
                    }
                }, 10)
            } else {
                setIsDescriptionClamped(false)
            }
        }

        checkTextOverflow()

        // Re-check on window resize
        window.addEventListener('resize', checkTextOverflow)
        return () => window.removeEventListener('resize', checkTextOverflow)
    }, [ingredient.description, showAllDescription])

    if (!ingredient) {
        return null
    }

    const handleDelete = async () => {
        try {
            await deleteIngredient.mutateAsync(ingredient.id)
            toast.success("Ingredient deleted successfully")
            setShowDeleteDialog(false)
        } catch (error) {
            toast.error("Failed to delete ingredient")
            console.error("Error deleting ingredient:", error)
        }
    }

    const handleEdit = () => {
        setIngredient(ingredient)
        openModal()
    }

    return (
        <>
            <div
                className="group/ingredient px-2 py-1 border rounded-md shadow-sm mb-2 text-xs md:text-sm"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="relative mr-2 size-10">
                            <IngredientImage ingredient={ingredient} size="full" />
                            {/* Overlay on hover - desktop only */}
                            <div className="hidden lg:flex absolute inset-0 bg-black/60 rounded-md items-center justify-center opacity-0 group-hover/ingredient:opacity-100 transition-opacity">
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
                        {ingredient.name}
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
                            className="text-red-500 lg:hover:text-red-700 lg:opacity-0 lg:group-hover/ingredient:opacity-100 transition-opacity"
                            onClick={() => setShowDeleteDialog(true)}
                            disabled={deleteIngredient.isPending}
                        >
                            <Trash className="size-4" />
                        </Button>
                    </div>
                </div>
                {ingredient.description && (
                    <div className="space-y-1">
                        <p
                            ref={descriptionRef}
                            className={cn("mt-1 text-muted-foreground transition-all duration-200 break-words",
                                !showAllDescription && "line-clamp-2",
                                (isDescriptionClamped || showAllDescription) && "cursor-pointer"
                            )}
                            onClick={() => {
                                setShowAllDescription(!showAllDescription)
                            }}
                        >
                            {ingredient.description}
                        </p>
                    </div>
                )}
            </div>

            {/* Delete confirmation dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete ingredient?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{ingredient.name}"? This action cannot be undone.
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