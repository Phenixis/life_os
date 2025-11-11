'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Film, Eye, Clock, Star, RotateCcw } from 'lucide-react';
import { useMovieStats } from '@/hooks/use-movies';

export function MovieStats() {
    const { stats, isLoading } = useMovieStats();

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i} className="first:col-span-2 md:first:col-span-1">
                        <CardContent fullPadding>
                            <div className="animate-pulse">
                                <div className="h-4 bg-muted rounded-sm mb-2"></div>
                                <div className="h-8 bg-muted rounded-sm"></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const statsData = [
        {
            title: 'Total Movies',
            value: stats.total,
            icon: Film,
            color: 'text-blue-600'
        },
        {
            title: 'Watched',
            value: stats.watched,
            icon: Eye,
            color: 'text-green-600'
        },
        {
            title: 'Will Watch',
            value: stats.willWatch,
            icon: Clock,
            color: 'text-orange-600'
        },
        {
            title: 'Watch Again',
            value: stats.watchAgain,
            icon: RotateCcw,
            color: 'text-purple-600'
        },
        {
            title: 'Avg Rating',
            value: stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A',
            icon: Star,
            color: 'text-yellow-600',
            suffix: stats.averageRating ? '/5.0' : ''
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {statsData.map((stat) => {
                const Icon = stat.icon;
                return (
                    <Card key={stat.title} className="first:col-span-2 md:first:col-span-1">
                        <CardContent fullPadding>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {stat.title}
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {stat.value}
                                        {stat.suffix && (
                                            <span className="text-sm text-muted-foreground ml-1">
                                                {stat.suffix}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <Icon className={`h-8 w-8 ${stat.color}`} />
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
