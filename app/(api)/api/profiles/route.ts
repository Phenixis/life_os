import type { NextRequest } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { createProfile, getProfilesByUser } from "@/lib/db/queries/chat"

export async function GET(request: NextRequest) {
  try {
    const verification = await verifyRequest(request)
    if ("error" in verification) return verification.error

    const profiles = await getProfilesByUser(verification.userId)
    return Response.json({ profiles })
  } catch (error) {
    console.error("Error fetching profiles:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const verification = await verifyRequest(request)
    if ("error" in verification) return verification.error

    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.description || !body.system_prompt) {
      return Response.json(
        {
          error: "Name, description, and system_prompt are required",
        },
        { status: 400 },
      )
    }

    const profile = await createProfile(verification.userId, {
      name: body.name,
      description: body.description,
      system_prompt: body.system_prompt,
      avatar_url: body.avatar_url,
    })

    return Response.json({ profile }, { status: 201 })
  } catch (error) {
    console.error("Error creating profile:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
