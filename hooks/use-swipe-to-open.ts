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
 * Only triggers when not swiping on carousels or horizontally scrollable containers.
 * 
 * @param options.isOpen - Current open state of the sidebar
 * @param options.onOpen - Callback to open the sidebar
 * @param options.isEnabled - Whether swipe detection is enabled (default: true)
 * @param options.minSwipeDistance - Minimum horizontal distance for a valid swipe (default: 80px)
 * @param options.maxVerticalDistance - Maximum vertical distance to distinguish from scrolling (default: 100px)
 */
export function useSwipeToOpen({
    isOpen,
    onOpen,
    isEnabled = true,
    minSwipeDistance = 80,
    maxVerticalDistance = 100,
}: UseSwipeToOpenOptions) {
    useEffect(() => {
        if (!isEnabled) return

        let touchStartX = 0
        let touchStartY = 0
        let touchEndX = 0
        let touchEndY = 0
        let targetElement: EventTarget | null = null

        /**
         * Check if the target element or any of its parents is horizontally scrollable
         */
        const isHorizontallyScrollable = (element: EventTarget | null): boolean => {
            if (!(element instanceof HTMLElement)) return false
            
            let current: HTMLElement | null = element
            while (current && current !== document.body) {
                const style = window.getComputedStyle(current)
                const overflowX = style.overflowX
                
                // Check if element has horizontal overflow and can scroll
                if ((overflowX === 'scroll' || overflowX === 'auto') && current.scrollWidth > current.clientWidth) {
                    return true
                }
                
                current = current.parentElement
            }
            
            return false
        }

        /**
         * Check if the target element or any of its parents is a carousel or swipeable component
         */
        const isCarouselOrSwipeable = (element: EventTarget | null): boolean => {
            if (!(element instanceof HTMLElement)) return false
            
            let current: HTMLElement | null = element
            while (current && current !== document.body) {
                const classList = current.classList
                const hasCarouselClass = Array.from(classList).some(className => 
                    className.includes('carousel') || 
                    className.includes('swiper') || 
                    className.includes('slider') ||
                    className.includes('embla')
                )
                
                if (hasCarouselClass) return true
                
                // Check for common carousel attributes
                const hasCarouselAttr = 
                    current.hasAttribute('data-carousel') ||
                    current.hasAttribute('data-swiper') ||
                    current.hasAttribute('data-no-sidebar-swipe') ||
                    (current.getAttribute('role') === 'region' && current.hasAttribute('aria-roledescription'))
                
                if (hasCarouselAttr) return true
                
                current = current.parentElement
            }
            
            return false
        }

        const handleTouchStart = (e: TouchEvent) => {
            touchStartX = e.changedTouches[0].screenX
            touchStartY = e.changedTouches[0].screenY
            targetElement = e.target
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
            
            // Check if the target is not in a horizontally scrollable container
            const isNotScrollable = !isHorizontallyScrollable(targetElement)
            
            // Check if the target is not a carousel or swipeable component
            const isNotCarousel = !isCarouselOrSwipeable(targetElement)

            if (isLeftToRightSwipe && isHorizontalSwipe && isNotScrollable && isNotCarousel && !isOpen) {
                onOpen()
            }
        }

        document.addEventListener('touchstart', handleTouchStart, { passive: true })
        document.addEventListener('touchend', handleTouchEnd, { passive: true })

        return () => {
            document.removeEventListener('touchstart', handleTouchStart)
            document.removeEventListener('touchend', handleTouchEnd)
        }
    }, [isEnabled, isOpen, onOpen, minSwipeDistance, maxVerticalDistance])
}
