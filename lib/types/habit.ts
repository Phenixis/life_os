// Habit Tracker Types and Constants
import { dynamicIconImports } from 'lucide-react/dynamic'

// Frequency options for habits
export const HABIT_FREQUENCIES = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    QUARTERLY: 'quarterly',
    YEARLY: 'yearly'
} as const;

export type HabitFrequency = typeof HABIT_FREQUENCIES[keyof typeof HABIT_FREQUENCIES];

// Predefined color set for habits (following common UI color schemes)
export const HABIT_COLORS = {
    RED: 'red',
    ORANGE: 'orange',
    AMBER: 'amber',
    YELLOW: 'yellow',
    LIME: 'lime',
    GREEN: 'green',
    EMERALD: 'emerald',
    TEAL: 'teal',
    CYAN: 'cyan',
    SKY: 'sky',
    BLUE: 'blue',
    INDIGO: 'indigo',
    VIOLET: 'violet',
    PURPLE: 'purple',
    FUCHSIA: 'fuchsia',
    PINK: 'pink',
    ROSE: 'rose',
    GRAY: 'gray',
    SLATE: 'slate',
    ZINC: 'zinc'
} as const;

export type HabitColor = typeof HABIT_COLORS[keyof typeof HABIT_COLORS];

// Comprehensive Lucide icons for habits
export const HABIT_ICONS : (keyof typeof dynamicIconImports)[] = [
    'check-circle',
    'calendar',
    'star',
    'activity',
    'heart',
    'medal',
    'flag',
    'sun',
    'moon',
    'book',
    'coffee',
    'dumbbell',
    'leaf',
    'glass-water',
    'briefcase',
    'feather',
    'flame',
    'footprints',
    'hand',
    'headphones',
    'lightbulb',
    'list-checks',
    'pen',
    'smile',
    'target',
    'timer',
    'umbrella',
    'watch',
    'wifi'
] as const;

export type HabitIcon = typeof HABIT_ICONS[number];

// Helper type for habit with calculated streak information
export interface HabitWithStreak {
    id: number;
    user_id: string;
    title: string;
    description: string | null;
    color: HabitColor;
    icon: HabitIcon;
    frequency: HabitFrequency;
    target_count: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    current_streak: number;
    longest_streak: number;
    completion_rate: number; // Percentage of completion for the current period
    last_completed: Date | null;
}

// Type for habit statistics
// A cycle is one occurrence of the habit frequency (e.g., one day for daily habits, one week for weekly, one month for monthly, three months for quarterly, one year for yearly)
export interface HabitStats {
    number_of_cycles: number; 
    number_of_cycles_completed: number;
    number_of_cycles_uncompleted: number;
    number_of_cycles_in_progress: number;
    current_streak_of_cycles_completed: number;
    longest_streak_of_cycles_completed: number;
    completion_rate: number;
}

// Progress tracking types
export interface HabitWithCompletion {
    habit: {
        id: number;
        title: string;
        color: HabitColor;
        icon: string;
        frequency: HabitFrequency;
        target_count: number;
        description?: string;
    };
    isCompleted: boolean;
    currentCount: number;
    targetCount: number;
    completionPercentage: number;
}

export interface HabitCycleProgress {
    cycleStart: Date;
    cycleEnd: Date;
    habits: HabitWithCompletion[];
}

export interface ProgressCycleResponse {
    progress: HabitCycleProgress;
}

// Utility functions for frequency calculations
export const getFrequencyDays = (frequency: HabitFrequency): number => {
    switch (frequency) {
        case HABIT_FREQUENCIES.DAILY:
            return 1;
        case HABIT_FREQUENCIES.WEEKLY:
            return 7;
        case HABIT_FREQUENCIES.MONTHLY:
            return 30; // Approximate
        case HABIT_FREQUENCIES.QUARTERLY:
            return 91; // Approximate
        case HABIT_FREQUENCIES.YEARLY:
            return 365;
        default:
            return 1;
    }
};

export const getFrequencyLabel = (frequency: HabitFrequency): string => {
    return frequency.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Color mapping for consistent styling
export const colorMap: Record<HabitColor, { bg: string, border: string, text: string }> = {
    red: { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-500' },
    orange: { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-500' },
    amber: { bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-500' },
    yellow: { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-500' },
    lime: { bg: 'bg-lime-500', border: 'border-lime-500', text: 'text-lime-500' },
    green: { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-500' },
    emerald: { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-500' },
    teal: { bg: 'bg-teal-500', border: 'border-teal-500', text: 'text-teal-500' },
    cyan: { bg: 'bg-cyan-500', border: 'border-cyan-500', text: 'text-cyan-500' },
    sky: { bg: 'bg-sky-500', border: 'border-sky-500', text: 'text-sky-500' },
    blue: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500' },
    indigo: { bg: 'bg-indigo-500', border: 'border-indigo-500', text: 'text-indigo-500' },
    violet: { bg: 'bg-violet-500', border: 'border-violet-500', text: 'text-violet-500' },
    purple: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-500' },
    fuchsia: { bg: 'bg-fuchsia-500', border: 'border-fuchsia-500', text: 'text-fuchsia-500' },
    pink: { bg: 'bg-pink-500', border: 'border-pink-500', text: 'text-pink-500' },
    rose: { bg: 'bg-rose-500', border: 'border-rose-500', text: 'text-rose-500' },
    gray: { bg: 'bg-gray-500', border: 'border-gray-500', text: 'text-gray-500' },
    slate: { bg: 'bg-slate-500', border: 'border-slate-500', text: 'text-slate-500' },
    zinc: { bg: 'bg-zinc-500', border: 'border-zinc-500', text: 'text-zinc-500' },
}

export const getHabitColorClasses = (color: HabitColor) => {
    return colorMap[color] || colorMap.gray; // Default to gray if color not found
};