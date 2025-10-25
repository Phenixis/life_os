import { Ai } from "@/lib/db/schema"

// API request types
export interface CreateProfileRequest {
  name: string
  description: string
  system_prompt: string
  avatar_url?: string
}

export interface CreateConversationRequest {
  profile_id: string
  title?: string
}

export interface SendMessageRequest {
  message: string
}

// API response types
export interface ProfileResponse {
  profile: Ai.Profile.Select
}

export interface ProfilesResponse {
  profiles: Ai.Profile.Select[]
}

export interface ConversationResponse {
  conversation: Ai.Conversation.Select
}

export interface ConversationsResponse {
  conversations: Ai.Conversation.Select[]
}

export interface MessagesResponse {
  messages: Ai.Message.Select[]
}

export interface ConversationWithMessagesResponse {
  conversation: Ai.Conversation.Select
  messages: Ai.Message.Select[]
}
