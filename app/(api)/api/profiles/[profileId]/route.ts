import type { NextRequest } from "next/server"
import { verifyRequest } from "@/lib/auth/api"
import { getProfile, updateProfile, deleteProfile } from "@/lib/db/queries/chat"

export async function GET(request: NextRequest, { params }: { params: Promise<{ profileId: string }> }) {
  try {
    const verification = await verifyRequest(request)
    if ("error" in verification) return verification.error

    const parameters = await params
    const profile = await getProfile(parameters.profileId, verification.userId)
    if (!profile) {
      return Response.json({ error: "Profile not found" }, { status: 404 })
    }

    return Response.json({ profile })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ profileId: string }> }) {
  try {
    const verification = await verifyRequest(request)
    if ("error" in verification) return verification.error

    const body = await request.json()
    const parameters = await params
    const profile = await updateProfile(parameters.profileId, verification.userId, body)

    if (!profile) {
      return Response.json({ error: "Profile not found" }, { status: 404 })
    }

    return Response.json({ profile })
  } catch (error) {
    console.error("Error updating profile:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ profileId: string }> }) {
  try {
    const verification = await verifyRequest(request)
    if ("error" in verification) return verification.error

    const parameters = await params
    const deleted = await deleteProfile(parameters.profileId, verification.userId)
    if (!deleted) {
      return Response.json({ error: "Profile not found" }, { status: 404 })
    }

    return Response.json({ message: "Profile deleted successfully" })
  } catch (error) {
    console.error("Error deleting profile:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
