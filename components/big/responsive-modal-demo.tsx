"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    ResponsiveModal,
    ResponsiveModalContent,
    ResponsiveModalDescription,
    ResponsiveModalFooter,
    ResponsiveModalHeader,
    ResponsiveModalTitle,
} from "@/components/ui/responsive-modal"

export default function ResponsiveModalDemo() {
    const [isOpen, setIsOpen] = useState(false)
    const [name, setName] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log("Submitted:", name)
        setIsOpen(false)
        setName("")
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold">Responsive Modal Demo</h1>
                <p className="text-muted-foreground">
                    This modal shows as a Dialog on desktop/tablet and as a Drawer on mobile
                </p>
                <Button onClick={() => setIsOpen(true)} size="lg">
                    Open Responsive Modal
                </Button>

                <ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
                    <ResponsiveModalContent side="bottom" maxHeight="max-h-124">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <ResponsiveModalHeader>
                                <ResponsiveModalTitle>Edit Profile</ResponsiveModalTitle>
                                <ResponsiveModalDescription>
                                    Make changes to your profile here. On mobile, this appears as a drawer from the bottom. On desktop, it's a centered dialog.
                                </ResponsiveModalDescription>
                            </ResponsiveModalHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="Enter your name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                            <ResponsiveModalFooter>
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Save Changes</Button>
                            </ResponsiveModalFooter>
                        </form>
                    </ResponsiveModalContent>
                </ResponsiveModal>
            </div>
        </div>
    )
}
