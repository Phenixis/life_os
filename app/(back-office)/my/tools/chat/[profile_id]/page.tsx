"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AutoExpandingTextarea } from "@/components/ui/auto-expanding-textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useProfiles } from "@/hooks/chat/use-profiles"
import { useConversations } from "@/hooks/chat/use-conversations"
import { Ai } from "@/lib/db/schema"

export default function ChatProfilePage() {
    const params = useParams()
    const router = useRouter()
    const profileId = params.profile_id as string

    const [selectedProfile, setSelectedProfile] = useState<Ai.Profile.Select | null>(null)
    const [input, setInput] = useState("")
    const [isCreatingConversation, setIsCreatingConversation] = useState(false)
    const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false)

    // Use the hooks - load conversations as soon as we have a profileId
    const { profiles, isLoading: profilesLoading } = useProfiles({})
    const { createConversation } = useConversations({ profileId, enabled: !!profileId })

    // Find the current profile based on URL params - optimize to work even during loading
    useEffect(() => {
        if (profileId) {
            // If profiles are loaded, find the exact profile
            if (profiles.length > 0) {
                const profile = profiles.find(p => p.id === profileId)
                setSelectedProfile(profile || null)
            }
            // We can show loading state even when profiles are still loading
        }
    }, [profiles, profileId])

    const handleSendFirstMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || !selectedProfile || isCreatingConversation) return

        setIsCreatingConversation(true)
        
        try {
            // Create conversation with the user's message as the title (truncated)
            const conversationTitle = input.length > 50 ? `${input.substring(0, 50)}...` : input
            
            const { conversation } = await createConversation({
                profile_id: selectedProfile.id,
                title: conversationTitle,
            })
            
            // Navigate to the new conversation with the message in the URL state
            // The conversation page will handle sending the initial message
            router.push(`/my/tools/chat/${selectedProfile.id}/${conversation.id}?initialMessage=${encodeURIComponent(input)}`)
        } catch (error) {
            console.error("Error creating conversation:", error)
            setIsCreatingConversation(false)
        }
    }

    // Handle Ctrl+Enter to send the message from the textarea
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Only trigger on textarea focus and Ctrl+Enter
            if (
                event.ctrlKey &&
                event.key === "Enter" &&
                document.activeElement instanceof HTMLTextAreaElement
            ) {
                // Prevent default newline
                event.preventDefault()
                // Only send if not already creating a conversation and input is not empty
                if (!isCreatingConversation && input.trim()) {
                    // Create a synthetic form event to reuse the handler
                    const form = document.createElement("form")
                    handleSendFirstMessage({
                        preventDefault: () => {},
                        target: form,
                    } as unknown as React.FormEvent)
                }
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [input, isCreatingConversation, selectedProfile])

    return (
        <div className="flex flex-col h-full">
            {profilesLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-80 mx-auto mb-6 animate-pulse"></div>
                        <div className="h-10 bg-gray-200 rounded w-48 mx-auto animate-pulse"></div>
                    </div>
                </div>
            ) : !selectedProfile ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Multi-Profile AI Chatbot</h2>
                        <p className="text-gray-600">Select a profile to start chatting</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* AI Introduction */}
                    <div className="p-6 border-b border-gray-200 bg-white">
                        <div className="max-w-2xl mx-auto text-center">
                            <h1 className="text-2xl font-semibold text-gray-900 mb-3">
                                Hello, I&apos;m {selectedProfile.name}
                            </h1>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                {selectedProfile.description}
                            </p>
                            {selectedProfile.system_prompt && (
                                <Collapsible 
                                    open={isSystemPromptOpen} 
                                    onOpenChange={setIsSystemPromptOpen}
                                    className="mt-4"
                                >
                                    <CollapsibleTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
                                        >
                                            <span>How I work</span>
                                            {isSystemPromptOpen ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <div className="mt-2 p-4 bg-gray-50 rounded-lg text-left">
                                            <div className="text-sm text-gray-700 leading-relaxed">
                                                {selectedProfile.system_prompt.split('\n').map((paragraph, index) => (
                                                    <p key={index} className="mb-2 last:mb-0">
                                                        {paragraph.trim()}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            )}
                        </div>
                    </div>

                    {/* Chat Interface */}
                    <div className="flex-1 flex flex-col">
                        {/* Empty chat area */}
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center text-gray-500">
                                <p className="mb-2">Start a conversation by sending a message below</p>
                            </div>
                        </div>

                        {/* Message Input */}
                        <div className="p-4 pb-24 border-t border-gray-200 bg-white">
                            <div className="max-w-2xl mx-auto">
                                <form onSubmit={handleSendFirstMessage} className="flex space-x-2 items-center">
                                    <AutoExpandingTextarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder={`Send a message to ${selectedProfile.name}...`}
                                        disabled={isCreatingConversation}
                                        className="flex-1"
                                        autoFocus
                                        minRows={1}
                                        maxRows={5}
                                    />
                                    <Button 
                                        type="submit" 
                                        disabled={isCreatingConversation || !input.trim()}
                                        className="mb-1"
                                    >
                                        {isCreatingConversation ? "Starting..." : "Send"}
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
