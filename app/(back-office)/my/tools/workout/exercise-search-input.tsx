"use client"

import { useExerciseSearch } from "@/hooks/use-workouts"
import { useDebouncedCallback } from "use-debounce"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function ExerciseSearchInput({
    value,
    onChange,
    className,
    id,
}: {
    value: string
    onChange: (value: string) => void
    className?: string
    id?: string
}) {
    const [inputValue, setInputValue] = useState<string>(value)
    const { exercises, isLoading } = useExerciseSearch(inputValue)
    const [showSuggestions, setShowSuggestions] = useState(false)

    const handleChange = useDebouncedCallback((value: string) => {
        onChange(value)
    }, 200)

    return (
        <div className={cn("relative w-full", className)}>
            <input
                type="text"
                id={id}
                value={inputValue}
                onFocus={() => setShowSuggestions(true)}
                onBlur={(e) => {
                    // Delay hiding to allow click on suggestions
                    setTimeout(() => {
                        if (!e.relatedTarget || !e.relatedTarget.closest(".exercise-suggestions")) {
                            setShowSuggestions(false)
                        }
                    }, 100)
                }}
                onChange={(e) => {
                    setInputValue(e.target.value)
                    handleChange(e.target.value)
                }}
                className={cn(
                    "w-full bg-transparent px-2 outline-none",
                    "text-lg md:text-lg font-medium",
                    className
                )}
                placeholder="Exercise name"
            />
            {showSuggestions && inputValue && exercises.length > 0 && (
                <div
                    className="absolute z-50 mt-1 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-md exercise-suggestions max-h-48"
                    tabIndex={-1}
                >
                    {isLoading ? (
                        <div className="p-2 text-sm text-muted-foreground">Loading exercises...</div>
                    ) : (
                        <ul className="">
                            {exercises.map((exercise, index) => (
                                <li
                                    key={index}
                                    className={`cursor-pointer px-3 py-2 text-sm lg:hover:bg-accent ${inputValue === exercise.name ? "bg-primary/10" : ""}`}
                                    onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
                                    onClick={() => {
                                        setInputValue(exercise.name)
                                        onChange(exercise.name)
                                        setShowSuggestions(false)
                                    }}
                                >
                                    {exercise.name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}
