'use client';

import useSWR, { mutate } from 'swr';
import { useUser } from '@/hooks/use-user';
import { fetcher } from '@/lib/fetcher';
import { Movie } from '@/lib/db/schema';

interface MovieStats {
    total: number;
    watched: number;
    willWatch: number;
    watchAgain: number;
    averageRating: number | null;
}

interface TMDbSearchResult {
    id: number;
    title?: string;
    name?: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
    vote_count: number;
    popularity: number;
    media_type?: 'movie' | 'tv';
}

interface SearchResponse {
    results: TMDbSearchResult[];
    page: number;
    total_pages: number;
    total_results: number;
}

interface RecommendationResult extends TMDbSearchResult {
    recommendation_source: 'similar_to_rated' | 'genre_discovery' | 'trending';
}

interface RecommendationsResponse {
    recommendations: RecommendationResult[];
    buffer: RecommendationResult[];
    page: number;
    total_pages: number;
    total_results: number;
    method: 'personalized' | 'popular_fallback';
    based_on?: {
        high_rated_count: number;
        top_genres: number[];
        strategies_used: string[];
    };
}

export function useMovies(status?: 'will_watch' | 'watched' | 'watch_again', search?: string) {
    const { user } = useUser();
    
    const url = status ? `/api/movie/list?status=${status}` : 
                search ? `/api/movie/list?search=${encodeURIComponent(search)}` :
                '/api/movie/list';
    
    const { data, error, isLoading } = useSWR(
        user ? url : null,
        (url) => fetcher(url, user!.api_key)
    );

    return {
        movies: data?.movies as Movie.Movie.Select[] || [],
        isLoading,
        error
    };
}

export function useMovieStats() {
    const { user } = useUser();
    
    const { data, error, isLoading } = useSWR(
        user ? '/api/movie/stats' : null,
        (url) => fetcher(url, user!.api_key)
    );

    return {
        stats: data as MovieStats || { total: 0, watched: 0, willWatch: 0, watchAgain: 0, averageRating: null },
        isLoading,
        error
    };
}

export function useMovieSearch(query: string, type: 'multi' | 'movie' | 'tv' = 'multi') {
    const { user } = useUser();
    
    const url = query.trim() ? 
        `/api/movie/search?q=${encodeURIComponent(query)}&type=${type}` : 
        null;
    
    const { data, error, isLoading } = useSWR(
        user && url ? url : null,
        (url) => fetcher(url, user!.api_key)
    );

    return {
        results: data as SearchResponse || { results: [], page: 1, total_pages: 0, total_results: 0 },
        isLoading,
        error
    };
}

