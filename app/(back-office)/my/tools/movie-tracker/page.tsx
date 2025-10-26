'use client';

import { useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Sparkles, Eye } from 'lucide-react';
import { MovieStats } from '@/components/big/movie-tracker/movie-stats';
import { MovieSearch } from '@/components/big/movie-tracker/movie-search';
import { MovieList } from '@/components/big/movie-tracker/movie-list';
import { WatchlistGrid } from '@/components/big/movie-tracker/watchlist-grid';
import { DiscoverMovies } from '@/components/big/movie-tracker/discover-movies';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

export default function MovieTrackerPage() {
    const [showSearchDialog, setShowSearchDialog] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    
    // Simple approach: directly use searchParams for active tab
    const currentTab = searchParams.get('tab') || 'watchlist';
    const validTabs = ['watchlist', 'movies', 'discover'];
    const activeTab = validTabs.includes(currentTab) ? currentTab : 'watchlist';

    // Tab change handler - clear params and only keep relevant ones for the new tab
    const handleTabChange = (newTab: string) => {
        // Only handle tab changes if the tab is actually different
        if (newTab === activeTab) {
            return;
        }
        
        const params = new URLSearchParams();
        params.set('tab', newTab);
        
        // Preserve only tab-specific params when switching tabs
        if (newTab === 'movies') {
            // No need to preserve params since they're stored in cookies
        } else if (newTab === 'watchlist') {
            // No need to preserve params since they're stored in cookies
        } else if (newTab === 'discover') {
            // No need to preserve params since they're stored in cookies
        }
        
        router.replace(`${pathname}?${params.toString()}`);
    };

    const handleMovieAdded = () => {
        setShowSearchDialog(false);
        // The movie list will automatically refresh due to SWR
    };

    return (
        <section className="page">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-title">Movie Tracker</h1>
                    <p className="page-description">
                        Track, rate, and organize your movie and TV show collection
                    </p>
                </div>
                
                <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Add Movie
                        </Button>
                    </DialogTrigger>
                    <DialogContent maxHeight='max-h-130' className="">
                        <div className="flex flex-col justify-start gap-4">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Search className="w-5 h-5" />
                                Search Movies & TV Shows
                            </DialogTitle>
                        </DialogHeader>
                        <MovieSearch onMovieAdded={handleMovieAdded} />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <MovieStats />

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="movies" className="gap-2">
                        <Search className="w-4 h-4" />
                        My Movies
                    </TabsTrigger>
                    <TabsTrigger value="watchlist" className="gap-2">
                        <Eye className="w-4 h-4" />
                        Watchlist
                    </TabsTrigger>
                    <TabsTrigger value="discover" className="gap-2">
                        <Sparkles className="w-4 h-4" />
                        Discover
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="movies" className="space-y-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle>Watched Movies</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <MovieList />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="watchlist" className="space-y-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle>Your Watchlist</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <WatchlistGrid />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="discover" className="space-y-6">
                    <DiscoverMovies />
                </TabsContent>
            </Tabs>
        </section>
    );
}