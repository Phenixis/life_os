import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth/api';
import * as MovieQueries from '@/lib/db/queries/movie/movie';

/**
 * GET /api/movie/list
 * Get user's movie list
 */
export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const verification = await verifyRequest(request);
        if ('error' in verification) {
            return verification.error;
        }

        const userId = verification.userId;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') as 'will_watch' | 'watched' | "watch_again" | null;
        const search = searchParams.get('search');

        let movies;

        if (search) {
            movies = await MovieQueries.searchUserMovies(userId, search);
        } else if (status) {
            movies = await MovieQueries.getMoviesByStatus(userId, status);
        } else {
            movies = await MovieQueries.getUserMovies(userId);
        }

        return NextResponse.json({ movies });
    } catch (error) {
        console.error('Movie list error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
