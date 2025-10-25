'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Sparkles,
    TrendingUp,
    Target,
    Film,
    Tv,
    Plus,
    Loader2,
    RefreshCw,
    MoreHorizontal,
    X,
    ExternalLink
} from 'lucide-react';
import { useMovieRecommendations, useMovieActions } from '@/hooks/use-movies';
import TMDbService from '@/lib/services/tmdb';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StarRating } from '@/components/ui/star-rating';
import { getClientDiscoverFilterCookie, updateClientDiscoverFilterCookie } from '@/lib/utils/client-cookies';

interface DiscoverMoviesProps {
    className?: string;
}

interface DiscoverMovieItem {
    id: number;
    title?: string;
    name?: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
    media_type?: 'movie' | 'tv';
    recommendation_source?: string;
}

interface MovieCardItemProps {
    item: DiscoverMovieItem;
    isAdding: boolean;
    onAddToWatchlist: (tmdbId: number, mediaType: 'movie' | 'tv') => void;
    onRateMovie: (tmdbId: number, mediaType: 'movie' | 'tv', rating: number) => void;
    onMarkAsNotInterested: (tmdbId: number, mediaType: 'movie' | 'tv', title: string) => void;
    getSourceIcon: (source: string) => React.ReactNode;
    getSourceLabel: (source: string) => string;
}

