'use client'

import { useState, useEffect, Dispatch, SetStateAction } from 'react'

/**
 * Custom hook that extends useState with localStorage persistence
 * @param key - The localStorage key to store the value
 * @param initialValue - The initial value if no localStorage value exists
 * @returns A tuple with the value, setter function, and remove function
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, Dispatch<SetStateAction<T>>, () => void] {
    // Initialize state with value from localStorage or initialValue
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue
        }

        try {
            const item = window.localStorage.getItem(key)
            return item ? JSON.parse(item) : initialValue
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error)
            return initialValue
        }
    })

    // Update localStorage whenever the value changes
    useEffect(() => {
        if (typeof window === 'undefined') {
            return
        }

        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue))
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error)
        }
    }, [key, storedValue])

    // Remove the item from localStorage and reset to initial value
    const removeValue = () => {
        if (typeof window === 'undefined') {
            return
        }

        try {
            window.localStorage.removeItem(key)
            setStoredValue(initialValue)
        } catch (error) {
            console.error(`Error removing localStorage key "${key}":`, error)
        }
    }

    return [storedValue, setStoredValue, removeValue]
}
