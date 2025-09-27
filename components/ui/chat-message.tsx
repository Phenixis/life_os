"use client"

import { useState, useEffect, useRef, Fragment } from 'react'
import { Ai } from '@/lib/db/schema'

interface ChatMessageProps {
    message: Ai.Message.Select
    isStreaming?: boolean
    chatLoading?: boolean
    enableStreamingSimulation?: boolean
}

export function ChatMessage({ 
    message, 
    isStreaming = false, 
    chatLoading = false,
    enableStreamingSimulation = true
}: ChatMessageProps) {
    const [displayText, setDisplayText] = useState("")
    const [isSimulating, setIsSimulating] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const indexRef = useRef(0)
    const lastContentRef = useRef("")

    // Check if this is a streaming temporary message
    const isStreamingMessage = message.role === "assistant" && 
                              message.id.startsWith("temp_") && 
                              (chatLoading || isStreaming)

    // Simulate streaming effect for assistant messages
    useEffect(() => {
        if (isStreamingMessage && enableStreamingSimulation && message.content) {
            // If this is a new message or content has changed significantly
            if (message.content !== lastContentRef.current) {
                lastContentRef.current = message.content
                
                // If content is much longer than what we're displaying, simulate streaming
                if (message.content.length > displayText.length + 10) {
                    setIsSimulating(true)
                    
                    const simulateTyping = () => {
                        if (indexRef.current < message.content.length) {
                            const nextChar = Math.min(indexRef.current + 1, message.content.length)
                            setDisplayText(message.content.slice(0, nextChar))
                            indexRef.current = nextChar
                            timeoutRef.current = setTimeout(simulateTyping, 20)
                        } else {
                            setIsSimulating(false)
                        }
                    }

                    // Clear any existing timeout
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current)
                    }

                    // Start or continue simulation
                    simulateTyping()
                } else {
                    // Content hasn't changed much, just show it
                    setDisplayText(message.content)
                    indexRef.current = message.content.length
                    setIsSimulating(false)
                }
            }
        } else {
            // Not streaming, show full content immediately
            setDisplayText(message.content || "")
            indexRef.current = message.content?.length || 0
            setIsSimulating(false)
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [message.content, isStreamingMessage, enableStreamingSimulation, displayText.length])

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    const textToShow = isStreamingMessage ? displayText : message.content

    return (
        <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
                className={`max-w-[66%] w-fit px-4 py-2 rounded-lg ${
                    message.role === "user" 
                        ? " rounded-ee-none bg-blue-500 text-white" 
                        : "bg-gray-200 text-gray-900 rounded-es-none"
                }`}
            >
                {textToShow ? (
                    <div className="whitespace-pre-wrap">
                        {textToShow.split("\n").map(
                            (content: string, id: number) => 
                            <Fragment key={id}>
                                {content}
                                {id < textToShow.split("\n").length - 1 && <br/>}
                            </Fragment>
                        )}
                        {/* Show typing indicator for streaming assistant messages */}
                        {isStreamingMessage && isSimulating && (
                            <span className="inline-block w-2 h-4 bg-gray-600 ml-1 streaming-cursor" />
                        )}
                    </div>
                ) : message.role === "assistant" ? (
                    <div className="text-gray-500 italic flex items-center space-x-2">
                        <span>Thinking</span>
                        <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                            <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                            <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
