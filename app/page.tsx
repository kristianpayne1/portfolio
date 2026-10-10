import EntryArticle, { type EntriesResponse } from "./components/entry";
import LoadMore from "./components/load-more";
import { FEED_API_URL, fetchFromFeed } from "./feed-api";

// The feed: plain HTML styled by feed-service/src/theme.css. The server
// renders the newest posts; LoadMore adds older ones while scrolling.

const FIRST_PAGE_SIZE = 20;

// Rebuild the page in the background at most every 3 minutes.
export const revalidate = 180;

export default async function Home() {
    const response = await fetchFromFeed(
        `/entries?limit=${FIRST_PAGE_SIZE}`,
        revalidate
    );
    if (!response?.ok) {
        return <p>The feed is unavailable right now.</p>;
    }
    const firstPage: EntriesResponse = await response.json();

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
