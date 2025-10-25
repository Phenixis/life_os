import { useState, useEffect, useRef } from 'react'

interface UseStreamingSimulationProps {
    text: string
    shouldSimulate: boolean
    speed?: number
    onComplete?: () => void
}

export function useStreamingSimulation({ 
    text, 
    shouldSimulate, 
    speed = 50, 
    onComplete 
}: UseStreamingSimulationProps) {
    const [displayText, setDisplayText] = useState("")
    const [isSimulating, setIsSimulating] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const indexRef = useRef(0)

    useEffect(() => {
        if (shouldSimulate && text && text.length > displayText.length) {
            setIsSimulating(true)
            
            const simulateTyping = () => {
                if (indexRef.current < text.length) {
                    setDisplayText(text.slice(0, indexRef.current + 1))
                    indexRef.current += 1
                    timeoutRef.current = setTimeout(simulateTyping, speed)
                } else {
                    setIsSimulating(false)
                    onComplete?.()
                }
            }

            // Clear any existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            // Start simulation from where we left off
            simulateTyping()
        } else if (!shouldSimulate || !text) {
            // When simulation should stop, show the full text immediately
            setDisplayText(text || "")
            indexRef.current = text?.length || 0
            setIsSimulating(false)
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [text, shouldSimulate, speed, displayText.length, onComplete])

    // Reset when text changes significantly (new message)
    useEffect(() => {
        if (text && text !== displayText && !text.startsWith(displayText)) {
            setDisplayText("")
            indexRef.current = 0
        }
    }, [text, displayText])

    return {
        displayText,
        isSimulating
    }
}
