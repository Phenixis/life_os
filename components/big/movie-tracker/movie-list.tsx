'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MovieCard } from './movie-card';
import { useMovies } from '@/hooks/use-movies';
import type { Movie } from '@/lib/db/schema';
import { useDebounce } from 'use-debounce';
import { ChevronLeft, ChevronRight, Search, SortAsc, SortDesc, Star } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { getClientMoviesFilterCookie, updateClientMoviesFilterCookie } from '@/lib/utils/client-cookies';
import type { MoviesFilterCookie } from '@/lib/types/watchlist';

type SortBy = 'updated' | 'title' | 'vote_average' | 'date_added';
type SortOrder = 'asc' | 'desc';
type RatingFilter = 'all' | '1' | '2' | '3' | '4' | '5' | 'no_rating';

const ITEMS_PER_PAGE = 30;

export function MovieList() {
    // Initialize states from cookies
    const [isClient, setIsClient] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortBy>('updated');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [debouncedQuery] = useDebounce(searchQuery, 300);

    // Set client flag on mount to prevent hydration mismatch
    useEffect(() => {
        setIsClient(true);
        // Load filters from cookies on client
        const cookieFilters = getClientMoviesFilterCookie();
        setSearchQuery(cookieFilters.search || '');
        setSortBy(cookieFilters.sortBy || 'updated');
        setSortOrder(cookieFilters.sortOrder || 'desc');
        setRatingFilter(cookieFilters.ratingFilter || 'all');
        setCurrentPage(cookieFilters.currentPage || 1);
    }, []);

    // Update cookies when filters change
    const updateFilters = useCallback((updates: Partial<MoviesFilterCookie>) => {
        if (!isClient) return;
        updateClientMoviesFilterCookie(updates);
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
        updateFilters({ ratingFilter });
        setCurrentPage(1); // Reset to first page when rating filter changes
    }, [ratingFilter, updateFilters, isClient]);

    useEffect(() => {
        if (!isClient) return;
        updateFilters({ currentPage });
    }, [currentPage, updateFilters, isClient]);

    // Since this component is used for watched movies, we need both watched and watch_again movies
    const { movies: watchedMovies, isLoading } = useMovies('watched');
    const { movies: watchAgainMovies, isLoading: isLoadingWatchAgain } = useMovies('watch_again');
    const { movies: searchMovies, isLoading: isLoadingSearch } = useMovies(undefined, debouncedQuery);

    // Determine which movies to show
    let movies: Movie.Movie.Select[] = [];
    let actualIsLoading = false;

    if (debouncedQuery) {
        // Filter search results to show both watched and watch_again movies
        movies = searchMovies.filter(movie =>
            movie.watch_status === 'watched' || movie.watch_status === 'watch_again'
        );
        actualIsLoading = isLoadingSearch;
    } else {
        // Combine watched and watch_again movies
        movies = [...watchedMovies, ...watchAgainMovies];
        actualIsLoading = isLoading || isLoadingWatchAgain;
    }

    // Reset to first page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedQuery]);

    // Filter movies by rating
    const filteredMovies = movies.filter((movie) => {
        if (ratingFilter === 'all') return true;
        if (ratingFilter === 'no_rating') {
            return !movie.user_rating || movie.user_rating === 0;
        }

        const rating = movie.user_rating;
        if (!rating) return false;

        const filterRating = parseInt(ratingFilter);
        return Math.floor(rating) === filterRating;
    });

    // Sort movies
    const sortedMovies = [...filteredMovies].sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
            case 'title':
                comparison = a.title.localeCompare(b.title);
                break;
            case 'vote_average':
                const ratingA = a.user_rating || 0;
                const ratingB = b.user_rating || 0;
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

    // Calculate pagination
    const totalItems = sortedMovies.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedMovies = sortedMovies.slice(startIndex, endIndex);

    const sortOptions = [
        { value: 'updated', label: 'Recently Updated' },
        { value: 'date_added', label: 'Date Added' },
        { value: 'title', label: 'Title' },
        { value: 'vote_average', label: 'Rating' },
    ];

    // Handle page changes
    const handlePageChange = useCallback((page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    }, [totalPages]);

    return (
        <div className="space-y-6">
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Search your watched movies..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Rating Filter */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <Star className="w-4 h-4" />
                            {ratingFilter === 'all' ? 'All Ratings' :
                                ratingFilter === 'no_rating' ? 'No Rating' :
                                    `${ratingFilter} Star${ratingFilter !== '1' ? 's' : ''}`}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Filter by Rating</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setRatingFilter('all')}>
                            All Ratings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRatingFilter('5')}>
                            5 Stars
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRatingFilter('4')}>
                            4 Stars
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRatingFilter('3')}>
                            3 Stars
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRatingFilter('2')}>
                            2 Stars
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRatingFilter('1')}>
                            1 Star
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRatingFilter('no_rating')}>
                            No Rating
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

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

            {/* Movie List */}
            {actualIsLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-28 bg-muted rounded-lg animate-pulse"></div>
                    ))}
                </div>
            ) : paginatedMovies.length > 0 ? (
                <>
                    {/* Pagination */}
                    {!isLoading && (
                        <p className="text-sm text-muted-foreground">
                            {totalItems} {totalItems === 1 ? 'item' : 'items'} in your watchlist
                        </p>
                    )}

                    {/* Movie Cards */}
                    <div className="space-y-3 grid grid-cols-1 md:grid-cols-2">
                        {paginatedMovies.map((movie) => (
                            <MovieCard key={movie.id} movie={movie} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (currentPage > 1) {
                                                    setCurrentPage(currentPage - 1);
                                                }
                                            }}
                                            className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                                        />
                                    </PaginationItem>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(page => {
                                            // Show first page, last page, current page, and pages around current
                                            return page === 1 ||
                                                page === totalPages ||
                                                Math.abs(page - currentPage) <= 1;
                                        })
                                        .map((page, index, array) => {
                                            const prevPage = array[index - 1];
                                            const showEllipsis = prevPage && page - prevPage > 1;

                                            return (
                                                <PaginationItem key={page}>
                                                    {showEllipsis && (
                                                        <span className="px-4 py-2 text-muted-foreground">...</span>
                                                    )}
                                                    <PaginationLink
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setCurrentPage(page);
                                                        }}
                                                        isActive={currentPage === page}
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            );
                                        })}

                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (currentPage < totalPages) {
                                                    setCurrentPage(currentPage + 1);
                                                }
                                            }}
                                            className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-12">
                    <div className="text-muted-foreground">
                        {debouncedQuery ? (
                            <>No movies found for &quot;{debouncedQuery}&quot;</>
                        ) : ratingFilter !== 'all' ? (
                            ratingFilter === 'no_rating' ? (
                                <>No movies without ratings found</>
                            ) : (
                                <>No {ratingFilter} star movies found</>
                            )
                        ) : (
                            <>No watched movies yet</>
                        )}
                    </div>
                    {!debouncedQuery && ratingFilter === 'all' && (
                        <p className="text-sm text-muted-foreground mt-2">
                            Search for movies above to start building your collection!
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
