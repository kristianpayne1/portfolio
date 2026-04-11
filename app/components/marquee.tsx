"use client";

import { useCallback, useEffect, useRef } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface MarqueeProps {
    children: React.ReactNode;
    speed?: number;
    pauseOnHover?: boolean;
    className?: string;
    showArrows?: boolean;
    scrollAmount?: number;
}

export default function Marquee({
    children,
    speed = 30,
    pauseOnHover = true,
    className,
    showArrows = false,
    scrollAmount = 270,
}: MarqueeProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const posRef = useRef(0);
    const pausedRef = useRef(false);
    const isDraggingRef = useRef(false);
    const dragStartXRef = useRef(0);
    const dragStartPosRef = useRef(0);

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        let rafId: number;

        function wrap() {
            const halfWidth = track!.scrollWidth / 2;
            if (posRef.current <= -halfWidth) posRef.current += halfWidth;
            if (posRef.current > 0) posRef.current -= halfWidth;
        }

        function animate() {
            if (track) {
                if (!pausedRef.current && !isDraggingRef.current) {
                    posRef.current -= speed / 60;
                    wrap();
                }
                track.style.transform = `translateX(${posRef.current}px)`;
            }
            rafId = requestAnimationFrame(animate);
        }

        rafId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafId);
    }, [speed]);

    function handleWheel(e: React.WheelEvent) {
        e.preventDefault();
        const track = trackRef.current;
        if (!track) return;
        const halfWidth = track.scrollWidth / 2;
        posRef.current -= e.deltaX + e.deltaY;
        if (posRef.current <= -halfWidth) posRef.current += halfWidth;
        if (posRef.current > 0) posRef.current -= halfWidth;
    }

    function handleMouseDown(e: React.MouseEvent) {
        isDraggingRef.current = true;
        dragStartXRef.current = e.clientX;
        dragStartPosRef.current = posRef.current;
    }

    function handleMouseMove(e: React.MouseEvent) {
        if (!isDraggingRef.current) return;
        const track = trackRef.current;
        if (!track) return;
        const halfWidth = track.scrollWidth / 2;
        const delta = e.clientX - dragStartXRef.current;
        posRef.current = dragStartPosRef.current + delta;
        if (posRef.current <= -halfWidth) posRef.current += halfWidth;
        if (posRef.current > 0) posRef.current -= halfWidth;
    }

    function handleDragEnd() {
        isDraggingRef.current = false;
    }

    function handleTouchStart(e: React.TouchEvent) {
        isDraggingRef.current = true;
        dragStartXRef.current = e.touches[0].clientX;
        dragStartPosRef.current = posRef.current;
    }

    function handleTouchMove(e: React.TouchEvent) {
        if (!isDraggingRef.current) return;
        const track = trackRef.current;
        if (!track) return;
        const halfWidth = track.scrollWidth / 2;
        const delta = e.touches[0].clientX - dragStartXRef.current;
        posRef.current = dragStartPosRef.current + delta;
        if (posRef.current <= -halfWidth) posRef.current += halfWidth;
        if (posRef.current > 0) posRef.current -= halfWidth;
    }

    const animatingRef = useRef(false);

    const scrollBy = useCallback(
        (direction: "left" | "right") => {
            const track = trackRef.current;
            if (!track || animatingRef.current) return;

            animatingRef.current = true;
            const totalDelta =
                direction === "left" ? scrollAmount : -scrollAmount;
            const duration = 400;
            const start = performance.now();
            const startPos = posRef.current;
            const halfWidth = track.scrollWidth / 2;

            function step(now: number) {
                const elapsed = now - start;
                const t = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - t, 3);
                posRef.current = startPos + totalDelta * eased;
                if (posRef.current <= -halfWidth) posRef.current += halfWidth;
                if (posRef.current > 0) posRef.current -= halfWidth;
                if (t < 1) {
                    requestAnimationFrame(step);
                } else {
                    animatingRef.current = false;
                }
            }

            requestAnimationFrame(step);
        },
        [scrollAmount]
    );

    return (
        <div
            className={`relative overflow-hidden cursor-grab active:cursor-grabbing ${className ?? ""}`}
            onMouseEnter={() => {
                if (pauseOnHover) pausedRef.current = true;
            }}
            onMouseLeave={() => {
                pausedRef.current = false;
                handleDragEnd();
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleDragEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleDragEnd}
        >
            <div ref={trackRef} className="flex w-max">
                {children}
                {children}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-linear-to-r from-black to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-linear-to-l from-black to-transparent" />
            {showArrows && (
                <>
                    <button
                        type="button"
                        onClick={() => scrollBy("left")}
                        aria-label="Scroll projects left"
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                    >
                        <FiChevronLeft size={20} />
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollBy("right")}
                        aria-label="Scroll projects right"
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                    >
                        <FiChevronRight size={20} />
                    </button>
                </>
            )}
        </div>
    );
}
