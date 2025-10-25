"use client"

import { useFilteredData } from "../use-filtered-data"
import { ApiClient } from "@/lib/api-client"
import { useUser } from "../use-user"
import { Ai } from "@/lib/db/schema"
import type { CreateConversationRequest } from "@/lib/types/chat"

// Type for the API response structure
interface ConversationsApiResponse {
  conversations: Ai.Conversation.Select[]
}

interface UseConversationsParams {
  profileId?: string
  enabled?: boolean
  skipFetch?: boolean
}

export function useConversations(params: UseConversationsParams = {}) {
  const { profileId, enabled = true, skipFetch = false } = params
  const { user } = useUser()

  const {
    data: conversationsData,
    isLoading,
    isError,
    mutate,
  } = useFilteredData<ConversationsApiResponse>({
    endpoint: profileId ? `/api/profiles/${profileId}/conversations` : "",
    skipFetch: !user?.api_key || !profileId || !enabled || skipFetch,
  })

  const conversations = (conversationsData?.conversations || []) as Ai.Conversation.Select[]

  const createConversation = async (data: CreateConversationRequest) => {
    if (!user?.api_key) throw new Error("No API key available")

    try {
      const apiClient = new ApiClient(user.api_key)
      const result = await apiClient.createConversation(data)

      // Optimistically add to local state
      const newConversation = result.conversation
      const optimisticConversations = [...conversations, newConversation]
      mutate({ conversations: optimisticConversations }, false)

      // Revalidate to ensure consistency
      await mutate()

      return result
    } catch (error) {
      // Revalidate on error to ensure consistency
      await mutate()
      throw error
    }
  }

  const deleteConversation = async (conversationId: string) => {
    if (!user?.api_key) throw new Error("No API key available")

    // Optimistically remove from local state
    const optimisticConversations = conversations.filter(conv => conv.id !== conversationId)
    mutate({ conversations: optimisticConversations }, false)

    try {
      const apiClient = new ApiClient(user.api_key)
      const result = await apiClient.deleteConversation(conversationId)
      
      // Revalidate to ensure consistency
      await mutate()
      
      return result
    } catch (error) {
      // Revert optimistic update on error
      await mutate()
      throw error
    }
  }

  const updateConversation = async (conversationId: string, data: { title?: string; is_archived?: boolean }) => {
    if (!user?.api_key) throw new Error("No API key available")

    // Optimistically update the local state
    const optimisticConversations = conversations.map(conv => 
      conv.id === conversationId 
        ? { ...conv, ...data, updated_at: new Date() }
        : conv
    )
    
    mutate({ conversations: optimisticConversations }, false)

    try {
      const apiClient = new ApiClient(user.api_key)
      const result = await apiClient.updateConversation(conversationId, data)
      
      // Update with the actual result
      await mutate()
      
      return result
    } catch (error) {
      // Revert optimistic update on error
      await mutate()
      throw error
    }
  }

  return {
    data: conversations,
    isLoading,
    isError,
    conversations, // Keep backward compatibility
    createConversation,
    deleteConversation,
    updateConversation,
    mutate,
  }
}
