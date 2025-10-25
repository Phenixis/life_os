import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth/api';
import * as MovieQueries from '@/lib/db/queries/movie/movie';

/**
 * GET /api/movie/stats
 * Get user's movie statistics
 */
export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const verification = await verifyRequest(request);
        if ('error' in verification) {
            return verification.error;
        }

        const userId = verification.userId;
        const stats = await MovieQueries.getMovieStats(userId);

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Movie stats error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
