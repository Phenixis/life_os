"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ProfileSkeleton } from "@/components/ui/chat-skeletons"
import { useProfiles } from "@/hooks/chat/use-profiles"
import { Ai } from "@/lib/db/schema"

export default function MultiProfileChatbot() {
    const router = useRouter()
    const [isCreatingProfile, setIsCreatingProfile] = useState(false)
    const [newProfile, setNewProfile] = useState({
        name: "",
        description: "",
        system_prompt: "",
    })

    // Use the hooks
    const { profiles, isLoading: profilesLoading, createProfile } = useProfiles({})

    // recommended profiles for demo
    const defaultProfiles = [
        {
            name: "80-Year-Old Me",
            description: "Your wise, experienced future self",
            system_prompt:
                "You are the user's 80-year-old future self. You have lived a full life, gained wisdom through experience, and have perspective on what truly matters. Speak with warmth, wisdom, and the benefit of hindsight. Share life lessons, encourage patience, and help the user see the bigger picture. Use a gentle, caring tone as if speaking to your younger self.",
        },
        {
            name: "Life Mentor",
            description: "A supportive guide for personal growth",
            system_prompt:
                "You are a wise and supportive life mentor. Your role is to guide, encourage, and help the user navigate life's challenges. Provide thoughtful advice, ask insightful questions, and help the user discover their own answers. Be empathetic, non-judgmental, and focus on personal growth and self-discovery.",
        },
        {
            name: "Creative Collaborator",
            description: "An inspiring creative partner",
            system_prompt:
                "You are an enthusiastic creative collaborator. Help the user explore ideas, brainstorm solutions, and think outside the box. Encourage experimentation, celebrate creativity, and help turn abstract concepts into concrete plans. Be energetic, supportive, and always ready to build on ideas.",
        },
    ]

    const handleCreateProfile = async () => {
        try {
            const result = await createProfile(newProfile)
            setNewProfile({ name: "", description: "", system_prompt: "" })
            setIsCreatingProfile(false)
            // Navigate to the new profile
            router.push(`/my/tools/chat/${result.profile.id}`)
        } catch (error) {
            console.error("Error creating profile:", error)
        }
    }

    const handleProfileSelect = (profile: Ai.Profile.Select) => {
        router.push(`/my/tools/chat/${profile.id}`)
    }

    const handleCreateDefaultProfile = async (profile: typeof defaultProfiles[0]) => {
        try {
            const result = await createProfile(profile)
            router.push(`/my/tools/chat/${result.profile.id}`)
        } catch (error) {
            console.error("Error creating default profile:", error)
        }
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                {/* Profile Selection */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">AI Profiles</h2>
                        <Button size="sm" onClick={() => setIsCreatingProfile(true)}>
                            Add Profile
                        </Button>
                    </div>

                    {profilesLoading ? (
                        <ProfileSkeleton />
                    ) : profiles.length === 0 ? (
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600 mb-3">Get started with these recommended profiles:</p>
                            {defaultProfiles.map((profile, index) => (
                                <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start text-left h-auto p-3"
                                    onClick={() => handleCreateDefaultProfile(profile)}
                                >
                                    <div>
                                        <div className="font-medium">{profile.name}</div>
                                        <div className="text-xs text-gray-500">{profile.description}</div>
                                    </div>
                                </Button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {profiles.map((profile) => (
                                <Button
                                    key={profile.id}
                                    variant="outline"
                                    className="w-full justify-start text-left h-auto p-3"
                                    onClick={() => handleProfileSelect(profile)}
                                >
                                    <div>
                                        <div className="font-medium">{profile.name}</div>
                                        <div className="text-xs opacity-70">{profile.description}</div>
                                    </div>
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Multi-Profile AI Chatbot</h2>
                        <p className="text-gray-600">Select a profile to start chatting</p>
                    </div>
                </div>
            </div>

            {/* Create Profile Modal */}
            {isCreatingProfile && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Create New Profile</CardTitle>
                            <CardDescription>Define a new AI persona for conversations</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Name</label>
                                <Input
                                    value={newProfile.name}
                                    onChange={(e) => setNewProfile((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., Career Coach"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Description</label>
                                <Input
                                    value={newProfile.description}
                                    onChange={(e) => setNewProfile((prev) => ({ ...prev, description: e.target.value }))}
                                    placeholder="Brief description of this persona"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">System Prompt</label>
                                <Textarea
                                    value={newProfile.system_prompt}
                                    onChange={(e) => setNewProfile((prev) => ({ ...prev, system_prompt: e.target.value }))}
                                    placeholder="Define how this AI persona should behave..."
                                    rows={4}
                                />
                            </div>
                            <div className="flex space-x-2">
                                <Button onClick={handleCreateProfile} className="flex-1">
                                    Create Profile
                                </Button>
                                <Button variant="outline" onClick={() => setIsCreatingProfile(false)} className="flex-1">
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
