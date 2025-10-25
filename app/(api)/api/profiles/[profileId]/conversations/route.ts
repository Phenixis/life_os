import type { NextRequest } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { getConversationsByProfile, getProfile } from "@/lib/db/queries/chat"

export async function GET(request: NextRequest, { params }: { params: Promise<{ profileId: string }> }) {
  try {
    const verification = await verifyRequest(request)
    if ("error" in verification) return verification.error

    // Verify profile exists and belongs to user
    const parameters = await params
    const profile = await getProfile(parameters.profileId, verification.userId)
    if (!profile) {
      return Response.json({ error: "Profile not found" }, { status: 404 })
    }

    const conversations = await getConversationsByProfile(parameters.profileId, verification.userId)
    return Response.json({ conversations })
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
