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
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Multi-Profile AI Chatbot</h2>
                        <p className="text-gray-600">Select a profile to start chatting</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
