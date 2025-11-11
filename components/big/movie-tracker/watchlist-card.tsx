'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    MoreHorizontal,
    Eye,
    Trash2,
    Film,
    Tv,
    Calendar,
    ExternalLink,
    RotateCcw
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { useMovieActions } from '@/hooks/use-movies';
import { StarRating } from '@/components/ui/star-rating';
import TMDbService from '@/lib/services/tmdb';
import { Movie } from '@/lib/db/schema';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Tooltip from '@/components/big/tooltip';

interface WatchlistCardProps {
    movie: Movie.Movie.Select;
}

export function WatchlistCard({ movie }: WatchlistCardProps) {
    const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
    const [shouldShowSeeMore, setShouldShowSeeMore] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const overviewRef = useRef<HTMLParagraphElement>(null);
    const { updateMovie, deleteMovie } = useMovieActions();

    // Check if text is truncated by comparing scroll height vs client height
    useEffect(() => {
        const checkTextOverflow = () => {
            if (overviewRef.current && movie.overview && !isOverviewExpanded) {
                // Small delay to ensure rendering is complete
                setTimeout(() => {
                    if (overviewRef.current) {
                        const isOverflowing = overviewRef.current.scrollHeight > overviewRef.current.clientHeight;
                        setShouldShowSeeMore(isOverflowing);
                    }
                }, 10);
            } else {
                setShouldShowSeeMore(false);
            }
        };

        checkTextOverflow();

        // Re-check on window resize
        window.addEventListener('resize', checkTextOverflow);
        return () => window.removeEventListener('resize', checkTextOverflow);
    }, [movie.overview, isOverviewExpanded]);

    const posterUrl = TMDbService.getImageUrl(movie.poster_path, 'w342');
    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null;

    const handleMarkAsWatched = async () => {
        try {
            await updateMovie(movie.id, {
                watch_status: 'watched',
                watched_date: new Date().toISOString()
            }, {
                optimistic: true,
                originalMovie: movie
            });
            toast.success('Marked as watched!');
        } catch (error) {
            console.log(error)
            toast.error('Failed to update watch status');
        }
    };

    const handleDelete = async () => {
        try {
            await deleteMovie(movie.id, {
                optimistic: true,
                originalMovie: movie
            });
            setShowDeleteDialog(false);
            toast.success('Removed from watchlist');
        } catch (error) {
            console.log(error)
            toast.error('Failed to remove from watchlist');
        }
    };

    const handleRateMovie = async (rating: number) => {
        try {
            await updateMovie(movie.id, {
                watch_status: 'watched',
                watched_date: new Date().toISOString(),
                user_rating: rating
            }, {
                optimistic: true,
                originalMovie: movie
            });
            toast.success(`Rated ${rating}/5 and marked as watched!`);
        } catch (error) {
            console.log(error);
            toast.error('Failed to rate movie');
        }
    };

    return (
        <>
            <Card className="group/Card overflow-hidden hover:shadow-md transition-all duration-200">
                <CardContent fullPadding>
                    <div className="relative group/Poster">
                        {/* Poster */}
                        {posterUrl ? (
                            <img
                                src={posterUrl}
                                alt={movie.title}
                                className="w-full aspect-2/3 object-cover"
                            />
                        ) : (
                            <div className="w-full aspect-2/3 bg-muted flex items-center justify-center">
                                {movie.media_type === 'tv' ? (
                                    <Tv className="w-8 h-8 text-muted-foreground" />
                                ) : (
                                    <Film className="w-8 h-8 text-muted-foreground" />
                                )}
                            </div>
                        )}

                        {/* Hover overlay with action button */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 lg:group-hover/Poster:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <Button
                                onClick={handleMarkAsWatched}
                                size="sm"
                                className="gap-2 w-[80%]"
                            >
                                <Eye className="w-3 h-3" />
                                Mark as Watched
                            </Button>
                            <div className="w-[80%] bg-primary/90 backdrop-blur-xs p-3 rounded-md">
                                <StarRating
                                    rating={null}
                                    onRatingChange={handleRateMovie}
                                    size="md"
                                    className="justify-center"
                                />
                            </div>
                            <Button
                                onClick={() => setShowDeleteDialog(true)}
                                size="sm"
                                variant="destructive"
                                className="gap-2 w-[80%]"
                            >
                                <Trash2 className="w-3 h-3" />
                                Remove
                            </Button>
                        </div>

                        {/* TMDb rating badge */}
                        {movie.vote_average && movie.vote_average > 0 && (
                            <div className="absolute top-2 right-2">
                                <Badge variant="secondary" className="text-xs bg-black/70 text-white border-0">
                                    ★ {movie.vote_average.toFixed(1)}
                                </Badge>
                            </div>
                        )}

                        {/* Options menu */}
                        <div className="absolute top-2 left-2 lg:opacity-0 lg:group-hover/Card:opacity-100 transition-opacity">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" size="sm" className="h-8 w-8 p-0 bg-black/70 hover:bg-black/80 border-0">
                                        <MoreHorizontal className="h-4 w-4 text-white" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem onClick={handleMarkAsWatched}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Mark as Watched
                                    </DropdownMenuItem>
                                    <div className="px-2 py-1.5">
                                        <StarRating
                                            rating={null}
                                            onRatingChange={handleRateMovie}
                                            size="md"
                                            className="justify-start"
                                        />
                                    </div>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => setShowDeleteDialog(true)}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Remove
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="py-2">
                        {/* Header with badges */}
                        <div className="flex items-center gap-2 mb-2">
                            {movie.watch_status === 'watch_again' && (
                                <Tooltip tooltip="Marked as Watch Again" cursor="cursor-default">
                                    <Badge variant="outline" className="text-xs h-5 shrink-0 border-orange-300 text-orange-700">
                                        <RotateCcw className="size-3" />
                                    </Badge>
                                </Tooltip>
                            )}
                            <Badge variant="outline" className="text-xs h-5 shrink-0">
                                {movie.media_type === 'tv' ? 'TV' : 'Movie'}
                            </Badge>
                            {releaseYear && (
                                <span className="text-xs text-muted-foreground">{releaseYear}</span>
                            )}
                        </div>

                        {/* Title */}
                        <h3 className="font-medium text-sm line-clamp-2 mb-2 leading-tight underline lg:no-underline lg:group-hover/Card:underline">
                            <a href={`https://google.com/search?q=${movie.title}+%28${movie.media_type === 'tv' ? 'TV' : 'Movie'}${" " + movie.release_date}%29`} target='_blank' rel='noopener noreferrer'>
                                {movie.title}
                                <span className="lg:hidden lg:group-hover/Card:inline-block text-muted-foreground ml-1">
                                    <ExternalLink className="inline w-3 h-3" />
                                </span>
                            </a>
                        </h3>

                        {/* Overview */}
                        {movie.overview ? (
                            <div className="space-y-1">
                                <p
                                    ref={overviewRef}
                                    className={`text-xs text-muted-foreground leading-relaxed transition-all duration-200 ${isOverviewExpanded ? '' : 'line-clamp-3'
                                        }`}
                                >
                                    {movie.overview}
                                </p>
                                {(shouldShowSeeMore || isOverviewExpanded) && (
                                    <button
                                        onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                                        className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                                    >
                                        {isOverviewExpanded ? 'See less' : 'See more'}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground/60 italic">
                                No overview available
                            </p>
                        )}

                        {/* Date added */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3 pt-2 border-t border-border/50">
                            <Calendar className="w-3 h-3" />
                            Added {format(new Date(movie.created_at), 'MMM dd, yyyy')}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove from Watchlist</DialogTitle>
                    </DialogHeader>
                    <p className="text-muted-foreground">
                        Are you sure you want to remove &quot;{movie.title}&quot; from your watchlist?
                        This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Remove
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