function MovieCardItem({
    item,
    isAdding,
    onAddToWatchlist,
    onRateMovie,
    onMarkAsNotInterested,
    getSourceIcon,
    getSourceLabel
}: MovieCardItemProps) {
    const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
    const [shouldShowSeeMore, setShouldShowSeeMore] = useState(false);
    const overviewRef = useRef<HTMLParagraphElement>(null);

    const title = 'title' in item ? item.title : item.name;
    const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
    const posterUrl = TMDbService.getImageUrl(item.poster_path, 'w342');

    // Check if overview text is truncated
    useEffect(() => {
        const checkTextOverflow = () => {
            if (overviewRef.current && item.overview && !isOverviewExpanded) {
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

        window.addEventListener('resize', checkTextOverflow);
        return () => window.removeEventListener('resize', checkTextOverflow);
    }, [item.overview, isOverviewExpanded]);

    return (
        <Card className="group/Card overflow-hidden hover:shadow-md transition-all duration-200">
            <CardContent fullPadding className="flex md:flex-col items-start gap-4">
                <div className="group/Poster relative min-w-[140px] w-[40%] md:w-full">
                    {posterUrl ? (
                        <img
                            src={posterUrl}
                            alt={title}
                            className="w-full aspect-2/3 object-cover"
                        />
                    ) : (
                        <div className="w-full aspect-2/3 bg-muted flex items-center justify-center">
                            {item.media_type === 'tv' ? (
                                <Tv className="w-8 h-8 text-muted-foreground" />
                            ) : (
                                <Film className="w-8 h-8 text-muted-foreground" />
                            )}
                        </div>
                    )}

                    {/* Overlay with add buttons */}
                    <div className={`absolute inset-0 bg-black/60 ${isAdding ? "flex" : "hidden lg:group-hover/Poster:flex transition-opacity"} flex-col items-center justify-center gap-2`}>
                        {
                            isAdding ? (
                                <Loader2 className="size-4 text-white animate-spin" />
                            ) : (
                                <>
                                    <Button
                                        onClick={() => onAddToWatchlist(item.id, item.media_type || 'movie')}
                                        size="sm"
                                        className="gap-2 w-full max-w-[200px]"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add to Watchlist
                                    </Button>
                                    <div className="w-full max-w-[200px] bg-primary/90 backdrop-blur-xs p-3 rounded-md">
                                        <StarRating
                                            rating={null}
                                            onRatingChange={(rating) => onRateMovie(item.id, item.media_type || 'movie', rating)}
                                            size="md"
                                            className="justify-center"
                                        />
                                    </div>
                                    <Button
                                        onClick={() => onMarkAsNotInterested(item.id, item.media_type || 'movie', title ?? '')}
                                        size="sm"
                                        variant="destructive"
                                        className="gap-2 w-full max-w-[200px]"
                                    >
                                        <X className="w-3 h-3" />
                                        Not Interested
                                    </Button>
                                </>
                            )
                        }
                    </div>

                    {/* Source badge */}
                    <div className="absolute bottom-2 right-2">
                        <Badge variant="secondary" className="text-xs gap-1 bg-black/70 lg:hover:bg-black/70 text-white border-0">
                            <span className="lg:hidden lg:group-hover/Poster:inline-block">
                                {getSourceLabel('recommendation_source' in item && item.recommendation_source ? item.recommendation_source : 'trending')}
                            </span>
                            {getSourceIcon('recommendation_source' in item && item.recommendation_source ? item.recommendation_source : 'trending')}
                        </Badge>
                    </div>

                    {/* Rating badge */}
                    {item.vote_average > 0 && (
                        <div className="absolute top-2 right-2">
                            <Badge variant="secondary" className="text-xs bg-black/70 lg:hover:bg-black/70 text-white border-0">
                                ★ {item.vote_average.toFixed(1)}
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
                                <DropdownMenuItem onClick={() => onAddToWatchlist(item.id, item.media_type || 'movie')} disabled={isAdding}>
                                    {isAdding ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Plus className="w-3 h-3" />
                                    )}
                                    Add to Watchlist
                                </DropdownMenuItem>
                                <div className="px-2 py-1.5">
                                    <StarRating
                                        rating={null}
                                        onRatingChange={(rating) => onRateMovie(item.id, item.media_type || 'movie', rating)}
                                        size="md"
                                        className="justify-start"
                                    />
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => onMarkAsNotInterested(item.id, item.media_type || 'movie', title ?? "")}
                                    disabled={isAdding}
                                    className="text-destructive focus:text-destructive"
                                >
                                    {isAdding ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <X className="w-3 h-3" />
                                    )}
                                    Not Interested
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="w-full h-full">
                    <div className="flex items-start gap-2 mb-2">
                        <Badge variant="outline" className="text-xs h-5 shrink-0">
                            {item.media_type === 'tv' ? 'TV' : 'Movie'}
                        </Badge>
                        {year && (
                            <span className="text-xs text-muted-foreground">{year}</span>
                        )}
                    </div>

                    <h3 className="font-medium text-sm line-clamp-2 mb-2 leading-tight underline lg:no-underline lg:group-hover/Card:underline">
                        <a href={`https://google.com/search?q=${title}+%28${item.media_type === 'tv' ? 'TV' : 'Movie'}${" " + year}%29`} target='_blank' rel='noopener noreferrer'>
                            {title}
                            <span className="lg:hidden lg:group-hover/Card:inline-block text-muted-foreground ml-1">
                                <ExternalLink className="inline w-3 h-3" />
                            </span>
                        </a>
                    </h3>

                    {item.overview && (
                        <div className="space-y-1">
                            <p
                                ref={overviewRef}
                                className={`text-xs text-muted-foreground leading-relaxed transition-all duration-200 ${isOverviewExpanded ? '' : 'line-clamp-6 md:line-clamp-3'
                                    }`}
                            >
                                {item.overview}
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
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export function DiscoverMovies({ className }: DiscoverMoviesProps) {
    // Initialize media filter from cookies
    const [isClient, setIsClient] = useState(false);
    const [mediaFilter, setMediaFilter] = useState<'all' | 'movie' | 'tv'>('all');

    const { recommendations, isLoading, error, refresh, replaceRecommendation } = useMovieRecommendations(mediaFilter);
    const { addMovie, markAsNotInterested } = useMovieActions();
    const [addingIds, setAddingIds] = useState<Set<number>>(new Set());
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Set client flag on mount to prevent hydration mismatch
    useEffect(() => {
        setIsClient(true);
        // Load filters from cookies on client
        const cookieFilters = getClientDiscoverFilterCookie();
        setMediaFilter(cookieFilters.filter || 'all');
    }, []);

    // Update media filter and save to cookies
    const updateMediaFilter = (newFilter: 'all' | 'movie' | 'tv') => {
        if (!isClient) return;
        
        setMediaFilter(newFilter);
        updateClientDiscoverFilterCookie({ filter: newFilter });
    };

    const handleAddToWatchlist = async (tmdbId: number, mediaType: 'movie' | 'tv') => {
        // First try optimistic update (immediate replacement if buffer available)
        const replacedMovie = await replaceRecommendation(tmdbId, true);
        
        // Only show loading state if we couldn't do optimistic replacement
        if (!replacedMovie) {
            setAddingIds(prev => new Set(prev).add(tmdbId));
        }

        try {
            // Add movie with optimization flag
            await addMovie(tmdbId, mediaType, 'will_watch', { optimizeRecommendations: true });

            // If we didn't do optimistic replacement, do regular replacement
            if (!replacedMovie) {
                await replaceRecommendation(tmdbId);
            }

            toast.success('Added to your watchlist!');
        } catch (error: unknown) {
            // If optimistic update failed, revert it by refreshing
            if (replacedMovie) {
                await refresh();
            }
            
            const errorMessage = error instanceof Error ? error.message : '';
            if (errorMessage.includes('already in your list')) {
                toast.info('This is already in your list');
            } else {
                toast.error('Failed to add to watchlist');
            }
        } finally {
            setAddingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(tmdbId);
                return newSet;
            });
        }
    };

    const handleRateMovie = async (tmdbId: number, mediaType: 'movie' | 'tv', rating: number) => {
        // First try optimistic update (immediate replacement if buffer available)
        const replacedMovie = await replaceRecommendation(tmdbId, true);
        
        // Only show loading state if we couldn't do optimistic replacement
        if (!replacedMovie) {
            setAddingIds(prev => new Set(prev).add(tmdbId));
        }

        try {
            toast.success(`Rated ${rating}/5 and added to watched movies!`);

            // Add movie with rating and watch status
            await addMovie(tmdbId, mediaType, 'watched', { 
                optimizeRecommendations: true,
                rating: rating
            });

            // If we didn't do optimistic replacement, do regular replacement
            if (!replacedMovie) {
                await replaceRecommendation(tmdbId);
            }

        } catch (error: unknown) {
            // If optimistic update failed, revert it by refreshing
            if (replacedMovie) {
                await refresh();
            }
            
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (errorMessage.includes('already in your list')) {
                toast.info('This is already in your list');
            } else {
                toast.error('Failed to rate movie');
            }
        } finally {
            setAddingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(tmdbId);
                return newSet;
            });
        }
    };

    const handleMarkAsNotInterested = async (tmdbId: number, mediaType: 'movie' | 'tv', title: string) => {
        // First try optimistic update (immediate replacement if buffer available)
        const replacedMovie = await replaceRecommendation(tmdbId, true);
        
        // Only show loading state if we couldn't do optimistic replacement
        if (!replacedMovie) {
            setAddingIds(prev => new Set(prev).add(tmdbId));
        }

        try {
            // Mark as not interested with optimization flag
            await markAsNotInterested(tmdbId, mediaType, title, { optimizeRecommendations: true });

            // If we didn't do optimistic replacement, do regular replacement
            if (!replacedMovie) {
                await replaceRecommendation(tmdbId);
            }

            toast.success('Marked as not interested - won\'t appear in future recommendations');
        } catch (error: unknown) {
            // If optimistic update failed, revert it by refreshing
            if (replacedMovie) {
                await refresh();
            }
            
            console.log(error)
            toast.error('Failed to mark as not interested');
        } finally {
            setAddingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(tmdbId);
                return newSet;
            });
        }
    };

    const handleRefresh = async () => {
        try {
            setIsRefreshing(true);
            await refresh();
            toast.success('Recommendations refreshed!');
        } catch (error) {
            console.log(error)
            toast.error('Failed to refresh recommendations');
        } finally {
            setIsRefreshing(false);
        }
    };



    const getSourceIcon = (source: string) => {
        switch (source) {
            case 'similar_to_rated':
                return <Target className="w-3 h-3" />;
            case 'genre_discovery':
                return <Sparkles className="w-3 h-3" />;
            case 'trending':
                return <TrendingUp className="w-3 h-3" />;
            default:
                return <Sparkles className="w-3 h-3" />;
        }
    };

    const getSourceLabel = (source: string) => {
        switch (source) {
            case 'similar_to_rated':
                return 'Similar to rated';
            case 'genre_discovery':
                return 'Genre match';
            case 'trending':
                return 'Trending';
            default:
                return 'Recommended';
        }
    };

    if (error) {
        return (
            <Card className={className}>
                <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">Failed to load recommendations</p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => window.location.reload()}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={className}>
            <Card>
                <CardHeader>
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-2 p-2">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-yellow-500" />
                                Discover
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1 hidden lg:block">
                                {recommendations.method === 'personalized'
                                    ? `Based on ${recommendations.based_on?.high_rated_count || 0} highly-rated titles`
                                    : null
                                }
                            </p>
                        </div>

                        <div className="flex lg:flex-row items-center gap-2">
                            {/* Refresh Button */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={isLoading || isRefreshing}
                                className="h-8 px-3"
                            >
                                <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>

                            {/* Media Filter Buttons */}
                            <div className="flex gap-1">
                                <Button
                                    variant={mediaFilter === 'all' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => updateMediaFilter('all')}
                                    className="h-8 px-3"
                                >
                                    All
                                </Button>
                                <Button
                                    variant={mediaFilter === 'movie' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => updateMediaFilter('movie')}
                                    className="h-8 px-3"
                                >
                                    <Film className="w-3 h-3 mr-1" />
                                    Movies
                                </Button>
                                <Button
                                    variant={mediaFilter === 'tv' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => updateMediaFilter('tv')}
                                    className="h-8 px-3"
                                >
                                    <Tv className="w-3 h-3 mr-1" />
                                    TV
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6 pt-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-muted-foreground">Finding recommendations...</span>
                        </div>
                    ) : recommendations.recommendations.length === 0 ? (
                        <div className="text-center py-12">
                            <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                            <p className="text-muted-foreground">No recommendations available</p>
                            <p className="text-sm text-muted-foreground/70 mt-1">
                                Rate some movies to get personalized suggestions!
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                            {recommendations.recommendations.map((item) => {
                                const isAdding = addingIds.has(item.id);

                                return (
                                    <MovieCardItem
                                        key={`${item.id}-${item.media_type}`}
                                        item={item}
                                        isAdding={isAdding}
                                        onAddToWatchlist={handleAddToWatchlist}
                                        onRateMovie={handleRateMovie}
                                        onMarkAsNotInterested={handleMarkAsNotInterested}
                                        getSourceIcon={getSourceIcon}
                                        getSourceLabel={getSourceLabel}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {/* Strategy info for personalized recommendations */}
                    {recommendations.method === 'personalized' && recommendations.based_on && (
                        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Recommendation strategy:</span> Based on your highly-rated content,
                                using {recommendations.based_on.strategies_used.join(', ')} to find similar titles.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
