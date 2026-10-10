"use client";

// Endless scrolling: loads older posts in the browser as you scroll.
//
// It is "optimistic": the next page starts loading while the bottom of the
// feed is still about two screens away, so in normal use you never see a
// loading message. Each page asks for posts older than the last one shown,
// so new posts never cause duplicates or gaps.

import { useCallback, useEffect, useRef, useState } from "react";
import EntryArticle, { type EntriesResponse, type Entry } from "./entry";

const PAGE_SIZE = 20;

// How far below the screen to start loading the next page.
const PRELOAD_DISTANCE = "2000px";

type Status = "idle" | "loading" | "error";

export default function LoadMore({
    apiUrl,
    firstCursor,
}: {
    apiUrl: string;
    firstCursor: string | null; // from the page the server rendered
}) {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [cursor, setCursor] = useState(firstCursor);
    const [status, setStatus] = useState<Status>("idle");

    const sentinelRef = useRef<HTMLDivElement>(null);
    // A ref (not state) so two triggers in the same moment cannot both
    // start loading the same page.
    const loadingRef = useRef(false);

    const loadNextPage = useCallback(async () => {
        if (!cursor || loadingRef.current) return;
        loadingRef.current = true;
        setStatus("loading");
        try {
            const url = `${apiUrl}/entries?limit=${PAGE_SIZE}&before=${encodeURIComponent(cursor)}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data: EntriesResponse = await response.json();

            setEntries((current) => [...current, ...data.entries]);
            setCursor(data.nextCursor);
            setStatus("idle");
        } catch {
            setStatus("error");
        } finally {
            loadingRef.current = false;
        }
    }, [apiUrl, cursor]);

    // Watch an invisible marker at the bottom of the feed. This re-runs after
    // every page (loadNextPage changes with the cursor), and a new observer
    // always reports straight away, so if short posts leave the marker still
    // near the screen, the next page loads too.
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) loadNextPage();
            },
            { rootMargin: `0px 0px ${PRELOAD_DISTANCE} 0px` }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [loadNextPage]);

    return (
        <>
            {entries.map((entry) => (
                <EntryArticle key={entry.id} entry={entry} />
            ))}

            <div ref={sentinelRef} />

            {status === "error" && (
                <p className="muted">
                    Could not load older posts.{" "}
                    <button onClick={loadNextPage}>Try again</button>
                </p>
            )}
        </>
    );
}
