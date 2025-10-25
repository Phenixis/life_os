'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { WatchlistCard } from './watchlist-card';
import { useMovies } from '@/hooks/use-movies';
import { useDebounce } from 'use-debounce';
import { Search, SortAsc, SortDesc, ChevronLeft, ChevronRight, Film, Tv } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getClientWatchlistFilterCookie, updateClientWatchlistFilterCookie } from '@/lib/utils/client-cookies';
import type { WatchlistFilterCookie } from '@/lib/types/watchlist';

type SortBy = 'updated' | 'title' | 'vote_average' | 'date_added';
type SortOrder = 'asc' | 'desc';
type MediaFilter = 'all' | 'movie' | 'tv';

const ITEMS_PER_PAGE = 30;

export function WatchlistGrid() {
    // Initialize states from cookies
    const [isClient, setIsClient] = useState(false);
    const [filters, setFilters] = useState<WatchlistFilterCookie>(() => {
        if (typeof window !== 'undefined') {
            return getClientWatchlistFilterCookie();
        }
        return {
            search: '',
            sortBy: 'date_added',
            sortOrder: 'desc',
            mediaFilter: 'all',
            currentPage: 1
        };
    });
    
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [sortBy, setSortBy] = useState<SortBy>(filters.sortBy || 'date_added');
    const [sortOrder, setSortOrder] = useState<SortOrder>(filters.sortOrder || 'desc');
    const [currentPage, setCurrentPage] = useState(filters.currentPage || 1);
    const [mediaFilter, setMediaFilter] = useState<MediaFilter>(filters.mediaFilter || 'all');
    const [debouncedQuery] = useDebounce(searchQuery, 300);

    // Set client flag on mount to prevent hydration mismatch
    useEffect(() => {
        setIsClient(true);
        // Load filters from cookies on client
        const cookieFilters = getClientWatchlistFilterCookie();
        setSearchQuery(cookieFilters.search || '');
        setSortBy(cookieFilters.sortBy || 'date_added');
        setSortOrder(cookieFilters.sortOrder || 'desc');
        setCurrentPage(cookieFilters.currentPage || 1);
        setMediaFilter(cookieFilters.mediaFilter || 'all');
    }, []);

    // Update cookies when filters change
    const updateFilters = useCallback((updates: Partial<WatchlistFilterCookie>) => {
        if (!isClient) return;
        
        const newFilters = updateClientWatchlistFilterCookie(updates);
        setFilters(newFilters);
    }, [isClient]);

    // Update cookies when individual states change
    useEffect(() => {
        if (!isClient) return;
        updateFilters({ search: searchQuery });
    }, [searchQuery, updateFilters, isClient]);

    useEffect(() => {
        if (!isClient) return;
        updateFilters({ sortBy });
        setCurrentPage(1); // Reset to first page when sorting changes
    }, [sortBy, updateFilters, isClient]);

    useEffect(() => {
        if (!isClient) return;
        updateFilters({ sortOrder });
        setCurrentPage(1); // Reset to first page when sort order changes
    }, [sortOrder, updateFilters, isClient]);

    useEffect(() => {
        if (!isClient) return;
        updateFilters({ currentPage });
    }, [currentPage, updateFilters, isClient]);

    useEffect(() => {
        if (!isClient) return;
        updateFilters({ mediaFilter });
        setCurrentPage(1); // Reset to first page when filter changes
    }, [mediaFilter, updateFilters, isClient]);

    const { movies: willWatchMovies, isLoading: isLoadingWillWatch } = useMovies('will_watch');
    const { movies: watchAgainMovies, isLoading: isLoadingWatchAgain } = useMovies('watch_again');
    const { movies: searchMovies, isLoading: isLoadingSearch } = useMovies(undefined, debouncedQuery);

    // Determine which movies to show
    let movies = [...willWatchMovies, ...watchAgainMovies];
    let isLoading = isLoadingWillWatch || isLoadingWatchAgain;

    if (debouncedQuery) {
        // Filter search results to show both will_watch and watch_again movies
        movies = searchMovies.filter(movie => 
            movie.watch_status === 'will_watch' || movie.watch_status === 'watch_again'
        );
        isLoading = isLoadingSearch;
    }

    // Apply media type filter
    if (mediaFilter !== 'all') {
        movies = movies.filter(movie => movie.media_type === mediaFilter);
    }

    // Sort movies
    const sortedMovies = [...movies].sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
            case 'title':
                comparison = a.title.localeCompare(b.title);
                break;
            case 'vote_average':
                const ratingA = a.vote_average || 0;
                const ratingB = b.vote_average || 0;
                comparison = ratingA - ratingB;
                break;
            case 'date_added':
                comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                break;
            case 'updated':
            default:
                comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
                break;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Pagination calculations
    const totalMovies = sortedMovies.length;
    const totalPages = Math.ceil(totalMovies / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedMovies = sortedMovies.slice(startIndex, endIndex);

    // Ensure current page doesn't exceed total pages
    useEffect(() => {
        if (totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const sortOptions = [
        { value: 'date_added', label: 'Date Added' },
        { value: 'updated', label: 'Recently Updated' },
        { value: 'title', label: 'Title' },
        { value: 'tmdb_rating', label: 'Rating' },
    ];

    return (
        <div className="space-y-6">
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Search your watchlist..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Media Type Filter */}
                <div className="flex gap-1">
                    <Button
                        variant={mediaFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMediaFilter('all')}
                        className="h-10 px-3"
                    >
                        All
                    </Button>
                    <Button
                        variant={mediaFilter === 'movie' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMediaFilter('movie')}
                        className="h-10 px-3 gap-1"
                    >
                        <Film className="w-3 h-3" />
                        Movies
                    </Button>
                    <Button
                        variant={mediaFilter === 'tv' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMediaFilter('tv')}
                        className="h-10 px-3 gap-1"
                    >
                        <Tv className="w-3 h-3" />
                        TV
                    </Button>
                </div>

                {/* Sort */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            {sortOrder === 'asc' ? (
                                <SortAsc className="w-4 h-4" />
                            ) : (
                                <SortDesc className="w-4 h-4" />
                            )}
                            {sortOptions.find(s => s.value === sortBy)?.label}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {sortOptions.map((option) => (
                            <DropdownMenuItem
                                key={option.value}
                                onClick={() => setSortBy(option.value as SortBy)}
                            >
                                {option.label}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Order</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setSortOrder('desc')}>
                            <SortDesc className="w-4 h-4 mr-2" />
                            Descending
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortOrder('asc')}>
                            <SortAsc className="w-4 h-4 mr-2" />
                            Ascending
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Results count and pagination info */}
            {!isLoading && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {totalMovies} {totalMovies === 1 ? 'item' : 'items'} in your watchlist
                        {mediaFilter !== 'all' && (
                            <span className="ml-1">
                                ({mediaFilter === 'movie' ? 'movies' : 'TV shows'} only)
                            </span>
                        )}
                        {totalPages > 1 && (
                            <span className="ml-2">
                                (Page {currentPage} of {totalPages})
                            </span>
                        )}
                    </p>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="gap-1"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                {startIndex + 1}-{Math.min(endIndex, totalMovies)} of {totalMovies}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="gap-1"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Movie Grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="aspect-2/3 bg-muted rounded-lg animate-pulse"></div>
                    ))}
                </div>
            ) : paginatedMovies.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {paginatedMovies.map((movie) => (
                        <WatchlistCard key={movie.id} movie={movie} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="text-muted-foreground">
                        {debouncedQuery ? (
                            <>No {mediaFilter !== 'all' ? (mediaFilter === 'movie' ? 'movies' : 'TV shows') : 'items'} found for &quot;{debouncedQuery}&quot; in your watchlist</>
                        ) : mediaFilter !== 'all' ? (
                            <>No {mediaFilter === 'movie' ? 'movies' : 'TV shows'} in your watchlist</>
                        ) : (
                            <>Your watchlist is empty</>
                        )}
                    </div>
                    {!debouncedQuery && mediaFilter === 'all' && (
                        <p className="text-sm text-muted-foreground mt-2">
                            Discover new movies to add to your watchlist!
                        </p>
                    )}
                </div>
            )}

            {/* Bottom pagination for large lists */}
            {!isLoading && totalPages > 1 && paginatedMovies.length > 0 && (
                <div className="flex justify-center items-center gap-2 pt-6">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                    >
                        First
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="gap-1"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </Button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNumber;
                            if (totalPages <= 5) {
                                pageNumber = i + 1;
                            } else {
                                // Show pages around current page
                                const start = Math.max(1, currentPage - 2);
                                const end = Math.min(totalPages, start + 4);
                                pageNumber = start + i;
                                if (pageNumber > end) return null;
                            }
                            
                            return (
                                <Button
                                    key={pageNumber}
                                    variant={currentPage === pageNumber ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePageChange(pageNumber)}
                                    className="w-10"
                                >
                                    {pageNumber}
                                </Button>
                            );
                        }).filter(Boolean)}
                    </div>
                    
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="gap-1"
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                    >
                        Last
                    </Button>
                </div>
            )}
        </div>
    );
}
