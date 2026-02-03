"use client";

import { useDarkMode } from "@/hooks/use-dark-mode";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import Confetti from "react-confetti";

type TimeElapsed = {
    seconds: number;
    minutes: number;
    hours: number;
    days: number;
    months: number;
    years: number;
};

function calculateTimeElapsed(lastRelapse: Date): TimeElapsed {
    const now = new Date();
    const diff = Math.max(0, now.getTime() - lastRelapse.getTime());

    const totalSeconds = Math.floor(diff / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
    
    const DAYS_PER_YEAR = 365.25; // Account for leap years
    const DAYS_PER_MONTH = DAYS_PER_YEAR / 12; // ~30.4375
    
    const totalYears = Math.floor(totalDays / DAYS_PER_YEAR);
    const totalMonths = Math.floor(totalDays / DAYS_PER_MONTH);

    return {
        seconds: totalSeconds % 60,
        minutes: totalMinutes % 60,
        hours: totalHours % 24,
        days: Math.floor(totalDays % DAYS_PER_MONTH),
        months: totalMonths % 12,
        years: totalYears,
    };
}

type RingProps = {
    radius: number;
    progress: number;
    max: number;
    color: string;
    label: string;
    value: number;
    cx: number;
    cy: number;
};

function ProgressRing({ radius, progress, max, color, label, value, cx, cy }: RingProps) {
    const strokeWidth = 20;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / max) * circumference;

    const darkMode = useDarkMode();

    return (
        <g>
            {/* Background circle */}
            <circle
                stroke={darkMode.darkMode?.dark_mode ? "hsl(224 71% 4%)" : "hsl(0 0% 100%)"}
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx={cx}
                cy={cy}
                filter="url(#innerShadow)"
            />
            {/* Passive circle */}
            <circle
                stroke={color}
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx={cx}
                cy={cy}
                opacity={0.15}
                filter="url(#innerShadow)"
            />
            {/* Progress circle */}
            <circle
                stroke={color}
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.3s ease' }}
                r={normalizedRadius}
                cx={cx}
                cy={cy}
                transform={`rotate(-90 ${cx} ${cy})`}
                filter="url(#innerShadow)"
            />
        </g>
    );
}

type CircularTimerProps = {
    lastRelapse: Date;
    className?: string;
};

