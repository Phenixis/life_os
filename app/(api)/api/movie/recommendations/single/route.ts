import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth/api';
import * as MovieQueries from '@/lib/db/queries/movie/movie';
import * as MovieNotInterestedQueries from '@/lib/db/queries/movie/not-interested';
import TMDbService, { TMDbMovie, TMDbTVShow } from '@/lib/services/tmdb';

function isMovie(item: TMDbMovie | TMDbTVShow): item is TMDbMovie {
    return "title" in item;
}

function isTVShow(item: TMDbMovie | TMDbTVShow): item is TMDbTVShow {
    return "name" in item;
}

/**
 * GET /api/movie/recommendations/single
 * Get a single replacement recommendation when a movie is added to watchlist/watched
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
        const mediaType = searchParams.get('media_type') as 'movie' | 'tv' | 'all' || 'all';
        const excludeIds = searchParams.get('exclude_ids')?.split(',').map(id => parseInt(id)) || [];

        // Get TMDb API key
        const tmdbApiKey = process.env.TMDB_ACCESS_TOKEN;
        if (!tmdbApiKey) {
            return NextResponse.json({ error: 'TMDb API key not configured' }, { status: 500 });
        }

        const tmdbService = new TMDbService(tmdbApiKey);

        // Get user's watched movies with high ratings (4+ stars)
        const watchedMovies = await MovieQueries.getMoviesByStatus(userId, 'watched');
        const highRatedMovies = watchedMovies.filter(movie => 
            movie.user_rating && movie.user_rating >= 4.0
        );

        // Get all user's movies (both watched and watchlist) to exclude from recommendations
        const allUserMovies = await MovieQueries.getUserMovies(userId);
        const userMovieIds = new Set(allUserMovies.map(movie => movie.tmdb_id));

        // Get all not interested movies to exclude from recommendations
        const notInterestedMovieIds = await MovieNotInterestedQueries.getNotInterestedMovieIds(userId);
        const notInterestedIds = new Set(notInterestedMovieIds);

        // Combined exclusion function (including additional exclude IDs from params)
        const shouldExcludeMovie = (movieId: number) => {
            return userMovieIds.has(movieId) || 
                   notInterestedIds.has(movieId) ||
                   excludeIds.includes(movieId);
        };

        let recommendation = null;

        // Strategy 1: Get recommendation from a highly-rated movie
        if (highRatedMovies.length > 0) {
            // Pick a random high-rated movie
            const randomMovie = highRatedMovies[Math.floor(Math.random() * highRatedMovies.length)];
            
            try {
                let movieRecs;
                if (randomMovie.media_type === 'movie') {
                    movieRecs = await tmdbService.getMovieRecommendations(randomMovie.tmdb_id, 1);
                } else {
                    movieRecs = await tmdbService.getTVRecommendations(randomMovie.tmdb_id, 1);
                }

                // Find a suitable recommendation
                for (const rec of movieRecs.results.filter(
                    rec => (mediaType === 'all' || 
                           (mediaType === 'movie' && isMovie(rec)) || 
                           (mediaType === 'tv' && isTVShow(rec))) &&
                           !shouldExcludeMovie(rec.id)
                )) {
                    recommendation = {
                        ...rec,
                        media_type: randomMovie.media_type,
                        recommendation_source: 'similar_to_rated'
                    };
                    break;
                }
            } catch (error) {
                console.warn('Failed to get recommendations from rated movie:', randomMovie.tmdb_id);
                console.warn(error);
            }
        }

        // Strategy 2: Get from trending if no recommendation found
        if (!recommendation) {
            try {
                const trending = await tmdbService.getTrending(mediaType === 'all' ? 'all' : mediaType, 'week');
                
                for (const item of trending.results) {
                    if (!shouldExcludeMovie(item.id)) {
                        recommendation = {
                            ...item,
                            recommendation_source: 'trending'
                        };
                        break;
                    }
                }
            } catch (error) {
                console.warn('Failed to get trending content:', error);
            }
        }

        // Strategy 3: Get from popular if still no recommendation
        if (!recommendation) {
            try {
                let popularContent = [];
                
                if (mediaType === 'movie') {
                    const popular = await tmdbService.getPopularMovies(1);
                    popularContent = popular.results.map(item => ({ ...item, media_type: 'movie' }));
                } else if (mediaType === 'tv') {
                    const popular = await tmdbService.getPopularTVShows(1);
                    popularContent = popular.results.map(item => ({ ...item, media_type: 'tv' }));
                } else {
                    // Mix of both for 'all' type
                    const [popularMovies, popularTV] = await Promise.all([
                        tmdbService.getPopularMovies(1),
                        tmdbService.getPopularTVShows(1)
                    ]);
                    
                    popularContent = [
                        ...popularMovies.results.map(item => ({ ...item, media_type: 'movie' })),
                        ...popularTV.results.map(item => ({ ...item, media_type: 'tv' }))
                    ];
                }

                for (const item of popularContent) {
                    if (!shouldExcludeMovie(item.id)) {
                        recommendation = {
                            ...item,
                            recommendation_source: 'popular_replacement'
                        };
                        break;
                    }
                }
            } catch (error) {
                console.warn('Failed to get popular content:', error);
            }
        }

        if (!recommendation) {
            return NextResponse.json({ error: 'No suitable recommendation found' }, { status: 404 });
        }

        return NextResponse.json({
            recommendation,
            excluded_count: excludeIds.length + userMovieIds.size + notInterestedIds.size
        });

    } catch (error) {
        console.error('Get single recommendation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
