import { verifyRequest } from '@/lib/auth/api';
import * as MovieQueries from '@/lib/db/queries/movie/movie';
import { Movie } from '@/lib/db/schema';
import TMDbService from '@/lib/services/tmdb';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/movie
 * Add a movie to user's list
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
        const { tmdb_id, media_type, watch_status = 'will_watch', user_rating } = body;

        if (!tmdb_id || !media_type || !['movie', 'tv'].includes(media_type)) {
            return NextResponse.json({
                error: 'tmdb_id and media_type (movie or tv) are required'
            }, { status: 400 });
        }

        // Validate rating if provided
        if (user_rating !== null && user_rating !== undefined) {
            if (user_rating < 0.5 || user_rating > 5 || (user_rating * 2) % 1 !== 0) {
                return NextResponse.json({
                    error: 'Rating must be between 0.5 and 5.0 in 0.5 increments'
                }, { status: 400 });
            }
        }

        // Check if movie already exists
        const existingMovie = await MovieQueries.getMovieByTmdbId(userId, tmdb_id, media_type);
        if (existingMovie) {
            return NextResponse.json({
                error: 'Movie already in your list',
                movie: existingMovie
            }, { status: 409 });
        }

        // Get movie details from TMDb
        const tmdbApiKey = process.env.TMDB_ACCESS_TOKEN;
        if (!tmdbApiKey) {
            return NextResponse.json({ error: 'TMDb API key not configured' }, { status: 500 });
        }

        const tmdbService = new TMDbService(tmdbApiKey);
        let movieDetails;

        if (media_type === 'movie') {
            movieDetails = await tmdbService.getMovieDetails(tmdb_id);
        } else {
            movieDetails = await tmdbService.getTVDetails(tmdb_id);
        }

        // Create movie record
        const movieData: Omit<Movie.Movie.Insert, 'created_at' | 'updated_at'> = {
            user_id: userId,
            tmdb_id,
            media_type,
            // Use type narrowing to safely access the correct property for title
            title: media_type === 'movie'
                ? (movieDetails as import('@/lib/services/tmdb').TMDbMovieDetails).title
                : (movieDetails as import('@/lib/services/tmdb').TMDbTVDetails).name,
            overview: movieDetails.overview,
            poster_path: movieDetails.poster_path,
            backdrop_path: movieDetails.backdrop_path,
            // Use type narrowing to access the correct date property
            release_date: media_type === 'movie'
                ? (movieDetails as import('@/lib/services/tmdb').TMDbMovieDetails).release_date
                : (movieDetails as import('@/lib/services/tmdb').TMDbTVDetails).first_air_date,
            vote_average: movieDetails.vote_average,
            vote_count: movieDetails.vote_count,
            popularity: movieDetails.popularity,
            original_language: movieDetails.original_language,
            genres: JSON.stringify(movieDetails.genres),
            // Only movies have a runtime property; TV details do not
            runtime: media_type === 'movie'
                ? (movieDetails as import('@/lib/services/tmdb').TMDbMovieDetails).runtime
                : null,
            status: movieDetails.status,
            watch_status,
            watched_date: (watch_status === 'watched' || watch_status === 'watch_again') ? new Date() : null
        };

        // Add rating if provided
        if (user_rating !== null && user_rating !== undefined) {
            movieData.user_rating = user_rating;
        }

        const newMovie = await MovieQueries.addMovie(movieData);

        return NextResponse.json({ movie: newMovie }, { status: 201 });
    } catch (error) {
        console.error('Add movie error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/movie
 * Update a movie's rating, comment, or watch status
 */
export async function PUT(request: NextRequest) {
    try {
        // Check authentication
        const verification = await verifyRequest(request);
        if ('error' in verification) {
            return verification.error;
        }

        const userId = verification.userId;
        const body = await request.json();
        const { movie_id, user_rating, user_comment, watch_status, watched_date } = body;

        if (!movie_id) {
            return NextResponse.json({ error: 'movie_id is required' }, { status: 400 });
        }

        // Validate rating if provided
        if (user_rating !== null && user_rating !== undefined) {
            if (user_rating < 0.5 || user_rating > 5 || (user_rating * 2) % 1 !== 0) {
                return NextResponse.json({
                    error: 'Rating must be between 0.5 and 5.0 in 0.5 increments'
                }, { status: 400 });
            }
        }

        let updatedMovie;

        // Update rating and comment if provided
        if (user_rating !== undefined || user_comment !== undefined) {
            updatedMovie = await MovieQueries.updateMovieRating(
                movie_id,
                userId,
                user_rating,
                user_comment || null
            );
        }

        // Update watch status if provided
        if (watch_status) {
            if (!['will_watch', 'watched', 'watch_again'].includes(watch_status)) {
                return NextResponse.json({
                    error: 'watch_status must be either "will_watch", "watched", or "watch_again"'
                }, { status: 400 });
            }

            const watchDate = (watch_status === 'watched' || watch_status === 'watch_again') ? (watched_date ? new Date(watched_date) : new Date()) : undefined;

            updatedMovie = await MovieQueries.updateWatchStatus(
                movie_id,
                userId,
                watch_status,
                watchDate
            );
        }

        if (!updatedMovie) {
            return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
        }

        return NextResponse.json({ movie: updatedMovie });
    } catch (error) {
        console.error('Update movie error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/movie
 * Remove a movie from user's list
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
        const movieId = searchParams.get('id');

        if (!movieId) {
            return NextResponse.json({ error: 'Movie ID is required' }, { status: 400 });
        }

        const deleted = await MovieQueries.deleteMovie(parseInt(movieId), userId);

        if (!deleted) {
            return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Movie removed successfully' });
    } catch (error) {
        console.error('Delete movie error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
