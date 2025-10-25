"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
import { User } from "@/lib/db/schema"
// import { useUser } from "@/hooks/use-user" Used for current user, but as currentUsed is not used in this component, it has been commented out.
import { useSWRConfig } from "swr"
import { Loader2 } from "lucide-react"

interface ProfileFormProps {
    user: User.User.Select
}

export function ProfileForm({ user }: ProfileFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
    })
    const [lastSavedData, setLastSavedData] = useState({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const { mutate } = useSWRConfig()
    // const { user: currentUser } = useUser() // Not used 

    const validateForm = () => {
        const newErrors: Record<string, string> = {}
        
        if (!formData.first_name.trim()) {
            newErrors.first_name = "First name is required"
        }
        
        if (!formData.last_name.trim()) {
            newErrors.last_name = "Last name is required"
        }
        
        if (!formData.email.trim()) {
            newErrors.email = "Email is required"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address"
        }
        
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!validateForm()) {
            return
        }

        // Check if anything has changed
        const hasChanges = 
            formData.first_name !== lastSavedData.first_name ||
            formData.last_name !== lastSavedData.last_name ||
            formData.email !== lastSavedData.email

        if (!hasChanges) {
            toast.info("No changes detected - your profile information is already up to date.")
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch("/api/user/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.api_key}`
                },
                body: JSON.stringify(formData),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to update profile")
            }

            const updatedUser = await response.json()
            
            // Update the form data with the new values from the server
            setFormData({
                first_name: updatedUser.first_name,
                last_name: updatedUser.last_name,
                email: updatedUser.email,
            })
            
            // Update the last saved data to match the new values
            setLastSavedData({
                first_name: updatedUser.first_name,
                last_name: updatedUser.last_name,
                email: updatedUser.email,
            })
            
            // Update the user data in the global state
            mutate("/api/user")
            
            toast.success("Profile updated successfully!")

        } catch (error) {
            console.error("Error updating profile:", error)
            toast.error(error instanceof Error ? error.message : "Failed to update profile. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                    Update your personal details and contact information.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">First Name</Label>
                            <Input
                                id="first_name"
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => handleInputChange("first_name", e.target.value)}
                                placeholder="Enter your first name"
                                disabled={isLoading}
                                className={errors.first_name ? "border-red-500" : ""}
                            />
                            {errors.first_name && (
                                <p className="text-sm text-red-500">{errors.first_name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="last_name">Last Name</Label>
                            <Input
                                id="last_name"
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => handleInputChange("last_name", e.target.value)}
                                placeholder="Enter your last name"
                                disabled={isLoading}
                                className={errors.last_name ? "border-red-500" : ""}
                            />
                            {errors.last_name && (
                                <p className="text-sm text-red-500">{errors.last_name}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            placeholder="Enter your email address"
                            disabled={isLoading}
                            className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email}</p>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <Button 
                            type="submit" 
                            disabled={isLoading}
                            className="min-w-[120px]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update Profile"
                            )}
                        </Button>
                    </div>
                </form>
                </CardContent>
        </Card>
    )
}
