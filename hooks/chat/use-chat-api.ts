"use client"

import { useState, useCallback } from "react"
import { useUser } from "../use-user"
import { Ai } from "@/lib/db/schema"

interface UseChatApiParams {
    conversationId: string
    onOptimisticUpdate?: (messages: Ai.Message.Select[]) => void
    onComplete?: () => void
    onError?: (error: string) => void
    onStreamStart?: () => void
    onStreamUpdate?: (content: string) => void
}

export function useChatApi(params: UseChatApiParams) {
    const { conversationId, onOptimisticUpdate, onComplete, onError, onStreamStart, onStreamUpdate } = params
    const [isLoading, setIsLoading] = useState(false)
    const [isError, setIsError] = useState(false)
    const [isStreaming, setIsStreaming] = useState(false)
    const { user } = useUser()

    const sendMessage = useCallback(
        async (content: string) => {
            if (!content.trim() || isLoading || !user?.api_key) return

            setIsLoading(true)
            setIsError(false)

            // Generate temporary IDs for optimistic updates
            const tempUserId = `temp_user_${Date.now()}`
            const tempAiId = `temp_ai_${Date.now()}_${Math.random()}`

            // Create optimistic user message
            const optimisticUserMessage: Ai.Message.Select = {
                id: tempUserId,
                conversation_id: conversationId,
                role: "user",
                content,
                created_at: new Date(),
                token_count: null,
            }

            // Create optimistic AI message (initially empty for streaming)
            const optimisticAiMessage: Ai.Message.Select = {
                id: tempAiId,
                conversation_id: conversationId,
                role: "assistant",
                content: "",
                created_at: new Date(),
                token_count: null,
            }

            // Add optimistic user message immediately
            onOptimisticUpdate?.([optimisticUserMessage])

            try {
                const response = await fetch(`/api/chat/${conversationId}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${user.api_key}`,
                    },
                    body: JSON.stringify({ message: content }),
                })

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`)
                }

                const reader = response.body?.getReader()
                if (!reader) throw new Error("No response body")

                let assistantMessage = ""
                let hasAddedAiMessage = false

                // Set streaming state
                setIsStreaming(true)
                onStreamStart?.()

                // Stream the response and update the AI message
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    const chunk = new TextDecoder().decode(value)
                    const lines = chunk.split("\n")

                    for (const line of lines) {
                        if (line.startsWith("0:")) {
                            try {
                                const data = JSON.parse(line.slice(2))
                                if (data.type === "text-delta") {
                                    assistantMessage += data.textDelta

                                    // Create/update the AI message with streaming content
                                    const updatedAiMessage: Ai.Message.Select = {
                                        ...optimisticAiMessage,
                                        content: assistantMessage,
                                    }

                                    // Add or update the AI message
                                    if (!hasAddedAiMessage) {
                                        hasAddedAiMessage = true
                                        // Add the AI message for the first time
                                        onOptimisticUpdate?.([updatedAiMessage])
                                    } else {
                                        // Update the existing AI message content
                                        onOptimisticUpdate?.([updatedAiMessage])
                                    }

                                    // Notify stream update
                                    onStreamUpdate?.(assistantMessage)
                                }
                            } catch (e) {
                                // Ignore parsing errors for streaming data
                            }
                        }
                    }
                }

                // Streaming complete
                setIsStreaming(false)

                // Notify completion to refresh real messages from server
                onComplete?.()
            } catch (error) {
                console.error("Chat error:", error)
                setIsError(true)
                setIsStreaming(false)
                onError?.(error instanceof Error ? error.message : "Unknown error")

                // On error, we should trigger a refresh to remove optimistic messages
                onComplete?.()
            } finally {
                setIsLoading(false)
                setIsStreaming(false)
            }
        },
        [conversationId, user?.api_key, isLoading, onOptimisticUpdate, onComplete, onError, onStreamUpdate],
    )

    return {
        sendMessage,
        isLoading,
        isError,
        isStreaming,
        isPending: false, // Simplified since we're not using transitions
    }
}
