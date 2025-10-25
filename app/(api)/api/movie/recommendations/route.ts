import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest } from '@/lib/auth/api';
import * as MovieQueries from '@/lib/db/queries/movie/movie';
import * as MovieNotInterestedQueries from '@/lib/db/queries/movie/not-interested';
import TMDbService, { TMDbMovie, TMDbTVShow } from '@/lib/services/tmdb';

// Number of recommendations to display to user
const DISPLAYED_RECOMMENDATIONS_COUNT = 24;
// Number of recommendations to fetch (includes buffer for replacement)
const FETCHED_RECOMMENDATIONS_COUNT = 30;

function isMovie(item: TMDbMovie | TMDbTVShow): item is TMDbMovie {
    return "title" in item
}

function isTVShow(item: TMDbMovie | TMDbTVShow): item is TMDbTVShow {
    return "name" in item;
}

/**
 * GET /api/movie/recommendations
 * Get personalized movie recommendations based on user's watched movies
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
        const page = parseInt(searchParams.get('page') || '1');
        const mediaType = searchParams.get('media_type') as 'movie' | 'tv' | 'all' || 'all';

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

        // Combined exclusion function
        const shouldExcludeMovie = (movieId: number) => {
            return userMovieIds.has(movieId) || notInterestedIds.has(movieId);
        };

        if (highRatedMovies.length === 0) {
            // If no high-rated movies, fall back to popular content
            if (mediaType === 'movie') {
                const popularMovies = await tmdbService.getPopularMovies(page);
                const filteredMovies = popularMovies.results.filter(movie => !shouldExcludeMovie(movie.id));
                return NextResponse.json({
                    recommendations: filteredMovies.slice(0, DISPLAYED_RECOMMENDATIONS_COUNT),
                    buffer: filteredMovies.slice(DISPLAYED_RECOMMENDATIONS_COUNT),
                    page: popularMovies.page,
                    total_pages: popularMovies.total_pages,
                    total_results: filteredMovies.length,
                    method: 'popular_fallback'
                });
            } else if (mediaType === 'tv') {
                const popularTV = await tmdbService.getPopularTVShows(page);
                const filteredShows = popularTV.results.filter(show => !shouldExcludeMovie(show.id));
                return NextResponse.json({
                    recommendations: filteredShows.slice(0, DISPLAYED_RECOMMENDATIONS_COUNT),
                    buffer: filteredShows.slice(DISPLAYED_RECOMMENDATIONS_COUNT),
                    page: popularTV.page,
                    total_pages: popularTV.total_pages,
                    total_results: filteredShows.length,
                    method: 'popular_fallback'
                });
            } else {
                // Mix of both
                const [popularMovies, popularTV] = await Promise.all([
                    tmdbService.getPopularMovies(1),
                    tmdbService.getPopularTVShows(1)
                ]);
                
                // Interleave movies and TV shows, excluding user's existing movies and not interested
                const mixed = [];
                const maxLength = Math.max(popularMovies.results.length, popularTV.results.length);
                for (let i = 0; i < maxLength && mixed.length < FETCHED_RECOMMENDATIONS_COUNT; i++) {
                    if (i < popularMovies.results.length && !shouldExcludeMovie(popularMovies.results[i].id)) {
                        mixed.push({ ...popularMovies.results[i], media_type: 'movie' });
                    }
                    if (i < popularTV.results.length && mixed.length < FETCHED_RECOMMENDATIONS_COUNT && !shouldExcludeMovie(popularTV.results[i].id)) {
                        mixed.push({ ...popularTV.results[i], media_type: 'tv' });
                    }
                }
                
                return NextResponse.json({
                    recommendations: mixed.slice(0, DISPLAYED_RECOMMENDATIONS_COUNT),
                    buffer: mixed.slice(DISPLAYED_RECOMMENDATIONS_COUNT),
                    page: 1,
                    total_pages: Math.max(popularMovies.total_pages, popularTV.total_pages),
                    total_results: popularMovies.total_results + popularTV.total_results,
                    method: 'popular_fallback'
                });
            }
        }

        // Extract genres from highly rated movies
        const genreMap = new Map<number, number>();
        const movieIds = [];
        
        for (const movie of highRatedMovies) {
            movieIds.push(movie.tmdb_id);
            
            if (movie.genres) {
                try {
                    const genres = JSON.parse(movie.genres) as { id: number; name: string }[];
                    genres.forEach(genre => {
                        genreMap.set(genre.id, (genreMap.get(genre.id) || 0) + 1);
                    });
                } catch (error) {
                    console.warn('Failed to parse genres for movie:', movie.id);
                    console.warn(error);
                }
            }
        }

        // Get top 3 most frequent genres
        const topGenres = Array.from(genreMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([genreId]) => genreId);

        const recommendations = [];
        const seenIds = new Set<number>();

        // Strategy 1: Get recommendations from highly-rated movies
        if (movieIds.length > 0) {
            // Take a few random high-rated movies to get recommendations from
            const sampleMovies = movieIds
                .sort(() => 0.5 - Math.random())
                .slice(0, Math.min(3, movieIds.length));
            
            for (const movieId of sampleMovies) {
                try {
                    const movie = highRatedMovies.find(m => m.tmdb_id === movieId);
                    if (!movie) continue;

                    let movieRecs;
                    if (movie.media_type === 'movie') {
                        movieRecs = await tmdbService.getMovieRecommendations(movieId, 1);
                    } else {
                        movieRecs = await tmdbService.getTVRecommendations(movieId, 1);
                    }

                    // Add recommendations, avoiding duplicates, user's existing movies, and not interested movies
                    for (const rec of movieRecs.results.filter(
                        rec => (mediaType === 'all' || (mediaType === 'movie' && isMovie(rec)) || (mediaType === 'tv' && isTVShow(rec))) &&
                               !shouldExcludeMovie(rec.id)
                    ).slice(0, 8)) {
                        if (!seenIds.has(rec.id) && recommendations.length < FETCHED_RECOMMENDATIONS_COUNT) {
                            seenIds.add(rec.id);
                            recommendations.push({
                                ...rec,
                                media_type: movie.media_type,
                                recommendation_source: 'similar_to_rated'
                            });
                        }
                    }
                } catch (error) {
                    console.warn('Failed to get recommendations for movie:', movieId);
                    console.warn(error);
                }
            }
        }

        // Strategy 2: Discover movies by preferred genres (if we need more recommendations)
        if (recommendations.length < FETCHED_RECOMMENDATIONS_COUNT && topGenres.length > 0) {
            try {
                const genreString = topGenres.join(',');
                
                if (mediaType === 'movie' || mediaType === 'all') {
                    const discovered = await tmdbService.discoverMovies({
                        with_genres: genreString,
                        vote_average_gte: 7.0,
                        vote_count_gte: 100,
                        sort_by: 'popularity.desc',
                        page: 1
                    });

                    for (const movie of discovered.results.slice(0, 15)) {
                        if (!seenIds.has(movie.id) && !shouldExcludeMovie(movie.id) && recommendations.length < FETCHED_RECOMMENDATIONS_COUNT) {
                            seenIds.add(movie.id);
                            recommendations.push({
                                ...movie,
                                media_type: 'movie',
                                recommendation_source: 'genre_discovery'
                            });
                        }
                    }
                }

                if (mediaType === 'tv' || mediaType === 'all') {
                    const discovered = await tmdbService.discoverTV({
                        with_genres: genreString,
                        vote_average_gte: 7.0,
                        vote_count_gte: 50,
                        sort_by: 'popularity.desc',
                        page: 1
                    });

                    for (const show of discovered.results.slice(0, 15)) {
                        if (!seenIds.has(show.id) && !shouldExcludeMovie(show.id) && recommendations.length < FETCHED_RECOMMENDATIONS_COUNT) {
                            seenIds.add(show.id);
                            recommendations.push({
                                ...show,
                                media_type: 'tv',
                                recommendation_source: 'genre_discovery'
                            });
                        }
                    }
                }
            } catch (error) {
                console.warn('Failed to discover movies by genre:', error);
            }
        }

        // Strategy 3: Fill with trending content if still need more
        if (recommendations.length < FETCHED_RECOMMENDATIONS_COUNT) {
            try {
                const trending = await tmdbService.getTrending(mediaType === 'all' ? 'all' : mediaType, 'week');
                
                for (const item of trending.results.slice(0, 15)) {
                    if (!seenIds.has(item.id) && !shouldExcludeMovie(item.id) && recommendations.length < FETCHED_RECOMMENDATIONS_COUNT) {
                        seenIds.add(item.id);
                        recommendations.push({
                            ...item,
                            recommendation_source: 'trending'
                        });
                    }
                }
            } catch (error) {
                console.warn('Failed to get trending content:', error);
            }
        }

        // Strategy 4: Fill with popular content if still need more to reach FETCHED_RECOMMENDATIONS_COUNT
        if (recommendations.length < FETCHED_RECOMMENDATIONS_COUNT) {
            try {
                let popularContent = [];
                
                if (mediaType === 'movie') {
                    const popular = await tmdbService.getPopularMovies(1);
                    popularContent = popular.results.map(item => ({ ...item, media_type: 'movie' }));
                } else if (mediaType === 'tv') {
                    const popular = await tmdbService.getPopularTVShows(1);
                    popularContent = popular.results.map(item => ({ ...item, media_type: 'tv' }));
                } else {
                    // Mix of popular movies and TV shows
                    const [popularMovies, popularTV] = await Promise.all([
                        tmdbService.getPopularMovies(1),
                        tmdbService.getPopularTVShows(1)
                    ]);
                    
                    // Interleave content
                    const maxLength = Math.max(popularMovies.results.length, popularTV.results.length);
                    for (let i = 0; i < maxLength; i++) {
                        if (i < popularMovies.results.length) {
                            popularContent.push({ ...popularMovies.results[i], media_type: 'movie' });
                        }
                        if (i < popularTV.results.length) {
                            popularContent.push({ ...popularTV.results[i], media_type: 'tv' });
                        }
                    }
                }

                for (const item of popularContent) {
                    if (!seenIds.has(item.id) && !shouldExcludeMovie(item.id) && recommendations.length < FETCHED_RECOMMENDATIONS_COUNT) {
                        seenIds.add(item.id);
                        recommendations.push({
                            ...item,
                            recommendation_source: 'popular_fillup'
                        });
                    }
                }
            } catch (error) {
                console.warn('Failed to get popular content for fillup:', error);
            }
        }

        return NextResponse.json({
            recommendations: recommendations.slice(0, DISPLAYED_RECOMMENDATIONS_COUNT),
            buffer: recommendations.slice(DISPLAYED_RECOMMENDATIONS_COUNT),
            page: 1,
            total_pages: Math.ceil(recommendations.length / DISPLAYED_RECOMMENDATIONS_COUNT),
            total_results: recommendations.length,
            method: 'personalized',
            based_on: {
                high_rated_count: highRatedMovies.length,
                top_genres: topGenres,
                strategies_used: [
                    'similar_to_rated',
                    'genre_discovery',
                    ...(recommendations.some(r => r.recommendation_source === 'trending') ? ['trending'] : []),
                    ...(recommendations.some(r => r.recommendation_source === 'popular_fillup') ? ['popular_fillup'] : [])
                ]
            }
        });

    } catch (error) {
        console.error('Get recommendations error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
