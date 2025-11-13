'use client';

import { useRef, useState, useEffect, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CustomScrollAreaProps {
    children: ReactNode;
    className?: string;
}

export function CustomScrollArea({ children, className }: CustomScrollAreaProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const scrollbarRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    
    const [isScrollbarVisible, setIsScrollbarVisible] = useState(false);
    const [thumbHeight, setThumbHeight] = useState(0);
    const [thumbTop, setThumbTop] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [dragStartScrollTop, setDragStartScrollTop] = useState(0);

    const updateScrollbar = useCallback(() => {
        if (!containerRef.current || !contentRef.current) return;

        const container = containerRef.current;
        const content = contentRef.current;
        
        const containerHeight = container.clientHeight;
        const contentHeight = content.scrollHeight;
        const scrollTop = container.scrollTop;

        // Check if scrollbar is needed
        const needsScrollbar = contentHeight > containerHeight;
        setIsScrollbarVisible(needsScrollbar);

        if (needsScrollbar) {
            // Calculate thumb height (proportional to visible content)
            const thumbHeightCalc = Math.max(
                (containerHeight / contentHeight) * containerHeight,
                30 // Minimum thumb height
            );
            setThumbHeight(thumbHeightCalc);

            // Calculate thumb position
            const scrollPercentage = scrollTop / (contentHeight - containerHeight);
            const maxThumbTop = containerHeight - thumbHeightCalc;
            const thumbTopCalc = scrollPercentage * maxThumbTop;
            setThumbTop(thumbTopCalc);
        }
    }, []);

    useEffect(() => {
        updateScrollbar();
        
        const container = containerRef.current;
        if (!container) return;

        // Update scrollbar on scroll
        const handleScroll = () => {
            if (!isDragging) {
                updateScrollbar();
            }
        };

        container.addEventListener('scroll', handleScroll);
        
        // Update scrollbar on window resize
        const resizeObserver = new ResizeObserver(updateScrollbar);
        resizeObserver.observe(container);
        if (contentRef.current) {
            resizeObserver.observe(contentRef.current);
        }

        return () => {
            container.removeEventListener('scroll', handleScroll);
            resizeObserver.disconnect();
        };
    }, [updateScrollbar, isDragging]);

    const handleThumbMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        setIsDragging(true);
        setDragStartY(e.clientY);
        setDragStartScrollTop(containerRef.current?.scrollTop || 0);
        
        document.body.style.userSelect = 'none';
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current || !contentRef.current) return;

            const container = containerRef.current;
            const content = contentRef.current;
            
            const deltaY = e.clientY - dragStartY;
            const containerHeight = container.clientHeight;
            const contentHeight = content.scrollHeight;
            const maxThumbTop = containerHeight - thumbHeight;
            
            // Calculate scroll position based on thumb movement
            const scrollPercentage = deltaY / maxThumbTop;
            const maxScrollTop = contentHeight - containerHeight;
            const newScrollTop = dragStartScrollTop + (scrollPercentage * maxScrollTop);
            
            container.scrollTop = Math.max(0, Math.min(newScrollTop, maxScrollTop));
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStartY, dragStartScrollTop, thumbHeight]);

    const handleTrackClick = (e: React.MouseEvent) => {
        if (!containerRef.current || !contentRef.current || !scrollbarRef.current) return;
        
        // Don't scroll if clicking on thumb
        if (e.target === thumbRef.current) return;

        const scrollbar = scrollbarRef.current;
        const rect = scrollbar.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        
        const container = containerRef.current;
        const content = contentRef.current;
        const containerHeight = container.clientHeight;
        const contentHeight = content.scrollHeight;
        const maxScrollTop = contentHeight - containerHeight;
        
        // Calculate target scroll position
        const scrollPercentage = clickY / containerHeight;
        const targetScrollTop = scrollPercentage * maxScrollTop;
        
        container.scrollTop = targetScrollTop;
    };

    return (
        <div 
            className={cn('relative overflow-hidden', className)}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Content container with hidden native scrollbar */}
            <div
                ref={containerRef}
                className="h-full overflow-y-scroll overflow-x-hidden scrollbar-none"
                style={{ paddingRight: 0 }}
            >
                <div ref={contentRef}>
                    {children}
                </div>
            </div>

            {/* Custom Scrollbar */}
            {isScrollbarVisible && (
                <div
                    ref={scrollbarRef}
                    className={cn(
                        'absolute right-0 top-0 bottom-0 w-2 transition-opacity duration-200',
                        isHovering || isDragging ? 'opacity-100' : 'opacity-0'
                    )}
                    onClick={handleTrackClick}
                >
                    {/* Scrollbar thumb */}
                    <div
                        ref={thumbRef}
                        className={cn(
                            'absolute right-0 w-full rounded-full transition-all cursor-pointer',
                            isDragging 
                                ? 'bg-muted-foreground/50' 
                                : 'bg-muted-foreground/30 hover:bg-muted-foreground/40'
                        )}
                        style={{
                            height: `${thumbHeight}px`,
                            top: `${thumbTop}px`,
                        }}
                        onMouseDown={handleThumbMouseDown}
                    />
                </div>
            )}
        </div>
    );
}
