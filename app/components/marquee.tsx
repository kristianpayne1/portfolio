"use client";

import { useEffect, useRef } from "react";

interface MarqueeProps {
    children: React.ReactNode;
    speed?: number;
    pauseOnHover?: boolean;
    className?: string;
}

export default function Marquee({
    children,
    speed = 30,
    pauseOnHover = true,
    className,
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
        </div>
    );
}
