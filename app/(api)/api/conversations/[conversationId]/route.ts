import type { NextRequest } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { getConversation, deleteConversation, updateConversation, getMessages } from "@/lib/db/queries/chat"

export async function GET(request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const verification = await verifyRequest(request)
    if ("error" in verification) return verification.error

    const parameters = await params
    const conversation = await getConversation(parameters.conversationId, verification.userId)
    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 })
    }

    const messages = await getMessages(parameters.conversationId, verification.userId)

    return Response.json({ conversation, messages })
  } catch (error) {
    console.error("Error fetching conversation:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const verification = await verifyRequest(request)
    if ("error" in verification) return verification.error

    const parameters = await params
    const body = await request.json()
    
    const updatedConversation = await updateConversation(parameters.conversationId, verification.userId, body)
    if (!updatedConversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 })
    }

    return Response.json({ conversation: updatedConversation })
  } catch (error) {
    console.error("Error updating conversation:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const verification = await verifyRequest(request)
    if ("error" in verification) return verification.error

    const parameters = await params
    const deleted = await deleteConversation(parameters.conversationId, verification.userId)
    if (!deleted) {
      return Response.json({ error: "Conversation not found" }, { status: 404 })
    }

    return Response.json({ message: "Conversation deleted successfully" })
  } catch (error) {
    console.error("Error deleting conversation:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
