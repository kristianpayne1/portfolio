import PostBody from "./post-body";

// One post in the feed. Used for the first page (rendered on the server)
// and for older pages loaded while scrolling (rendered in the browser).

export type Entry = {
    id: string;
    created_at: string;
    type: "video" | "image" | "audio" | "text";
    title: string | null;
    caption: string | null; // Markdown
    media_url: string | null;
};

// The shape of GET /entries from the feed service.
export type EntriesResponse = {
    entries: Entry[];
    nextCursor: string | null; // pass as ?before= to get older posts
};

// Dates are formatted with a fixed time zone so they read the same
// wherever they are rendered.
const TIME_ZONE = "Europe/London";

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
            <img src={entry.media_url} alt={entry.title ?? ""} loading="lazy" />
        );
    }
    if (entry.type === "audio") {
        return <audio src={entry.media_url} controls preload="metadata" />;
    }
    return null;
}

export default function EntryArticle({ entry }: { entry: Entry }) {
    return (
        <article>
            <time dateTime={entry.created_at}>
                {formatDate(entry.created_at)}
            </time>
            {entry.title && <h2>{entry.title}</h2>}
            <EntryMedia entry={entry} />
            {entry.caption && <PostBody markdown={entry.caption} />}
        </article>
    );
}