export function CircularTimer({ lastRelapse, className }: CircularTimerProps) {
    const [timeElapsed, setTimeElapsed] = useState<TimeElapsed>(calculateTimeElapsed(lastRelapse));
    const [prevTimeElapsed, setPrevTimeElapsed] = useState<TimeElapsed>(calculateTimeElapsed(lastRelapse));
    const [showConfetti, setShowConfetti] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Measure container dimensions
    useEffect(() => {
        if (containerRef.current) {
            const { offsetWidth, offsetHeight } = containerRef.current;
            setDimensions({ width: offsetWidth, height: offsetHeight });
        }
    }, []);

    // Update immediately when lastRelapse changes
    useEffect(() => {
        const newTime = calculateTimeElapsed(lastRelapse);
        setTimeElapsed(newTime);
        setPrevTimeElapsed(newTime); // Set both to avoid false triggers on addiction switch
    }, [lastRelapse]);

    // Update every second and check for completions
    useEffect(() => {
        const interval = setInterval(() => {
            setPrevTimeElapsed(timeElapsed);
            const newTime = calculateTimeElapsed(lastRelapse);
            setTimeElapsed(newTime);

            // Check for ring completions (rollover from max-1 to 0)
            const completions = [
                { prev: timeElapsed.seconds, curr: newTime.seconds, max: 60, label: 'minute' },
                { prev: timeElapsed.minutes, curr: newTime.minutes, max: 60, label: 'hour' },
                { prev: timeElapsed.hours, curr: newTime.hours, max: 24, label: 'day' },
                { prev: timeElapsed.days, curr: newTime.days, max: 30, label: 'month' },
                { prev: timeElapsed.months, curr: newTime.months, max: 12, label: 'year' },
            ];

            const hasCompletion = completions.some(({ prev, curr, max }) => {
                // Detect rollover: previous was near max and current is 0
                return prev === max - 1 && curr === 0;
            });

            if (hasCompletion) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 15000);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [lastRelapse, timeElapsed]);

    // Configuration for dynamic ring calculation
    const RING_SPACING = 20; // Space between rings (they overlap since spacing < strokeWidth)
    const START_RADIUS = 80;

    // Calculate radii dynamically based on ring count
    const ringData = [
        { progress: timeElapsed.seconds, max: 60, color: "#ef4444", label: "seconds", value: timeElapsed.seconds },
        { progress: timeElapsed.minutes, max: 60, color: "#f97316", label: "minutes", value: timeElapsed.minutes },
        { progress: timeElapsed.hours, max: 24, color: "#eab308", label: "hours", value: timeElapsed.hours },
        { progress: timeElapsed.days, max: 30, color: "#22c55e", label: "days", value: timeElapsed.days },
        { progress: timeElapsed.months, max: 12, color: "#8b5cf6", label: "months", value: timeElapsed.months },
        { progress: timeElapsed.years, max: 10, color: "#ec4899", label: "years", value: timeElapsed.years },
    ];

    const rings = ringData.map((data, index) => ({
        ...data,
        radius: START_RADIUS + (index * RING_SPACING)
    }));

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Calculate total time for encouragement message
    const totalDays = Math.floor((new Date().getTime() - lastRelapse.getTime()) / (1000 * 60 * 60 * 24));
    const encouragementMessage = useMemo(() => {
        if (totalDays === 0) return "💪 Every second counts!";
        if (totalDays < 7) return "🌱 Great start! Keep going!";
        if (totalDays < 31) return "🔥 You're building momentum!";
        if (totalDays < 90) return "🌟 Incredible progress!";
        if (totalDays < 365) return "🏆 You're a champion!";
        return "👑 Legendary discipline!";
    }, [totalDays]);

    return (
        <div ref={containerRef} className={cn("flex flex-col items-start gap-6 relative", className)}>
            {showConfetti && dimensions.width > 0 && (
                <Confetti
                    width={dimensions.width}
                    height={dimensions.height}
                    recycle={false}
                    numberOfPieces={500}
                    gravity={0.15}
                    initialVelocityX={3}
                    initialVelocityY={6}
                    confettiSource={{ 
                        x: dimensions.width / 2, 
                        y: 185, 
                        w: 10, 
                        h: 10 
                    }}
                />
            )}
            <p className="text-lg text-green-600 dark:text-green-400 font-medium">{encouragementMessage}</p>

            <div className="relative">
                <svg width="370" height="370" viewBox="0 0 370 370" className="max-w-full h-auto">
                    {/* Shadow filter */}
                    <defs>
                        <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                            <feOffset dx="0" dy="2" result="offsetblur" />
                            <feComponentTransfer>
                                <feFuncA type="linear" slope="0.3" />
                            </feComponentTransfer>
                            <feMerge>
                                <feMergeNode />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Rings from outer to inner */}
                    {rings.slice().reverse().map((ring, index) => (
                        <ProgressRing key={index} {...ring} cx={185} cy={185} />
                    ))}

                    {/* Center circle with date/time */}
                    <circle
                        cx="185"
                        cy="185"
                        r="59"
                        className="fill-gray-100 dark:fill-gray-800"
                    />
                    <text
                        x="185"
                        y="170"
                        textAnchor="middle"
                        className="fill-gray-500 dark:fill-gray-400 text-xs"
                        fontSize="10"
                    >
                        Last relapse
                    </text>
                    <text
                        x="185"
                        y="187"
                        textAnchor="middle"
                        className="fill-gray-800 dark:fill-gray-200 font-semibold"
                        fontSize="12"
                    >
                        {formatDate(lastRelapse)}
                    </text>
                    <text
                        x="185"
                        y="203"
                        textAnchor="middle"
                        className="fill-gray-600 dark:fill-gray-300"
                        fontSize="11"
                    >
                        {formatTime(lastRelapse)}
                    </text>
                </svg>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-6 gap-4 text-sm">
                {rings.map((ring, index) => (
                    <div key={index} className="flex flex-col items-center gap-1">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: ring.color }}
                        />
                        <span className="font-bold text-lg" style={{ color: ring.color }}>{ring.value}</span>
                        <span className="text-gray-600 dark:text-gray-400 text-xs">{ring.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}