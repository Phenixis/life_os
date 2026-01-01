import { useEffect } from "react"

interface UseSwipeToOpenOptions {
    isOpen: boolean
    onOpen: () => void
    isEnabled?: boolean
    minSwipeDistance?: number
    maxVerticalDistance?: number
}

/**
 * Custom hook that detects left-to-right swipe gestures to open a sidebar or drawer.
 * 
 * @param options.isOpen - Current open state of the sidebar
 * @param options.onOpen - Callback to open the sidebar
 * @param options.isEnabled - Whether swipe detection is enabled (default: true)
 * @param options.minSwipeDistance - Minimum horizontal distance for a valid swipe (default: 50px)
 * @param options.maxVerticalDistance - Maximum vertical distance to distinguish from scrolling (default: 100px)
 */
export function useSwipeToOpen({
    isOpen,
    onOpen,
    isEnabled = true,
    minSwipeDistance = 50,
    maxVerticalDistance = 100,
}: UseSwipeToOpenOptions) {
    useEffect(() => {
        if (!isEnabled) return

        let touchStartX = 0
        let touchStartY = 0
        let touchEndX = 0
        let touchEndY = 0

        const handleTouchStart = (e: TouchEvent) => {
            touchStartX = e.changedTouches[0].screenX
            touchStartY = e.changedTouches[0].screenY
        }

        const handleTouchEnd = (e: TouchEvent) => {
            touchEndX = e.changedTouches[0].screenX
            touchEndY = e.changedTouches[0].screenY

            const horizontalDistance = touchEndX - touchStartX
            const verticalDistance = Math.abs(touchEndY - touchStartY)

            // Check if it's a left-to-right swipe
            const isLeftToRightSwipe = horizontalDistance > minSwipeDistance
            
            // Check if vertical movement is minimal (not scrolling)
            const isHorizontalSwipe = verticalDistance < maxVerticalDistance

            if (isLeftToRightSwipe && isHorizontalSwipe && !isOpen) {
                onOpen()
            }
        }

        document.addEventListener('touchstart', handleTouchStart)
        document.addEventListener('touchend', handleTouchEnd)

        return () => {
            document.removeEventListener('touchstart', handleTouchStart)
            document.removeEventListener('touchend', handleTouchEnd)
        }
    }, [isEnabled, isOpen, onOpen, minSwipeDistance, maxVerticalDistance])
}
