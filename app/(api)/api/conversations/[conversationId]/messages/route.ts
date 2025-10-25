import type { NextRequest } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { getMessages, clearMessages } from "@/lib/db/queries/chat"

export async function GET(request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const verification = await verifyRequest(request)
    if ("error" in verification) return verification.error

    const parameters = await params
    const messages = await getMessages(parameters.conversationId, verification.userId)
    return Response.json({ messages })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const verification = await verifyRequest(request)
    if ("error" in verification) return verification.error

    const parameters = await params
    const cleared = await clearMessages(parameters.conversationId, verification.userId)
    if (!cleared) {
      return Response.json({ error: "Conversation not found" }, { status: 404 })
    }

    return Response.json({ message: "Messages cleared successfully" })
  } catch (error) {
    console.error("Error clearing messages:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
