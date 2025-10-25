"use client"

import { useFilteredData } from "../use-filtered-data"
import { useUser } from "../use-user"
import { Ai } from "@/lib/db/schema"
import { useState, useEffect } from "react"

// Type for the API response structure
interface MessagesApiResponse {
  messages: Ai.Message.Select[]
}

interface UseMessagesParams {
  conversationId?: string
  skipFetch?: boolean
}

export function useMessages(params: UseMessagesParams = {}) {
  const { conversationId, skipFetch = false } = params
  const { user } = useUser()

  const {
    data: messagesData,
    isLoading,
    isError,
    mutate,
  } = useFilteredData<MessagesApiResponse>({
    endpoint: conversationId ? `/api/conversations/${conversationId}/messages` : "",
    skipFetch: !user?.api_key || !conversationId || skipFetch,
  })

  const serverMessages = (messagesData?.messages || []) as Ai.Message.Select[]
  
  // Local state for optimistic messages
  const [optimisticMessages, setOptimisticMessages] = useState<Ai.Message.Select[]>([])

  // Combine server messages with optimistic messages, removing duplicates
  const allMessages = [...serverMessages]
  
  // Add optimistic messages that don't exist in server messages
  for (const optimisticMsg of optimisticMessages) {
    const existsInServer = allMessages.some(serverMsg => serverMsg.id === optimisticMsg.id)
    if (!existsInServer) {
      allMessages.push(optimisticMsg)
    }
  }

  // Sort messages by creation date to maintain order
  allMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  // Clear optimistic messages when server messages change (they've been persisted)
  useEffect(() => {
    if (serverMessages.length > 0) {
      // Remove optimistic messages that now exist in server messages
      setOptimisticMessages(prev => 
        prev.filter(optimisticMsg => {
          // Only check for temporary messages (those with temp_ IDs)
          if (!optimisticMsg.id.startsWith("temp_")) {
            return true // Keep non-temp messages
          }
          
          // Check if this temp message has been persisted to server
          return !serverMessages.some(serverMsg => {
            // For user messages: match by content and role (since content should be unique enough)
            // For assistant messages: match by content if it's substantial (more than just "thinking")
            if (optimisticMsg.role === "user") {
              return serverMsg.content === optimisticMsg.content && 
                     serverMsg.role === optimisticMsg.role &&
                     Math.abs(new Date(serverMsg.created_at).getTime() - optimisticMsg.created_at.getTime()) < 60000 // Within 1 minute
            } else {
              // For assistant messages, only remove if content is substantial and matches
              return serverMsg.content === optimisticMsg.content && 
                     serverMsg.role === optimisticMsg.role &&
                     optimisticMsg.content.length > 10 // Only if message has substantial content
            }
          })
        })
      )
    }
  }, [serverMessages])

  const updateOptimisticMessages = (messageOrMessages: Ai.Message.Select | Ai.Message.Select[]) => {
    if (Array.isArray(messageOrMessages)) {
      setOptimisticMessages(prev => {
        const newMessages = [...prev]
        
        for (const message of messageOrMessages) {
          const existingIndex = newMessages.findIndex(m => m.id === message.id)
          if (existingIndex >= 0) {
            // Update existing optimistic message
            newMessages[existingIndex] = message
          } else {
            // Add new optimistic message
            newMessages.push(message)
          }
        }
        
        return newMessages
      })
    } else {
      setOptimisticMessages(prev => {
        const existingIndex = prev.findIndex(m => m.id === messageOrMessages.id)
        if (existingIndex >= 0) {
          // Update existing optimistic message
          const updated = [...prev]
          updated[existingIndex] = messageOrMessages
          return updated
        } else {
          // Add new optimistic message
          return [...prev, messageOrMessages]
        }
      })
    }
  }

  const refreshMessages = () => {
    mutate()
  }

  const replaceTemporaryMessages = () => {
    // Clear all optimistic messages and refresh from server
    setOptimisticMessages([])
    mutate()
  }

  return {
    data: allMessages,
    isLoading,
    isError,
    isPending: false, // We don't need this with the new approach
    messages: allMessages, // Keep backward compatibility
    updateOptimisticMessages,
    refreshMessages,
    replaceTemporaryMessages,
    mutate,
  }
}
