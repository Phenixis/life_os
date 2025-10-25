import { useState, useEffect, useRef } from 'react'

interface StreamingTextProps {
    text: string
    isStreaming: boolean
    speed?: number
    onComplete?: () => void
    className?: string
}

export function StreamingText({ 
    text, 
    isStreaming, 
    speed = 50, 
    onComplete,
    className = ""
}: StreamingTextProps) {
    const [displayText, setDisplayText] = useState("")
    const [isAnimating, setIsAnimating] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const indexRef = useRef(0)

    useEffect(() => {
        if (isStreaming && text.length > displayText.length) {
            setIsAnimating(true)
            
            const animateText = () => {
                if (indexRef.current < text.length) {
                    setDisplayText(text.slice(0, indexRef.current + 1))
                    indexRef.current += 1
                    timeoutRef.current = setTimeout(animateText, speed)
                } else {
                    setIsAnimating(false)
                    onComplete?.()
                }
            }

            // Clear any existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            // Start animation from where we left off
            animateText()
        } else if (!isStreaming) {
            // When streaming stops, show the full text immediately
            setDisplayText(text)
            indexRef.current = text.length
            setIsAnimating(false)
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [text, isStreaming, speed, displayText.length, onComplete])

    // Update index when text changes (for real streaming)
    useEffect(() => {
        if (text.length > indexRef.current) {
            indexRef.current = text.length
        }
    }, [text])

    return (
        <span className={className}>
            {displayText}
            {isAnimating && (
                <span className="inline-block w-2 h-4 bg-gray-600 ml-1 streaming-cursor" />
            )}
        </span>
    )
}
