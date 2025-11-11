'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/ui/star-rating';
import {
    MoreHorizontal,
    Edit3,
    Trash2,
    Eye,
    Calendar,
    Film,
    Tv,
    Check,
    X,
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
import TMDbService from '@/lib/services/tmdb';
import { Movie } from '@/lib/db/schema';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Tooltip from '../tooltip';

interface MovieCardProps {
    movie: Movie.Movie.Select;
}

export function MovieCard({ movie }: MovieCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editRating, setEditRating] = useState(movie.user_rating || 0);
    const [editComment, setEditComment] = useState(movie.user_comment || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isCommentExpanded, setIsCommentExpanded] = useState(false);
    const [shouldShowSeeMore, setShouldShowSeeMore] = useState(false);

    const commentRef = useRef<HTMLParagraphElement>(null);
    const { updateMovie, deleteMovie } = useMovieActions();

    // Check if text is truncated by comparing scroll height vs client height
    useEffect(() => {
        const checkTextOverflow = () => {
            if (commentRef.current && movie.user_comment && !isCommentExpanded) {
                // Small delay to ensure rendering is complete
                setTimeout(() => {
                    if (commentRef.current) {
                        const isOverflowing = commentRef.current.scrollHeight > commentRef.current.clientHeight;
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
    }, [movie.user_comment, isCommentExpanded]);

    const posterUrl = TMDbService.getImageUrl(movie.poster_path, 'w185');
    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null;

    const handleSave = async () => {
        try {
            await updateMovie(movie.id, {
                user_rating: editRating > 0 ? editRating : null,
                user_comment: editComment.trim() || null
            }, {
                optimistic: true,
                originalMovie: movie
            });
            setIsEditing(false);
            toast.success('Rating and comment updated!');
        } catch (error: unknown) {
            console.error('Failed to update movie:', error);
            toast.error('Failed to update');
        }
    };

    const handleEdit = () => {
        setEditRating(movie.user_rating || 0);
        setEditComment(movie.user_comment || '');
        setIsEditing(true);
    };

    const handleCancel = () => {
        setEditRating(movie.user_rating || 0);
        setEditComment(movie.user_comment || '');
        setIsEditing(false);
    };

    const handleToggleWatchStatus = async () => {
        try {
            const newStatus = movie.watch_status === 'watched' ? 'will_watch' : 'watched';
            await updateMovie(movie.id, {
                watch_status: newStatus,
                watched_date: newStatus === 'watched' ? new Date().toISOString() : undefined
            }, {
                optimistic: true,
                originalMovie: movie
            });
            toast.success(`Moved to ${newStatus === 'watched' ? 'watched' : 'watchlist'}!`);
        } catch (error: unknown) {
            console.error('Failed to update watch status:', error);
            toast.error('Failed to update watch status');
        }
    };

    const handleWatchAgain = async () => {
        try {
            await updateMovie(movie.id, {
                watch_status: 'watch_again',
                watched_date: new Date().toISOString()
            }, {
                optimistic: true,
                originalMovie: movie
            });
            toast.success('Marked to watch again! Added to watchlist.');
        } catch (error: unknown) {
            console.error('Failed to mark watch again:', error);
            toast.error('Failed to mark watch again');
        }
    };

    const handleDelete = async () => {
        try {
            await deleteMovie(movie.id, {
                optimistic: true,
                originalMovie: movie
            });
            setShowDeleteDialog(false);
            toast.success('Movie removed from your list');
        } catch (error: unknown) {
            console.error('Failed to remove movie:', error);
            toast.error('Failed to remove movie');
        }
    };

    return (
        <>
            <Card className="group overflow-hidden lg:hover:shadow-md transition-all duration-200 border-0 bg-card/50">
                <CardContent className="">
                    <div className={`flex ${isEditing ? "" : "gap-4"} `}>
                        {/* Poster */}
                        {/* Poster - slides out when editing */}
                        <div
                            className={`shrink-0 flex justify-center items-center transition-all duration-200
                                ${isEditing ? '-translate-x-24 opacity-0 pointer-events-none w-0' : 'translate-x-0 opacity-100 w-16'}
                            `}
                            style={{ minWidth: isEditing ? 0 : '4rem', width: isEditing ? 0 : '4rem' }}
                            aria-hidden={isEditing}
                        >
                            {posterUrl ? (
                                <img
                                    src={posterUrl}
                                    alt={movie.title}
                                    className="w-16 h-24 object-cover rounded-md shadow-xs transition-transform lg:group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-16 h-24 bg-muted rounded-md flex items-center justify-center transition-colors lg:group-hover:bg-muted/80">
                                    {movie.media_type === 'tv' ? (
                                        <Tv className="w-6 h-6 text-muted-foreground" />
                                    ) : (
                                        <Film className="w-6 h-6 text-muted-foreground" />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex flex-col justify-between flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col items-start md:flex-row gap-2 md:items-center flex-1 min-w-0">
                                    <h3 className="font-medium text-sm line-clamp-2 underline-offset-2 leading-tight underline lg:no-underline lg:group-hover:underline mt-1">
                                        <a href={`https://google.com/search?q=${movie.title}+%28${movie.media_type === 'tv' ? 'TV' : 'Movie'}${" " + movie.release_date}%29`} target='_blank' rel='noopener noreferrer'>
                                            {movie.title}
                                            <span className="inline-block ml-2 lg:opacity-0 lg:group-hover:opacity-100 text-muted-foreground">
                                                <ExternalLink className="inline w-3 h-3" />
                                            </span>
                                        </a>
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        {movie.watch_status === 'watch_again' && (
                                            <Tooltip tooltip="Marked as Watch Again" cursor="cursor-default">
                                                <Badge variant="outline" className="text-xs h-5 shrink-0 border-orange-300 text-orange-700">
                                                    <RotateCcw className="size-3" />
                                                </Badge>
                                            </Tooltip>
                                        )}
                                        <Badge variant="secondary" className="text-xs h-5">
                                            {movie.media_type === 'tv' ? 'TV' : 'Movie'}
                                        </Badge>
                                        {releaseYear && (
                                            <span>{releaseYear}</span>
                                        )}
                                    </div>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={handleToggleWatchStatus}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            Mark as {movie.watch_status === 'watched' ? 'Watchlist' : 'Watched'}
                                        </DropdownMenuItem>
                                        {movie.watch_status === 'watched' && (
                                            <DropdownMenuItem onClick={handleWatchAgain}>
                                                <RotateCcw className="mr-2 h-4 w-4" />
                                                Mark to watch again
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => setShowDeleteDialog(true)}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Remove
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Rating & Comment Section */}
                            {isEditing ? (
                                <div className="space-y-3 border rounded-lg p-3 bg-muted/30 animate-in fade-in-0 duration-200">
                                    <div>
                                        <label className="text-sm font-medium mb-1.5 block text-foreground">Rating</label>
                                        <StarRating
                                            rating={editRating}
                                            onRatingChange={setEditRating}
                                            size="sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-1.5 block text-foreground">Comment</label>
                                        <Textarea
                                            value={editComment}
                                            onChange={(e) => {
                                                setEditComment(e.target.value);
                                            }}
                                            placeholder="Share your thoughts..."
                                            className="min-h-20 text-sm resize-none overflow-hidden"
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <Button size="sm" onClick={handleSave} className="h-8 px-3">
                                            <Check className="w-3 h-3 mr-1.5" />
                                            Save
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleCancel}
                                            className="h-8 px-3"
                                        >
                                            <X className="w-3 h-3 mr-1.5" />
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {/* Rating Display */}
                                    <div className="flex items-center justify-between">
                                        <StarRating
                                            rating={movie.user_rating}
                                            readonly
                                            size="sm"
                                        />
                                    </div>

                                    {/* Comment Display */}
                                    {movie.user_comment && (
                                        <div className="space-y-1">
                                            <p
                                                ref={commentRef}
                                                className={`text-sm text-muted-foreground leading-relaxed transition-all duration-200 ${isCommentExpanded ? '' : 'line-clamp-2'
                                                    }`}
                                            >
                                                {movie.user_comment}
                                            </p>
                                            {(shouldShowSeeMore || isCommentExpanded) && (
                                                <button
                                                    onClick={() => setIsCommentExpanded(!isCommentExpanded)}
                                                    className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                                                >
                                                    {isCommentExpanded ? 'See less' : 'See more'}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center">
                                        {/* Metadata */}
                                        {movie.watched_date && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Calendar className="w-3 h-3" />
                                                {format(new Date(movie.watched_date), 'MMM dd, yyyy')}
                                            </div>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleEdit}
                                            className="h-7 px-2 text-xs lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                                        >
                                            <Edit3 className="w-3 h-3 mr-1" />
                                            Edit
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent maxHeight='max-h-72'>
                    <DialogHeader>
                        <DialogTitle>Remove Movie</DialogTitle>
                    </DialogHeader>
                    <p className="text-muted-foreground">
                        Are you sure you want to remove &quot;{movie.title}&quot; from your list?
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
