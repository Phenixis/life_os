"use client"

import { useState, useEffect, useRef, FormEvent, DragEvent, ChangeEvent } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useMealModal } from "@/contexts/modal-commands-context"
import { useCreateMeal, useUpdateMeal, useIngredientsQuery } from "@/hooks/use-meals"
import { toast } from "sonner"
import { Info, Upload, X, Image as ImageIcon, Plus, Trash2 } from "lucide-react"
import * as Schema from "@/lib/db/schema"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

type MealIngredient = {
    tempId: string
    ingredient_id?: number
    ingredient_name: string
    quantity: number
    unit: string
}

export function MealModal() {
    const { isOpen, openModal, closeModal, meal, setMeal } = useMealModal()
    const mode = meal ? "edit" : "create"

    // Mutations
    const createMeal = useCreateMeal()
    const updateMeal = useUpdateMeal()

    // Form state
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [imageUrl, setImageUrl] = useState("")
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [keepEditing, setKeepEditing] = useState(false)
    const [formChanged, setFormChanged] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [mealIngredients, setMealIngredients] = useState<MealIngredient[]>([])

    // Fetch all ingredients for selection
    const { ingredients } = useIngredientsQuery({
        orderBy: "name",
        orderingDirection: "asc",
    })

    // Refs
    const isSubmittingRef = useRef(false)
    const closeDialogRef = useRef<() => void>(() => { })
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Reset form
    const resetForm = () => {
        setMealIngredients([])
        setName("")
        setDescription("")
        setImageUrl("")
        setImageFile(null)
        setImagePreview(null)
        setFormChanged(false)
        setKeepEditing(false)
    }

    // Sync form with meal data when modal opens
    useEffect(() => {
        if (isOpen) {
            if (mode === "edit" && meal) {
                setName(meal.name || "")
                setImagePreview(meal.image_url || null)
                setImageFile(null)
                setDescription(meal.description || "")
                setImageUrl(meal.image_url || "")
            } else {
                resetForm()
            }
            setFormChanged(false)
        }
    }, [isOpen, mode, meal])

    // Track form changes
    useEffect(() => {
        if (mode === "edit" && meal) {
            setFormChanged(
                name.trim() !== (meal.name || "") ||
                description.trim() !== (meal.description || "") ||
                imageUrl.trim() !== (meal.image_url || "") ||
                imageFile !== null ||
                mealIngredients.length > 0
            )
        } else {
            setFormChanged(name.trim() !== "" || imageFile !== null || mealIngredients.length > 0)
        }
    }, [name, description, imageUrl, imageFile, mode, meal, mealIngredients])

    // Handle close
    const close = () => {
        resetForm()
        setMeal(undefined)
        closeModal()
    }

    // Handle close attempt
    const handleCloseAttempt = () => {
        if (formChanged) {
            closeDialogRef.current = () => close()
            setShowConfirmDialog(true)
        } else {
            close()
        }
    }

    // Handle confirm discard
    const handleConfirmDiscard = () => {
        setShowConfirmDialog(false)
        setTimeout(() => {
            closeDialogRef.current()
        }, 100)
    }

    // Handle file selection
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleFile(file)
        }
    }

    // Handle file drop
    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const file = e.dataTransfer.files[0]
        if (file) {
            handleFile(file)
        }
    }

    // Handle drag events
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    // Process file
    const handleFile = (file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error("Please select an image file")
            return
        }

        // Validate file size (e.g., 5MB limit)
        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
            toast.error("Image must be smaller than 5MB")
            return
        }

        setImageFile(file)

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    // Remove image
    const handleRemoveImage = () => {
        setImageFile(null)
        setImagePreview(null)
        setImageUrl("")
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    // Add ingredient to meal
    const addIngredient = () => {
        setMealIngredients([
            ...mealIngredients,
            {
                tempId: Date.now().toString(),
                ingredient_name: "",
                quantity: 1,
                unit: "unit",
            },
        ])
    }

    // Remove ingredient from meal
    const removeIngredient = (tempId: string) => {
        setMealIngredients(mealIngredients.filter((ing) => ing.tempId !== tempId))
    }

    // Update ingredient in list
    const updateIngredient = (tempId: string, updates: Partial<MealIngredient>) => {
        setMealIngredients(
            mealIngredients.map((ing) =>
                ing.tempId === tempId ? { ...ing, ...updates } : ing
            )
        )
    }

    // Handle submit
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (isSubmittingRef.current) return
        isSubmittingRef.current = true

        try {
            if (!name.trim()) {
                toast.error("Please enter a meal name")
                isSubmittingRef.current = false
                return
            }

            // Validate ingredients
            for (const ing of mealIngredients) {
                if (!ing.ingredient_name.trim()) {
                    toast.error("Please select an ingredient for all entries")
                    isSubmittingRef.current = false
                    return
                }
                if (ing.quantity <= 0) {
                    toast.error("Quantity must be greater than 0")
                    isSubmittingRef.current = false
                    return
                }
            }

            const mealData = {
                name: name.trim(),
                description: description.trim() || undefined,
                image_url: imageUrl.trim() || undefined,
                ingredients: mealIngredients.map((ing) => ({
                    name: ing.ingredient_name,
                    quantity: ing.quantity,
                    unit: ing.unit,
                })),
            }

            // TODO: Upload imageFile to Vercel Blob and get URL
            if (imageFile) {
                toast.info("Image upload to Vercel Blob not yet implemented")
                // Future: Upload to Vercel Blob and set mealData.image_url
            }

            if (keepEditing) {
                resetForm()
                setKeepEditing(true)
            } else {
                close()
            }

            if (mode === "edit" && meal?.id) {
                await updateMeal.mutateAsync({
                    id: meal.id,
                    data: mealData
                })
                toast.success("Meal updated successfully")
            } else {
                await createMeal.mutateAsync(mealData)
                toast.success("Meal created successfully")
            }
        } catch (error) {
            toast.error(`Failed to ${mode === "edit" ? "update" : "create"} meal`)
            console.error("Error submitting meal:", error)
        } finally {
            isSubmittingRef.current = false
        }
    }

    // Keyboard shortcut for Ctrl+Enter
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === "Enter" && isOpen) {
                const form = document.getElementById("meal-form") as HTMLFormElement
                if (form) {
                    form.requestSubmit()
                }
            }
        }

        document.addEventListener("keydown", handleKeyPress)
        return () => {
            document.removeEventListener("keydown", handleKeyPress)
        }
    }, [isOpen])

    // Reset submission state when modal opens/closes
    useEffect(() => {
        isSubmittingRef.current = false
    }, [isOpen])

    const isPending = createMeal.isPending || updateMeal.isPending

    // Determine button text
    const getButtonText = () => {
        if (isPending) return "Saving..."
        return mode === "edit" ? "Save" : "Create"
    }

    return (
        <>
            <Dialog
                open={isOpen}
                onOpenChange={(newOpenState) => {
                    if (!newOpenState && isOpen) {
                        handleCloseAttempt()
                    } else if (newOpenState) {
                        openModal()
                    }
                }}
            >
                <DialogContent
                    aria-describedby={undefined}
                    maxHeight="max-h-145"
                >
                    <form
                        id="meal-form"
                        onSubmit={handleSubmit}
                        className="space-y-4 h-full flex flex-col justify-between"
                    >
                        <main className="space-y-4">
                            <DialogHeader>
                                <DialogTitle>
                                    {mode === "edit" ? "Edit Meal" : "Create Meal"}
                                </DialogTitle>
                            </DialogHeader>

                            <div>
                                <Label htmlFor="image" className="flex items-center gap-2">
                                    Image
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Info className="h-3 w-3" />
                                        Not yet implemented
                                    </p></Label>
                                <div className="space-y-2">
                                    {/* Image Preview */}
                                    {imagePreview ? (
                                        <div className="relative w-full h-40 border-2 border-dashed rounded-lg overflow-hidden group">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        /* Drag and Drop Area */
                                        <div
                                            onDrop={handleDrop}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`
                                                w-full h-40 border-2 border-dashed rounded-lg
                                                flex flex-col items-center justify-center gap-2
                                                cursor-pointer transition-colors
                                                ${isDragging
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50'
                                                }
                                                ${isPending ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
                                            `}
                                        >
                                            {isDragging ? (
                                                <Upload className="h-8 w-8 text-primary" />
                                            ) : (
                                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                            )}
                                            <div className="text-center">
                                                <p className="text-sm font-medium">
                                                    {isDragging ? 'Drop image here' : 'Drop image or click to upload'}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    PNG, JPG, GIF up to 5MB (Not yet implemented)
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        disabled={isPending}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="name" required>Name</Label>
                                <Input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isPending}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={isPending}
                                    rows={3}
                                    placeholder="Optional description..."
                                />
                            </div>

                            {/* Ingredients Section */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Ingredients</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addIngredient}
                                        disabled={isPending}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Ingredient
                                    </Button>
                                </div>

                                {mealIngredients.length === 0 ? (
                                    <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
                                        No ingredients added yet. Click "Add Ingredient" to start.
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                        {mealIngredients.map((mealIng) => (
                                            <IngredientRow
                                                key={mealIng.tempId}
                                                mealIngredient={mealIng}
                                                availableIngredients={ingredients || []}
                                                onUpdate={updateIngredient}
                                                onRemove={removeIngredient}
                                                disabled={isPending}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </main>

                        <DialogFooter className="w-full sm:justify-between">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="keep-editing"
                                    checked={keepEditing}
                                    onCheckedChange={() => setKeepEditing(!keepEditing)}
                                    disabled={isPending}
                                />
                                <label
                                    htmlFor="keep-editing"
                                    className={`text-sm ${isPending ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                >
                                    Keep {mode === "edit" ? "editing" : "creating"} meals?
                                </label>
                            </div>
                            <Button type="submit" disabled={!formChanged || isPending}>
                                {getButtonText()}
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
                        <AlertDialogAction onClick={handleConfirmDiscard}>
                            Discard
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

// IngredientRow Component
function IngredientRow({
    mealIngredient,
    availableIngredients,
    onUpdate,
    onRemove,
    disabled,
}: {
    mealIngredient: MealIngredient
    availableIngredients: Schema.MealPlanner.Ingredient.Select[]
    onUpdate: (tempId: string, updates: Partial<MealIngredient>) => void
    onRemove: (tempId: string) => void
    disabled: boolean
}) {
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState(mealIngredient.ingredient_name)

    // Filter ingredients based on input
    const filteredIngredients = availableIngredients.filter((ingredient) =>
        ingredient.name.toLowerCase().includes(inputValue.toLowerCase())
    )

    // Update inputValue when mealIngredient changes
    useEffect(() => {
        setInputValue(mealIngredient.ingredient_name)
    }, [mealIngredient.ingredient_name])

    const handleInputChange = (value: string) => {
        setInputValue(value)
        onUpdate(mealIngredient.tempId, {
            ingredient_name: value,
            ingredient_id: undefined, // Clear ID for new ingredients
        })
        
        // Show popover if there are matches or if input is not empty
        setOpen(value.trim().length > 0)
    }

    const handleSelectIngredient = (ingredient: Schema.MealPlanner.Ingredient.Select) => {
        setInputValue(ingredient.name)
        onUpdate(mealIngredient.tempId, {
            ingredient_id: ingredient.id,
            ingredient_name: ingredient.name,
        })
        setOpen(false)
    }

    return (
        <div className="flex gap-2 items-start p-2 border rounded-lg bg-background">
            {/* Ingredient Autocomplete Input */}
            <div className="flex-1 min-w-0">
                <Popover open={open && filteredIngredients.length > 0} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Input
                            type="text"
                            value={inputValue}
                            onChange={(e) => handleInputChange(e.target.value)}
                            onFocus={() => inputValue.trim().length > 0 && setOpen(true)}
                            placeholder="Type ingredient name..."
                            disabled={disabled}
                            className="w-full"
                        />
                    </PopoverTrigger>
                    <PopoverContent 
                        className="w-[var(--radix-popover-trigger-width)] p-0" 
                        align="start"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                        <div className="max-h-60 overflow-auto p-1">
                            {filteredIngredients.map((ingredient) => (
                                <div
                                    key={ingredient.id}
                                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                    onClick={() => handleSelectIngredient(ingredient)}
                                >
                                    {ingredient.name}
                                </div>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Quantity Input */}
            <Input
                type="number"
                value={mealIngredient.quantity}
                onChange={(e) =>
                    onUpdate(mealIngredient.tempId, {
                        quantity: Number.parseFloat(e.target.value) || 0,
                    })
                }
                min="0"
                step="0.1"
                className="w-20"
                disabled={disabled}
                placeholder="Qty"
            />

            {/* Unit Input */}
            <Input
                type="text"
                value={mealIngredient.unit}
                onChange={(e) =>
                    onUpdate(mealIngredient.tempId, { unit: e.target.value })
                }
                className="w-20"
                disabled={disabled}
                placeholder="Unit"
            />

            {/* Remove Button */}
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemove(mealIngredient.tempId)}
                disabled={disabled}
                className="shrink-0 text-destructive hover:text-destructive"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    )
}
