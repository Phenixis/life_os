import { fetcher } from "@/lib/fetcher"
import type { CreateProfileRequest, CreateConversationRequest } from "./types/chat"
import { Ai } from "@/lib/db/schema"

export class ApiClient {
  constructor(private apiKey: string) {}

  // Profile methods
  async getProfiles() {
    return fetcher("/api/profiles", this.apiKey) as Promise<{ profiles: Ai.Profile.Select[] }>
  }

  async createProfile(data: CreateProfileRequest) {
    const response = await fetch("/api/profiles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = new Error("Failed to create profile") as Error & { info?: unknown; status?: number }
      const info = await response.json()
      console.log(info)
      error.info = info
      error.status = response.status
      throw error
    }

    return response.json() as Promise<{ profile: Ai.Profile.Select }>
  }

  async updateProfile(profileId: string, data: Partial<Ai.Profile.Select>) {
    const response = await fetch(`/api/profiles/${profileId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = new Error("Failed to update profile") as Error & { info?: unknown; status?: number }
      const info = await response.json()
      error.info = info
      error.status = response.status
      throw error
    }

    return response.json() as Promise<{ profile: Ai.Profile.Select }>
  }

  async deleteProfile(profileId: string) {
    const response = await fetch(`/api/profiles/${profileId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok) {
      const error = new Error("Failed to delete profile") as Error & { info?: unknown; status?: number }
      const info = await response.json()
      error.info = info
      error.status = response.status
      throw error
    }

    return response.json() as Promise<{ message: string }>
  }

  // Conversation methods
  async createConversation(data: CreateConversationRequest) {
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = new Error("Failed to create conversation") as Error & { info?: unknown; status?: number }
      const info = await response.json()
      error.info = info
      error.status = response.status
      throw error
    }

    return response.json() as Promise<{ conversation: Ai.Conversation.Select }>
  }

  async deleteConversation(conversationId: string) {
    const response = await fetch(`/api/conversations/${conversationId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok) {
      const error = new Error("Failed to delete conversation") as Error & { info?: unknown; status?: number }
      const info = await response.json()
      error.info = info
      error.status = response.status
      throw error
    }

    return response.json() as Promise<{ message: string }>
  }

  async updateConversation(conversationId: string, data: { title?: string; is_archived?: boolean }) {
    const response = await fetch(`/api/conversations/${conversationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = new Error("Failed to update conversation") as Error & { info?: unknown; status?: number }
      const info = await response.json()
      error.info = info
      error.status = response.status
      throw error
    }

    return response.json() as Promise<{ conversation: Ai.Conversation.Select }>
  }
}