export function useMovieRecommendations(mediaType: 'movie' | 'tv' | 'all' = 'all', page: number = 1) {
    const { user } = useUser();
    
    const url = `/api/movie/recommendations?media_type=${mediaType}&page=${page}`;
    
    const { data, error, isLoading, mutate: mutateSWR } = useSWR(
        user ? url : null,
        (url) => fetcher(url, user!.api_key),
        {
            revalidateOnFocus: false, // Don't revalidate on window focus
            dedupingInterval: 60 * 1000, // Cache for 60 seconds
        }
    );

    const refresh = async () => {
        if (user && url) {
            // Trigger a fresh fetch without cache manipulation
            await mutateSWR();
        }
    };

    /**
     * Replace a specific recommendation item with a new one
     * This avoids full list refresh when adding movies.
     * Uses buffer movies when available, falls back to API call if needed.
     * 
     * @param tmdbIdToRemove - The TMDb ID of the movie to remove
     * @param optimistic - If true, immediately replaces with buffer movie if available
     * @param basedOnMovie - Optional movie details to base the new recommendation on
     */
    const replaceRecommendation = async (
        tmdbIdToRemove: number, 
        optimistic: boolean = false,
        basedOnMovie?: { tmdbId: number; mediaType: 'movie' | 'tv' }
    ) => {
        if (!user || !data) return null;

        try {
            const currentData = data as RecommendationsResponse;
            const buffer = currentData.buffer || [];
            
            // For optimistic updates, immediately replace if buffer is available
            if (optimistic && buffer.length > 0) {
                const replacementMovie = buffer[0];
                const remainingBuffer = buffer.slice(1);
                
                // Create new recommendations array with the removed item replaced
                const updatedRecommendations = currentData.recommendations.map(rec => 
                    rec.id === tmdbIdToRemove ? replacementMovie : rec
                );

                // Immediately update the cache with the new data and reduced buffer
                mutateSWR({
                    ...currentData,
                    recommendations: updatedRecommendations,
                    buffer: remainingBuffer
                }, { revalidate: false });
                
                return replacementMovie;
            }
            
            // First try to use a movie from the buffer (non-optimistic)
            if (buffer.length > 0) {
                const replacementMovie = buffer[0];
                const remainingBuffer = buffer.slice(1);
                
                // Create new recommendations array with the removed item replaced
                const updatedRecommendations = currentData.recommendations.map(rec => 
                    rec.id === tmdbIdToRemove ? replacementMovie : rec
                );

                // Update the cache with the new data and reduced buffer
                await mutateSWR({
                    ...currentData,
                    recommendations: updatedRecommendations,
                    buffer: remainingBuffer
                }, { revalidate: false });
                
                return replacementMovie;
            }
            
            // Fallback: If no buffer available, fetch a single recommendation
            const existingIds = currentData.recommendations.map(rec => rec.id);
            
            // Get a replacement recommendation excluding current list + the removed item
            const excludeIds = [...existingIds];
            let singleRecUrl = `/api/movie/recommendations/single?media_type=${mediaType}&exclude_ids=${excludeIds.join(',')}`;
            
            // If we have movie details to base the recommendation on, add them to the URL
            if (basedOnMovie) {
                singleRecUrl += `&based_on_tmdb_id=${basedOnMovie.tmdbId}&based_on_media_type=${basedOnMovie.mediaType}`;
            }
            
            const response = await fetcher(singleRecUrl, user.api_key);
            
            if (response?.recommendation) {
                // Create new recommendations array with the removed item replaced
                const updatedRecommendations = currentData.recommendations.map(rec => 
                    rec.id === tmdbIdToRemove ? response.recommendation : rec
                );

                // Update the cache with the new data
                await mutateSWR({
                    ...currentData,
                    recommendations: updatedRecommendations
                }, { revalidate: false });
                
                return response.recommendation;
            }
            
            return null;
        } catch (error) {
            console.warn('Failed to replace recommendation, falling back to full refresh:', error);
            // Fall back to full refresh if replacement fails
            await refresh();
            return null;
        }
    };

    return {
        recommendations: data as RecommendationsResponse || {
            recommendations: [],
            buffer: [],
            page: 1,
            total_pages: 0,
            total_results: 0,
            method: 'popular_fallback'
        },
        isLoading,
        error,
        refresh,
        replaceRecommendation
    };
}

