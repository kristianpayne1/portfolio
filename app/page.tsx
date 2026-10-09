import { Flex, Text } from "@radix-ui/themes";

// Phase 1 feed: deliberately plain. Entries come from the feed service on
// the home lab, served publicly through the Cloudflare Tunnel.
const FEED_API_URL =
    process.env.FEED_API_URL ?? "https://media.kristianpayne.dev";

// Dates render on the server, so pick the time zone explicitly.
const TIME_ZONE = "Europe/London";

// Rebuild the page in the background at most every 3 minutes.
export const revalidate = 180;

type Entry = {
    id: string;
    created_at: string;
    type: "video" | "image" | "audio" | "text";
    caption: string | null;
    media_url: string | null;
};

async function getEntries(): Promise<Entry[] | null> {
    try {
        const response = await fetch(`${FEED_API_URL}/entries?limit=50`, {
            next: { revalidate },
        });
        if (!response.ok) return null;
        const data: { entries: Entry[] } = await response.json();
        return data.entries;
    } catch {
        // The home lab being offline should not break the build or the site.
        return null;
    }
}

function formatDate(isoDate: string) {
    return new Date(isoDate).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: TIME_ZONE,
    });
}

function EntryMedia({ entry }: { entry: Entry }) {
    if (!entry.media_url) return null;

    if (entry.type === "video") {
        return (
            <video
                src={entry.media_url}
                muted
                loop
                playsInline
                controls
                preload="metadata"
            />
        );
    }
    if (entry.type === "image") {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={entry.media_url} alt={entry.caption ?? ""} />
        );
    }
    if (entry.type === "audio") {
        return <audio src={entry.media_url} controls preload="metadata" />;
    }
    return null;
}

export default async function Home() {
    const entries = await getEntries();

    if (entries === null) {
        return <Text>The feed is unavailable right now.</Text>;
    }
    if (entries.length === 0) {
        return <Text>Nothing posted yet.</Text>;
    }

    return (
        <Flex direction="column" gap="6" className="max-w-xl">
            {entries.map((entry) => (
                <article key={entry.id}>
                    <Flex direction="column" gap="2">
                        <EntryMedia entry={entry} />
                        {entry.caption && (
                            <Text className="whitespace-pre-wrap">
                                {entry.caption}
                            </Text>
                        )}
                        <Text size="1" color="gray">
                            <time dateTime={entry.created_at}>
                                {formatDate(entry.created_at)}
                            </time>
                        </Text>
                    </Flex>
                </article>
            ))}
        </Flex>
    );
}
