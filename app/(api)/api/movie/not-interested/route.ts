import { verifyRequest } from '@/lib/auth/api';
import * as MovieNotInterestedQueries from '@/lib/db/queries/movie/not-interested';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/movie/not-interested
 * Mark a movie as "not interested"
 */
export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const verification = await verifyRequest(request);
        if ('error' in verification) {
            return verification.error;
        }

        const userId = verification.userId;
        const body = await request.json();
        const { tmdb_id, media_type, title } = body;

        // Validate required fields
        if (!tmdb_id || !media_type || !title) {
            return NextResponse.json(
                { error: 'tmdb_id, media_type, and title are required' },
                { status: 400 }
            );
        }

        // Validate media_type
        if (media_type !== 'movie' && media_type !== 'tv') {
            return NextResponse.json(
                { error: 'media_type must be "movie" or "tv"' },
                { status: 400 }
            );
        }

        // Mark as not interested
        const notInterestedMovie = await MovieNotInterestedQueries.markAsNotInterested(
            userId,
            tmdb_id,
            media_type,
            title
        );

        return NextResponse.json({
            success: true,
            data: notInterestedMovie
        });

    } catch (error) {
        console.error('Mark as not interested error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/movie/not-interested
 * Remove a movie from "not interested" list
 */
export async function DELETE(request: NextRequest) {
    try {
        // Check authentication
        const verification = await verifyRequest(request);
        if ('error' in verification) {
            return verification.error;
        }

        const userId = verification.userId;
        const { searchParams } = new URL(request.url);
        const tmdb_id = parseInt(searchParams.get('tmdb_id') || '0');
        const media_type = searchParams.get('media_type') as 'movie' | 'tv';

        // Validate required fields
        if (!tmdb_id || !media_type) {
            return NextResponse.json(
                { error: 'tmdb_id and media_type are required' },
                { status: 400 }
            );
        }

        // Validate media_type
        if (media_type !== 'movie' && media_type !== 'tv') {
            return NextResponse.json(
                { error: 'media_type must be "movie" or "tv"' },
                { status: 400 }
            );
        }

        // Remove from not interested
        await MovieNotInterestedQueries.removeFromNotInterested(userId, tmdb_id, media_type);

        return NextResponse.json({
            success: true
        });

    } catch (error) {
        console.error('Remove from not interested error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
