import type { NextRequest } from "next/server"
import { streamText } from "ai"
import { groq, GROQ_MODEL } from "@/lib/services/groq"
import { verifyRequest } from "@/lib/auth/api"
import { getConversationWithProfile, addMessage, getMessages } from "@/lib/db/queries/chat"

export const maxDuration = 30

export async function POST(request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const verification = await verifyRequest(request)
    if ("error" in verification) return verification.error

    const { message } = await request.json()

    if (!message || typeof message !== "string") {
      return Response.json({ error: "Message is required" }, { status: 400 })
    }

    // Get conversation and profile in one query
    const parameters = await params
    const conversationData = await getConversationWithProfile(parameters.conversationId, verification.userId)
    if (!conversationData) {
      return Response.json({ error: "Conversation not found" }, { status: 404 })
    }

    const { profile } = conversationData

    // Add user message to database
    await addMessage(parameters.conversationId, "user", message)

    // Get conversation history
    const messages = await getMessages(parameters.conversationId, verification.userId)

    // Convert to AI SDK format
    const aiMessages = messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }))

    // Generate AI response
    const result = streamText({
      model: groq(GROQ_MODEL),
      system: profile.system_prompt,
      messages: aiMessages,
      onFinish: async ({ text, usage }) => {
        // Save AI response to database with token count
        await addMessage(parameters.conversationId, "assistant", text, usage?.totalTokens)
      },
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in chat:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
