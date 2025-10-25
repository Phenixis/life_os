import type { NextRequest } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { createConversation, getProfile } from "@/lib/db/queries/chat"

export async function POST(request: NextRequest) {
  try {
    const verification = await verifyRequest(request)
    if ("error" in verification) return verification.error

    const body = await request.json()

    if (!body.profile_id) {
      return Response.json({ error: "Profile ID is required" }, { status: 400 })
    }

    // Verify profile exists and belongs to user
    const profile = await getProfile(body.profile_id, verification.userId)
    if (!profile) {
      return Response.json({ error: "Profile not found" }, { status: 404 })
    }

    const conversation = await createConversation(verification.userId, body.profile_id, body.title)

    return Response.json({ conversation }, { status: 201 })
  } catch (error) {
    console.error("Error creating conversation:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
