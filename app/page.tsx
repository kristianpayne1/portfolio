import EntryArticle, { type EntriesResponse } from "./components/entry";
import LoadMore from "./components/load-more";

// The feed: plain HTML styled by feed-service/src/theme.css. Entries come
// from the feed service on the home lab, served through the Cloudflare Tunnel.
// The server renders the newest posts; LoadMore adds older ones while
// scrolling.
const FEED_API_URL =
    process.env.FEED_API_URL ?? "https://media.kristianpayne.dev";

const FIRST_PAGE_SIZE = 20;

// Rebuild the page in the background at most every 3 minutes.
export const revalidate = 180;

async function getFirstPage(): Promise<EntriesResponse | null> {
    try {
        const response = await fetch(
            `${FEED_API_URL}/entries?limit=${FIRST_PAGE_SIZE}`,
            {
                // Always fresh in development so new posts show on refresh.
                next: {
                    revalidate:
                        process.env.NODE_ENV === "development" ? 0 : revalidate,
                },
            }
        );
        if (!response.ok) return null;
        return await response.json();
    } catch {
        // The home lab being offline should not break the build or the site.
        return null;
    }
}

export default async function Home() {
    const firstPage = await getFirstPage();

    if (firstPage === null) {
        return <p>The feed is unavailable right now.</p>;
    }
    if (firstPage.entries.length === 0) {
        return <p>Nothing posted yet.</p>;
    }

    return (
        <>
            {firstPage.entries.map((entry) => (
                <EntryArticle key={entry.id} entry={entry} />
            ))}
            <LoadMore
                apiUrl={FEED_API_URL}
                // Older versions of the feed service do not send nextCursor.
                firstCursor={firstPage.nextCursor ?? null}
            />
        </>
    );
}
