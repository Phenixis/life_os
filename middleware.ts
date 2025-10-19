import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken, signToken } from "@/lib/auth/session"

export type ActionState = {
	error?: string
	success?: string
	[key: string]: any // This allows for additional properties
}

const protectedRoutes = ["/my"]
const unaccessibleWhenLoggedIn = ["/login"]
const apiRoutes = ["/api"]
const apiRoutesWithoutAPIKey = ["/api/auth", "/api/stripe/checkout"]

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl

	// Handle API routes
	if (apiRoutes.some(route => pathname.startsWith(route))) {
		if (apiRoutesWithoutAPIKey.some(route => pathname.startsWith(route))) {
			// If the route does not require an API key, let it pass
			return NextResponse.next()
		}
		const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '')
		
		if (!apiKey) {
			return NextResponse.json({ error: 'Missing API key' }, { status: 401 })
		}

		// Let the API route handle the actual verification
		return NextResponse.next()
	}

	// Get the session cookie directly from the request
	const sessionCookie = request.cookies.get("session")?.value

	// Verify the session token
	const session = sessionCookie ? await verifyToken(sessionCookie) : null

	const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))

	// Handle protected routes
	if (isProtectedRoute && !session) {
		return NextResponse.redirect(new URL(`/login?redirectTo=${pathname}`, request.url))
	}

	// Handle routes that shouldn't be accessible when logged in
	if (unaccessibleWhenLoggedIn.includes(pathname) && session) {
		return NextResponse.redirect(new URL("/my", request.url))
	}

	// If we have a valid session, extend it
	if (session) {
		// Create a new response or clone the original
		const response = NextResponse.next()

		// Extend session expiration
		const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000)
		const sessionData = {
			expires: expiresInOneDay.toISOString(),
			userId: session.userId,
		}

		// Sign a new token
		const newToken = await signToken(sessionData)

		// Set the new cookie in the response
		response.cookies.set({
			name: "session",
			value: newToken,
			expires: expiresInOneDay,
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			path: "/",
		})

		return response
	}

	// Default: continue with the request
	return NextResponse.next()
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
