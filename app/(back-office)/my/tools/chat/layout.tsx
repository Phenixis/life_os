"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Trash2 } from "lucide-react"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { ConversationSkeleton, ProfileSkeleton } from "@/components/ui/chat-skeletons"
import { useProfiles } from "@/hooks/chat/use-profiles"
import { useConversations } from "@/hooks/chat/use-conversations"
import { Ai } from "@/lib/db/schema"

interface ChatLayoutProps {
    children: React.ReactNode
}

export default function ChatProfileLayout({ children }: ChatLayoutProps) {
    const params = useParams()
    const router = useRouter()
    const profileId = params.profile_id as string

    const [selectedProfile, setSelectedProfile] = useState<Ai.Profile.Select | null>(null)
    const [isCreatingProfile, setIsCreatingProfile] = useState(false)
    const [editingConversationId, setEditingConversationId] = useState<string | null>(null)
    const [editingTitle, setEditingTitle] = useState("")
    const [editingProfileId, setEditingProfileId] = useState<string | null>(null)
    const [editingProfileData, setEditingProfileData] = useState({
        name: "",
        description: "",
        system_prompt: "",
    })
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean
        conversationId: string
        conversationTitle: string
    }>({
        open: false,
        conversationId: "",
        conversationTitle: ""
    })
    const [deleteProfileDialog, setDeleteProfileDialog] = useState<{
        open: boolean
        profileId: string
        profileName: string
    }>({
        open: false,
        profileId: "",
        profileName: ""
    })
    const [newProfile, setNewProfile] = useState({
        name: "",
        description: "",
        system_prompt: "",
    })

    // Use the hooks - load conversations as soon as we have a profileId
    const { profiles, isLoading: profilesLoading, createProfile, updateProfile, deleteProfile } = useProfiles({})
    const { conversations, isLoading: conversationsLoading, deleteConversation, updateConversation } = useConversations({ profileId, enabled: !!profileId })

    // Find the current profile based on URL params - optimize to work even during loading
    useEffect(() => {
        if (profileId) {
            // If profiles are loaded, find the exact profile
            if (profiles.length > 0) {
                const profile = profiles.find(p => p.id === profileId)
                setSelectedProfile(profile || null)
            }
            // If profiles are still loading but we have a profileId, we can still show loading state
            // The sidebar will show the conversations loading state appropriately
        }
    }, [profiles, profileId])

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

    const handleConversationSelect = (conversation: Ai.Conversation.Select) => {
        router.push(`/my/tools/chat/${profileId}/${conversation.id}`)
    }

    const handleCreateDefaultProfile = async (profile: typeof defaultProfiles[0]) => {
        try {
            const result = await createProfile(profile)
            router.push(`/my/tools/chat/${result.profile.id}`)
        } catch (error) {
            console.error("Error creating default profile:", error)
        }
    }

    const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent conversation selection
        
        const conversation = conversations.find(c => c.id === conversationId)
        setDeleteDialog({
            open: true,
            conversationId,
            conversationTitle: conversation?.title || 'this conversation'
        })
    }

    const confirmDeleteConversation = async () => {
        try {
            // If we're currently viewing this conversation, redirect to profile page
            if (params.conversation_id === deleteDialog.conversationId) {
                router.push(`/my/tools/chat/${profileId}`)
            }
            await deleteConversation(deleteDialog.conversationId)
        } catch (error) {
            console.error("Error deleting conversation:", error)
            // You could add a toast notification here instead of alert
        }
    }

    const handleStartEditConversation = (conversation: Ai.Conversation.Select, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent conversation selection
        setEditingConversationId(conversation.id)
        setEditingTitle(conversation.title)
    }

    const handleSaveConversationTitle = async (conversationId: string) => {
        if (!editingTitle.trim()) {
            setEditingConversationId(null)
            setEditingTitle("")
            return
        }

        try {
            await updateConversation(conversationId, { title: editingTitle.trim() })
            setEditingConversationId(null)
            setEditingTitle("")
        } catch (error) {
            console.error("Error updating conversation:", error)
            // You could add a toast notification here instead of alert
            // Keep editing mode open on error
        }
    }

    const handleCancelEdit = () => {
        setEditingConversationId(null)
        setEditingTitle("")
    }

    const handleKeyDown = (e: React.KeyboardEvent, conversationId: string) => {
        if (e.key === "Enter") {
            handleSaveConversationTitle(conversationId)
        } else if (e.key === "Escape") {
            handleCancelEdit()
        }
    }

    // Profile management functions
    const handleStartEditProfile = (profile: Ai.Profile.Select, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingProfileId(profile.id)
        setEditingProfileData({
            name: profile.name,
            description: profile.description,
            system_prompt: profile.system_prompt,
        })
    }

    const handleSaveProfile = async () => {
        if (!editingProfileId || !editingProfileData.name.trim()) {
            handleCancelProfileEdit()
            return
        }

        try {
            await updateProfile(editingProfileId, {
                name: editingProfileData.name.trim(),
                description: editingProfileData.description.trim(),
                system_prompt: editingProfileData.system_prompt.trim(),
            })
            setEditingProfileId(null)
            setEditingProfileData({ name: "", description: "", system_prompt: "" })
        } catch (error) {
            console.error("Error updating profile:", error)
        }
    }

    const handleCancelProfileEdit = () => {
        setEditingProfileId(null)
        setEditingProfileData({ name: "", description: "", system_prompt: "" })
    }

    const handleDeleteProfile = (profile: Ai.Profile.Select, e: React.MouseEvent) => {
        e.stopPropagation()
        setDeleteProfileDialog({
            open: true,
            profileId: profile.id,
            profileName: profile.name
        })
    }

    const confirmDeleteProfile = async () => {
        try {
            // If we're currently viewing this profile, redirect to main chat page
            if (profileId === deleteProfileDialog.profileId) {
                router.push(`/my/tools/chat`)
            }
            await deleteProfile(deleteProfileDialog.profileId)
        } catch (error) {
            console.error("Error deleting profile:", error)
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
                                <div key={profile.id} className="group relative">
                                    <Button
                                        variant={selectedProfile?.id === profile.id ? "default" : "outline"}
                                        className="w-full justify-start text-left h-auto p-3 pr-16 group-hover:pr-20 transition-all"
                                        onClick={() => handleProfileSelect(profile)}
                                    >
                                        <div>
                                            <div className="font-medium">{profile.name}</div>
                                            <div className="text-xs opacity-70">{profile.description}</div>
                                        </div>
                                    </Button>
                                    
                                    {/* Hover action buttons */}
                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-md p-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 hover:bg-blue-100 hover:text-blue-600"
                                            onClick={(e) => handleStartEditProfile(profile, e)}
                                            title="Edit profile"
                                        >
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 hover:bg-red-100 hover:text-red-600"
                                            onClick={(e) => handleDeleteProfile(profile, e)}
                                            title="Delete profile"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Conversations - show as soon as we have a profileId */}
                {(profileId && (selectedProfile || profilesLoading)) && (
                    <div className="flex-1 p-4">
                        <div className="mb-4">
                            <h3 className="font-medium">Conversations</h3>
                            <p className="text-xs text-gray-500 mt-1">Previous chats with this profile</p>
                        </div>
                        {conversationsLoading ? (
                            <ConversationSkeleton />
                        ) : conversations.length === 0 ? (
                            <div className="text-sm text-gray-500 text-center py-4">
                                No conversations yet. Start your first chat!
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {conversations.map((conversation) => (
                                    <div key={conversation.id} className="group relative">
                                        {editingConversationId === conversation.id ? (
                                            <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                                                <Input
                                                    value={editingTitle}
                                                    onChange={(e) => setEditingTitle(e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, conversation.id)}
                                                    onBlur={() => handleSaveConversationTitle(conversation.id)}
                                                    className="text-sm h-8 bg-white"
                                                    autoFocus
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <Button
                                                    variant={params.conversation_id === conversation.id ? "default" : "ghost"}
                                                    className="w-full justify-start text-left h-auto p-3 pr-16 group-hover:pr-20 transition-all"
                                                    onClick={() => handleConversationSelect(conversation)}
                                                >
                                                    <div className="truncate">{conversation.title}</div>
                                                </Button>
                                                
                                                {/* Hover action buttons */}
                                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-md p-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 hover:bg-blue-100 hover:text-blue-600"
                                                        onClick={(e) => handleStartEditConversation(conversation, e)}
                                                        title="Rename conversation"
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 hover:bg-red-100 hover:text-red-600"
                                                        onClick={(e) => handleDeleteConversation(conversation.id, e)}
                                                        title="Delete conversation"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1">
                {children}
            </div>

            {/* Create Profile Modal */}
            {isCreatingProfile && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
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

            {/* Edit Profile Modal */}
            {editingProfileId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <CardHeader>
                            <CardTitle>Edit Profile</CardTitle>
                            <CardDescription>Update the AI persona details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Name</label>
                                <Input
                                    value={editingProfileData.name}
                                    onChange={(e) => setEditingProfileData((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., Career Coach"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Description</label>
                                <Input
                                    value={editingProfileData.description}
                                    onChange={(e) => setEditingProfileData((prev) => ({ ...prev, description: e.target.value }))}
                                    placeholder="Brief description of this persona"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">System Prompt</label>
                                <Textarea
                                    value={editingProfileData.system_prompt}
                                    onChange={(e) => setEditingProfileData((prev) => ({ ...prev, system_prompt: e.target.value }))}
                                    placeholder="Define how this AI persona should behave..."
                                    rows={6}
                                    className="resize-none"
                                />
                            </div>
                            <div className="flex space-x-2">
                                <Button onClick={handleSaveProfile} className="flex-1">
                                    Save Changes
                                </Button>
                                <Button variant="outline" onClick={handleCancelProfileEdit} className="flex-1">
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmationDialog
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
                title="Delete Conversation"
                description={`Are you sure you want to delete "${deleteDialog.conversationTitle}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDeleteConversation}
                variant="destructive"
            />

            {/* Delete Profile Confirmation Dialog */}
            <ConfirmationDialog
                open={deleteProfileDialog.open}
                onOpenChange={(open) => setDeleteProfileDialog(prev => ({ ...prev, open }))}
                title="Delete Profile"
                description={`Are you sure you want to delete the profile "${deleteProfileDialog.profileName}"? This will also delete all conversations with this profile. This action cannot be undone.`}
                confirmText="Delete Profile"
                cancelText="Cancel"
                onConfirm={confirmDeleteProfile}
                variant="destructive"
            />
        </div>
    )
}
