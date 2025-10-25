import * as lib from "../lib"

/**
 * Get all movies for a user
 */
export async function getUserMovies(userId: string): Promise<lib.Schema.Movie.Movie.Select[]> {
    return await lib.db
        .select()
        .from(lib.Schema.Movie.Movie.table)
        .where(lib.and(
            lib.eq(lib.Schema.Movie.Movie.table.user_id, userId),
            lib.sql`${lib.Schema.Movie.Movie.table.deleted_at} IS NULL`
        ))
        .orderBy(lib.desc(lib.Schema.Movie.Movie.table.updated_at));
}

/**
 * Get movies by watch status
 */
export async function getMoviesByStatus(userId: string, watchStatus: 'will_watch' | 'watched' | 'watch_again'): Promise<lib.Schema.Movie.Movie.Select[]> {
    return await lib.db
        .select()
        .from(lib.Schema.Movie.Movie.table)
        .where(lib.and(
            lib.eq(lib.Schema.Movie.Movie.table.user_id, userId),
            lib.eq(lib.Schema.Movie.Movie.table.watch_status, watchStatus),
            lib.sql`${lib.Schema.Movie.Movie.table.deleted_at} IS NULL`
        ))
        .orderBy(lib.desc(lib.Schema.Movie.Movie.table.updated_at));
}

/**
 * Get movie by TMDb ID for a user
 */
export async function getMovieByTmdbId(userId: string, tmdbId: number, mediaType: 'movie' | 'tv'): Promise<lib.Schema.Movie.Movie.Select | null> {
    const results = await lib.db
        .select()
        .from(lib.Schema.Movie.Movie.table)
        .where(lib.and(
            lib.eq(lib.Schema.Movie.Movie.table.user_id, userId),
            lib.eq(lib.Schema.Movie.Movie.table.tmdb_id, tmdbId),
            lib.eq(lib.Schema.Movie.Movie.table.media_type, mediaType),
            lib.sql`${lib.Schema.Movie.Movie.table.deleted_at} IS NULL`
        ))
        .limit(1);

    return results[0] || null;
}

/**
 * Get movie by ID
 */
export async function getMovieById(movieId: number): Promise<lib.Schema.Movie.Movie.Select | null> {
    const results = await lib.db
        .select()
        .from(lib.Schema.Movie.Movie.table)
        .where(lib.and(
            lib.eq(lib.Schema.Movie.Movie.table.id, movieId),
            lib.sql`${lib.Schema.Movie.Movie.table.deleted_at} IS NULL`
        ))
        .limit(1);

    return results[0] || null;
}

/**
 * Add a new movie to user's list
 */
export async function addMovie(movieData: lib.Schema.Movie.Movie.Insert): Promise<lib.Schema.Movie.Movie.Select> {
    const results = await lib.db
        .insert(lib.Schema.Movie.Movie.table)
        .values({
            ...movieData,
            created_at: new Date(),
            updated_at: new Date()
        })
        .returning();

    return results[0];
}

/**
 * Update movie rating and comment
 */
export async function updateMovieRating(
    movieId: number,
    userId: string,
    rating: number | null,
    comment: string | null
): Promise<lib.Schema.Movie.Movie.Select | null> {
    const results = await lib.db
        .update(lib.Schema.Movie.Movie.table)
        .set({
            user_rating: rating,
            user_comment: comment,
            updated_at: new Date()
        })
        .where(lib.and(
            lib.eq(lib.Schema.Movie.Movie.table.id, movieId),
            lib.eq(lib.Schema.Movie.Movie.table.user_id, userId),
            lib.sql`${lib.Schema.Movie.Movie.table.deleted_at} IS NULL`
        ))
        .returning();

    return results[0] || null;
}

/**
 * Update movie watch status
 */
export async function updateWatchStatus(
    movieId: number,
    userId: string,
    watchStatus: 'will_watch' | 'watched' | 'watch_again',
    watchedDate?: Date
): Promise<lib.Schema.Movie.Movie.Select | null> {
    const updateData: Partial<lib.Schema.Movie.Movie.Select> = {
        watch_status: watchStatus,
        updated_at: new Date()
    };

    if (watchStatus === 'watched' && watchedDate) {
        updateData.watched_date = watchedDate;
    } else if (watchStatus === 'watch_again' && watchedDate) {
        updateData.watched_date = watchedDate;
    } else if (watchStatus === 'will_watch') {
        updateData.watched_date = null;
    }

    const results = await lib.db
        .update(lib.Schema.Movie.Movie.table)
        .set(updateData)
        .where(lib.and(
            lib.eq(lib.Schema.Movie.Movie.table.id, movieId),
            lib.eq(lib.Schema.Movie.Movie.table.user_id, userId),
            lib.sql`${lib.Schema.Movie.Movie.table.deleted_at} IS NULL`
        ))
        .returning();

    return results[0] || null;
}

/**
 * Delete a movie (soft delete)
 */
export async function deleteMovie(movieId: number, userId: string): Promise<boolean> {
    const results = await lib.db
        .update(lib.Schema.Movie.Movie.table)
        .set({
            deleted_at: new Date(),
            updated_at: new Date()
        })
        .where(lib.and(
            lib.eq(lib.Schema.Movie.Movie.table.id, movieId),
            lib.eq(lib.Schema.Movie.Movie.table.user_id, userId),
            lib.sql`${lib.Schema.Movie.Movie.table.deleted_at} IS NULL`
        ))
        .returning();

    return results.length > 0;
}

/**
 * Get user's movie statistics
 */
export async function getMovieStats(userId: string): Promise<{
    total: number;
    watched: number;
    willWatch: number;
    watchAgain: number;
    averageRating: number | null;
}> {
    const stats = await lib.db
        .select({
            total:  lib.sql<number>`COUNT(*)`,
            watched: lib.sql<number>`COUNT(CASE WHEN ${lib.Schema.Movie.Movie.table.watch_status} = 'watched' THEN 1 END)`,
            willWatch: lib.sql<number>`COUNT(CASE WHEN ${lib.Schema.Movie.Movie.table.watch_status} = 'will_watch' THEN 1 END)`,
            watchAgain: lib.sql<number>`COUNT(CASE WHEN ${lib.Schema.Movie.Movie.table.watch_status} = 'watch_again' THEN 1 END)`,
            averageRating: lib.sql<number>`AVG(${lib.Schema.Movie.Movie.table.user_rating})`
        })
        .from(lib.Schema.Movie.Movie.table)
        .where(lib.and(
            lib.eq(lib.Schema.Movie.Movie.table.user_id, userId),
            lib.sql`${lib.Schema.Movie.Movie.table.deleted_at} IS NULL`
        ));

    return {
        total: stats[0].total,
        watched: stats[0].watched,
        willWatch: stats[0].willWatch,
        watchAgain: stats[0].watchAgain,
        averageRating: stats[0].averageRating
    };
}

/**
 * Search user's movies by title
 */
export async function searchUserMovies(userId: string, searchTerm: string): Promise<lib.Schema.Movie.Movie.Select[]> {
    return await lib.db
        .select()
        .from(lib.Schema.Movie.Movie.table)
        .where(lib.and(
            lib.eq(lib.Schema.Movie.Movie.table.user_id, userId),
            lib.sql`${lib.Schema.Movie.Movie.table.title} ILIKE ${'%' + searchTerm + '%'}`,
            lib.sql`${lib.Schema.Movie.Movie.table.deleted_at} IS NULL`
        ))
        .orderBy(lib.desc(lib.Schema.Movie.Movie.table.updated_at));
}