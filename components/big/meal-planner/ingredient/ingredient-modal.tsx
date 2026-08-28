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
import { useIngredientModal } from "@/contexts/modal-commands-context"
import { useCreateIngredient, useUpdateIngredient } from "@/hooks/use-ingredients"
import { toast } from "sonner"
import { Info, Upload, X, Image as ImageIcon } from "lucide-react"

export function IngredientModal() {
    const { isOpen, openModal, closeModal, ingredient, setIngredient } = useIngredientModal()
    const mode = ingredient ? "edit" : "create"

    // Mutations
    const createIngredient = useCreateIngredient()
    const updateIngredient = useUpdateIngredient()

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

    // Refs
    const isSubmittingRef = useRef(false)
    const closeDialogRef = useRef<() => void>(() => { })
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Reset form
    const resetForm = () => {
        setName("")
        setDescription("")
        setImageUrl("")
        setImageFile(null)
        setImagePreview(null)
        setFormChanged(false)
        setKeepEditing(false)
    }

    // Sync form with ingredient data when modal opens
    useEffect(() => {
        if (isOpen) {
            if (mode === "edit" && ingredient) {
                setName(ingredient.name || "")
                setImagePreview(ingredient.image_url || null)
                setImageFile(null)
                setDescription(ingredient.description || "")
                setImageUrl(ingredient.image_url || "")
            } else {
                resetForm()
            }
            setFormChanged(false)
        }
    }, [isOpen, mode, ingredient])

    // Track form changes
    useEffect(() => {
        if (mode === "edit" && ingredient) {
            setFormChanged(
                name.trim() !== (ingredient.name || "") ||
                description.trim() !== (ingredient.description || "") ||
                imageUrl.trim() !== (ingredient.image_url || "") ||
                imageFile !== null
            )
        } else {
            setFormChanged(name.trim() !== "" || imageFile !== null)
        }
    }, [name, description, imageUrl, imageFile, mode, ingredient])

    // Handle close
    const close = () => {
        resetForm()
        setIngredient(undefined)
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

    // Handle submit
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (isSubmittingRef.current) return
        isSubmittingRef.current = true

        try {
            if (!name.trim()) {
                toast.error("Please enter an ingredient name")
                isSubmittingRef.current = false
                return
            }

            const ingredientData = {
                name: name.trim(),
                description: description.trim() || undefined,
                image_url: imageUrl.trim() || undefined
            }

            // TODO: Upload imageFile to Vercel Blob and get URL
            if (imageFile) {
                toast.info("Image upload to Vercel Blob not yet implemented")
                // Future: Upload to Vercel Blob and set ingredientData.image_url
            }

            if (keepEditing) {
                resetForm()
                setKeepEditing(true)
            } else {
                close()
            }

            if (mode === "edit" && ingredient?.id) {
                await updateIngredient.mutateAsync({
                    id: ingredient.id,
                    data: ingredientData
                })
                toast.success("Ingredient updated successfully")
            } else {
                await createIngredient.mutateAsync(ingredientData)
                toast.success("Ingredient created successfully")
            }
        } catch (error) {
            toast.error(`Failed to ${mode === "edit" ? "update" : "create"} ingredient`)
            console.error("Error submitting ingredient:", error)
        } finally {
            isSubmittingRef.current = false
        }
    }

    // Keyboard shortcut for Ctrl+Enter
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === "Enter" && isOpen) {
                const form = document.getElementById("ingredient-form") as HTMLFormElement
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

    const isPending = createIngredient.isPending || updateIngredient.isPending

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
                        id="ingredient-form"
                        onSubmit={handleSubmit}
                        className="space-y-4 h-full flex flex-col justify-between"
                    >
                        <main className="space-y-4">
                            <DialogHeader>
                                <DialogTitle>
                                    {mode === "edit" ? "Edit Ingredient" : "Create Ingredient"}
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
                                                ${true || isPending ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
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
                                                    PNG, JPG, GIF up to 5MB
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
                                        disabled={true || isPending}
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
                                    Keep {mode === "edit" ? "editing" : "creating"} ingredients?
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