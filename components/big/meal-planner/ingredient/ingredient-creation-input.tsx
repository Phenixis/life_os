"use client"

import { useState, FormEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useCreateIngredient } from "@/hooks/use-ingredients"
import { toast } from "sonner"

export function IngredientCreationInput({
    className
} : Readonly<{
    className?: string
}>) {
    const [name, setName] = useState("")
    const createIngredient = useCreateIngredient()

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        
        if (!name.trim()) {
            toast.error("Please enter an ingredient name")
            return
        }

        try {
            await createIngredient.mutateAsync({ name: name.trim() })
            toast.success("Ingredient created successfully")
            setName("")
        } catch (error) {
            toast.error("Failed to create ingredient")
            console.error("Error creating ingredient:", error)
        }
    }

    return (
        <form onSubmit={handleSubmit} className={cn("flex gap-2 items-center", className)}>
            <Input
                className="min-w-0 flex-1"
                placeholder="New Ingredient Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={createIngredient.isPending}
            />
            <Button 
                type="submit" 
                disabled={createIngredient.isPending || !name.trim()}
            >
                {createIngredient.isPending ? "Creating..." : "Create"}
            </Button>
        </form>
    )
}