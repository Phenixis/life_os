import * as lib from "../lib"

/**
 * Mark a movie as "not interested"
 */
export async function markAsNotInterested(
    userId: string,
    tmdbId: number,
    mediaType: 'movie' | 'tv',
    title: string
): Promise<lib.Schema.Movie.NotInterested.Select> {
    const newNotInterestedMovie: lib.Schema.Movie.NotInterested.Insert = {
        user_id: userId,
        tmdb_id: tmdbId,
        media_type: mediaType,
        title: title
    };

    const result = await lib.db
        .insert(lib.Schema.Movie.NotInterested.table)
        .values(newNotInterestedMovie)
        .returning();

    return result[0];
}

/**
 * Remove a movie from "not interested" list
 */
export async function removeFromNotInterested(
    userId: string,
    tmdbId: number,
    mediaType: 'movie' | 'tv'
): Promise<void> {
    await lib.db
        .delete(lib.Schema.Movie.NotInterested.table)
        .where(lib.and(
            lib.eq(lib.Schema.Movie.NotInterested.table.user_id, userId),
            lib.eq(lib.Schema.Movie.NotInterested.table.tmdb_id, tmdbId),
            lib.eq(lib.Schema.Movie.NotInterested.table.media_type, mediaType)
        ));
}

/**
 * Get all not interested movie IDs for a user (for exclusion from recommendations)
 */
export async function getNotInterestedMovieIds(userId: string): Promise<number[]> {
    const results = await lib.db
        .select({ tmdb_id: lib.Schema.Movie.NotInterested.table.tmdb_id })
        .from(lib.Schema.Movie.NotInterested.table)
        .where(lib.eq(lib.Schema.Movie.NotInterested.table.user_id, userId));

    return results.map(result => result.tmdb_id);
}

/**
 * Check if a movie is marked as "not interested"
 */
export async function isNotInterested(
    userId: string,
    tmdbId: number,
    mediaType: 'movie' | 'tv'
): Promise<boolean> {
    const result = await lib.db
        .select()
        .from(lib.Schema.Movie.NotInterested.table)
        .where(lib.and(
            lib.eq(lib.Schema.Movie.NotInterested.table.user_id, userId),
            lib.eq(lib.Schema.Movie.NotInterested.table.tmdb_id, tmdbId),
            lib.eq(lib.Schema.Movie.NotInterested.table.media_type, mediaType)
        ))
        .limit(1);

    return result.length > 0;
}
