'use client';

import { useEffect } from 'react';
import { useMovies } from '@/hooks/use-movies';
import { MovieCard } from '@/components/big/movie-tracker/movie-card';

interface DailyMoviesProps {
    dayStart?: Date;
    dayEnd?: Date;
    onDataStatusChange?: (hasData: boolean) => void;
}

export function DailyMovies({ dayStart, dayEnd, onDataStatusChange }: DailyMoviesProps) {
    const { movies, isLoading, error } = useMovies('watched');

    // Filter movies watched on the selected day
    const moviesWatchedToday = movies.filter(movie => {
        if (!movie.watched_date || !dayStart || !dayEnd) return false;
        const watchedDate = new Date(movie.watched_date);
        return watchedDate >= dayStart && watchedDate <= dayEnd;
    });

    const hasData = moviesWatchedToday.length > 0;

    useEffect(() => {
        if (!isLoading && onDataStatusChange) {
            onDataStatusChange(hasData);
        }
    }, [hasData, isLoading, onDataStatusChange]);

    if (isLoading) {
        return null;
    }

    if (error) {
        return (
            <div className="flex flex-col items-start justify-center w-full">
                <div className="w-full text-sm text-amber-600 dark:text-amber-400 mt-2">Error loading movies</div>
            </div>
        );
    }

    return hasData ? (
        <div className="flex flex-col items-start justify-center w-full">
            <div className="w-full flex flex-col gap-2">
                {moviesWatchedToday.map(movie => (
                    <MovieCard key={movie.id} movie={movie} />
                ))}
            </div>
        </div>
    ) : null;
}