export function useMovieActions() {
    const { user } = useUser();

    // Helper function to create optimistic movie data
    const createOptimisticMovie = (movie: Movie.Movie.Select, updates: Partial<Movie.Movie.Select>): Movie.Movie.Select => ({
        ...movie,
        ...updates,
        updated_at: new Date()
    });

    // Helper function to update movies in cache
    const updateMoviesInCache = (
        cacheKey: string,
        movieId: number,
        optimisticUpdate: (movies: Movie.Movie.Select[]) => Movie.Movie.Select[]
    ) => {
        mutate(
            cacheKey,
            (currentData: { movies?: Movie.Movie.Select[] } | undefined) => {
                if (!currentData?.movies) return currentData;
                return {
                    ...currentData,
                    movies: optimisticUpdate(currentData.movies)
                };
            },
            { revalidate: false }
        );
    };

    // Helper function to update all relevant movie list caches
    const updateAllMovieListCaches = (
        movieId: number,
        optimisticUpdate: (movies: Movie.Movie.Select[]) => Movie.Movie.Select[]
    ) => {
        // Update main list caches
        updateMoviesInCache('/api/movie/list', movieId, optimisticUpdate);
        updateMoviesInCache('/api/movie/list?status=watched', movieId, optimisticUpdate);
        updateMoviesInCache('/api/movie/list?status=will_watch', movieId, optimisticUpdate);
        updateMoviesInCache('/api/movie/list?status=watch_again', movieId, optimisticUpdate);
        
        // Update search caches (we update all possible search caches)
        mutate(
            (key) => typeof key === 'string' && key.includes('/api/movie/list?search='),
            (currentData: { movies?: Movie.Movie.Select[] } | undefined) => {
                if (!currentData?.movies) return currentData;
                return {
                    ...currentData,
                    movies: optimisticUpdate(currentData.movies)
                };
            },
            { revalidate: false }
        );
    };

    // Helper function to update stats in cache
    const updateStatsInCache = (updateFn: (stats: MovieStats) => MovieStats) => {
        mutate(
            '/api/movie/stats',
            (currentStats: MovieStats | undefined) => {
                if (!currentStats) return currentStats;
                return updateFn(currentStats);
            },
            { revalidate: false }
        );
    };

    const addMovie = async (
        tmdbId: number, 
        mediaType: 'movie' | 'tv', 
        watchStatus: 'will_watch' | 'watched' | 'watch_again' = 'will_watch',
        options?: { 
            optimizeRecommendations?: boolean;
            rating?: number;
        }
    ) => {
        if (!user) throw new Error('User not authenticated');

        const requestBody: {
            tmdb_id: number;
            media_type: 'movie' | 'tv';
            watch_status: 'will_watch' | 'watched' | 'watch_again';
            user_rating?: number;
            optimizeRecommendations?: boolean;
        } = {
            tmdb_id: tmdbId,
            media_type: mediaType,
            watch_status: watchStatus
        };

        // If rating is provided and watch status is 'watched', include it
        if (options?.rating && watchStatus === 'watched') {
            requestBody.user_rating = options.rating;
        }

        const response = await fetch('/api/movie', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.api_key}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add movie');
        }

        // Invalidate movie lists (but not recommendations if optimizing)
        if (options?.optimizeRecommendations) {
            // Only invalidate non-recommendation endpoints
            mutate((key) => 
                typeof key === 'string' && 
                key.startsWith('/api/movie/') && 
                !key.includes('/api/movie/recommendations')
            );
        } else {
            // Invalidate all movie endpoints (current behavior)
            mutate((key) => typeof key === 'string' && key.startsWith('/api/movie/'));
        }
        
        return response.json();
    };

    const updateMovie = async (
        movieId: number, 
        updates: {
            user_rating?: number | null;
            user_comment?: string | null;
            watch_status?: 'will_watch' | 'watched' | 'watch_again';
            watched_date?: string;
        },
        options?: {
            optimistic?: boolean;
            originalMovie?: Movie.Movie.Select;
        }
    ) => {
        if (!user) throw new Error('User not authenticated');

        // Optimistic updates
        if (options?.optimistic && options.originalMovie) {
            const optimisticUpdates: Partial<Movie.Movie.Select> = {
                ...updates,
                watched_date: updates.watched_date ? new Date(updates.watched_date) : undefined
            };
            
            const optimisticMovie = createOptimisticMovie(options.originalMovie, optimisticUpdates);
            
            // Update movie lists cache
            const updateFn = (movies: Movie.Movie.Select[]) =>
                movies.map(movie => movie.id === movieId ? optimisticMovie : movie);

            // Update all relevant caches
            updateAllMovieListCaches(movieId, updateFn);

            // Update stats if watch status changed
            if (updates.watch_status && updates.watch_status !== options.originalMovie.watch_status) {
                updateStatsInCache((stats) => {
                    const newStats = { ...stats };
                    
                    // Decrease old status count
                    if (options.originalMovie!.watch_status === 'watched') newStats.watched--;
                    else if (options.originalMovie!.watch_status === 'will_watch') newStats.willWatch--;
                    else if (options.originalMovie!.watch_status === 'watch_again') newStats.watchAgain--;
                    
                    // Increase new status count
                    if (updates.watch_status === 'watched') newStats.watched++;
                    else if (updates.watch_status === 'will_watch') newStats.willWatch++;
                    else if (updates.watch_status === 'watch_again') newStats.watchAgain++;
                    
                    return newStats;
                });
            }
        }

        try {
            const response = await fetch('/api/movie', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.api_key}`
                },
                body: JSON.stringify({
                    movie_id: movieId,
                    ...updates
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update movie');
            }

            // Revalidate data (this will correct any optimistic errors)
            mutate((key) => typeof key === 'string' && key.startsWith('/api/movie/'));
            
            return response.json();
        } catch (error) {
            // Revert optimistic updates on error
            if (options?.optimistic) {
                mutate((key) => typeof key === 'string' && key.startsWith('/api/movie/'));
            }
            throw error;
        }
    };

    const deleteMovie = async (
        movieId: number,
        options?: {
            optimistic?: boolean;
            originalMovie?: Movie.Movie.Select;
        }
    ) => {
        if (!user) throw new Error('User not authenticated');

        // Optimistic updates
        if (options?.optimistic && options.originalMovie) {
            // Update movie lists cache
            const updateFn = (movies: Movie.Movie.Select[]) => 
                movies.filter(movie => movie.id !== movieId);

            // Update all relevant caches
            updateAllMovieListCaches(movieId, updateFn);

            // Update stats
            updateStatsInCache((stats) => {
                const newStats = { ...stats, total: stats.total - 1 };
                
                if (options.originalMovie!.watch_status === 'watched') newStats.watched--;
                else if (options.originalMovie!.watch_status === 'will_watch') newStats.willWatch--;
                else if (options.originalMovie!.watch_status === 'watch_again') newStats.watchAgain--;
                
                return newStats;
            });
        }

        try {
            const response = await fetch(`/api/movie?id=${movieId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user.api_key}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete movie');
            }

            // Revalidate data (this will correct any optimistic errors)
            mutate((key) => typeof key === 'string' && key.startsWith('/api/movie/'));
            
            return response.json();
        } catch (error) {
            // Revert optimistic updates on error
            if (options?.optimistic) {
                mutate((key) => typeof key === 'string' && key.startsWith('/api/movie/'));
            }
            throw error;
        }
    };

    const markAsNotInterested = async (
        tmdbId: number, 
        mediaType: 'movie' | 'tv', 
        title: string,
        options?: { optimizeRecommendations?: boolean }
    ) => {
        if (!user) throw new Error('User not authenticated');

        const response = await fetch('/api/movie/not-interested', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.api_key}`
            },
            body: JSON.stringify({
                tmdb_id: tmdbId,
                media_type: mediaType,
                title: title
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to mark as not interested');
        }

        // Invalidate recommendations to refresh them (unless optimizing)
        if (!options?.optimizeRecommendations) {
            mutate((key) => typeof key === 'string' && key.includes('/api/movie/recommendations'));
        }
        
        return response.json();
    };

    const removeFromNotInterested = async (tmdbId: number, mediaType: 'movie' | 'tv') => {
        if (!user) throw new Error('User not authenticated');

        const response = await fetch(`/api/movie/not-interested?tmdb_id=${tmdbId}&media_type=${mediaType}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${user.api_key}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to remove from not interested');
        }

        // Invalidate recommendations to refresh them
        mutate((key) => typeof key === 'string' && key.includes('/api/movie/recommendations'));
        
        return response.json();
    };

    return {
        addMovie,
        updateMovie,
        deleteMovie,
        markAsNotInterested,
        removeFromNotInterested
    };
}
