'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
    rating: number | null;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function StarRating({
    rating,
    onRatingChange,
    readonly = false,
    size = 'md',
    className
}: StarRatingProps) {
    const sizeClasses = {
        sm: 'w-5 h-5',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };

    const handleClick = (starIndex: number, isHalf: boolean) => {
        if (readonly || !onRatingChange) return;
        const value = starIndex + (isHalf ? 0.5 : 1);
        onRatingChange(value);
    };

    const renderStar = (starIndex: number) => {
        const starValue = starIndex + 1;
        const currentRating = rating || 0;

        // Determine star state
        const isFull = currentRating >= starValue;
        const isHalf = currentRating >= starValue - 0.5 && currentRating < starValue;

        return (
            <div
                key={starIndex}
                className={cn(
                    'relative',
                    !readonly && 'cursor-pointer',
                    readonly && 'cursor-default',
                    sizeClasses[size]
                )}
            >
                {/* Background (empty) star */}
                <Star
                    className={cn(
                        'absolute inset-0 transition-colors',
                        'text-gray-300 fill-transparent',
                        sizeClasses[size]
                    )}
                />

                {/* Filled star overlay */}
                {(isFull || isHalf) && (
                    <div
                        className="absolute inset-0 overflow-hidden"
                        style={{
                            clipPath: isHalf ? 'inset(0 50% 0 0)' : 'none'
                        }}
                    >
                        <Star
                            className={cn(
                                'absolute inset-0 text-yellow-400 fill-yellow-400 transition-colors',
                                sizeClasses[size]
                            )}
                        />
                    </div>
                )}

                {/* Interactive overlay for editing */}
                {!readonly && (
                    <>
                        {/* Left half - for 0.5 increments */}
                        <button
                            type="button"
                            className="absolute inset-0 w-1/2 opacity-0 hover:opacity-30 hover:bg-yellow-400 transition-opacity"
                            onClick={() => handleClick(starIndex, true)}
                            onMouseEnter={() => {
                                // Optional: Preview half star on hover
                            }}
                        />
                        {/* Right half - for full increments */}
                        <button
                            type="button"
                            className="absolute inset-0 left-1/2 w-1/2 opacity-0 hover:opacity-30 hover:bg-yellow-400 transition-opacity"
                            onClick={() => handleClick(starIndex, false)}
                        />
                    </>
                )}
            </div>
        );
    };

    return (
        <>
            <div className={cn("flex items-center gap-1", className)}>
                {Array.from({ length: 5 }, (_, index) => renderStar(index))}
            </div>
            {
                rating !== null ? (
                    <span className="ml-2 text-sm text-muted-foreground">
                        {rating.toFixed(1)}/5.0
                    </span>
                ) : readonly && (
                    <span className="text-xs text-muted-foreground">Not rated</span>
                )
            }
        </>
    );
}
