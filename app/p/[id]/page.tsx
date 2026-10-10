import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EntryArticle, { type Entry } from "../../components/entry";
import { fetchFromFeed } from "../../feed-api";

// One post on its own page, at /p/<id>. The date of each post in the feed
// links here. Private posts have no page (the feed service returns 404).

// Built the first time it is visited, then rebuilt at most every 3 minutes.
export const revalidate = 180;

type Props = { params: Promise<{ id: string }> };

// Returns the post, null if there is no such (public) post, or "offline"
// if the feed service cannot be reached.
async function getEntry(id: string): Promise<Entry | null | "offline"> {
    const response = await fetchFromFeed(
        `/entries/${encodeURIComponent(id)}`,
        revalidate
    );
    if (!response) return "offline";
    if (response.status === 404) return null;
    if (!response.ok) return "offline";
    return response.json();
}

// The browser tab shows the post's title, or the start of its text.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const entry = await getEntry((await params).id);
    if (!entry || entry === "offline") return {};
    const text = entry.title ?? firstLine(entry.caption);
    return text ? { title: `${text} | Kristian Payne` } : {};
}

// First line of a Markdown body, without media lines or link syntax.
function firstLine(markdown: string | null): string {
    const line =
        markdown
            ?.split("\n")
            .map((part) => part.trim())
            .find((part) => part && !part.startsWith("![")) ?? "";
    const plain = line.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
    return plain.length > 60 ? `${plain.slice(0, 57)}...` : plain;
}

export default async function PostPage({ params }: Props) {
    const entry = await getEntry((await params).id);

    if (entry === "offline") {
        return <p>The feed is unavailable right now.</p>;
    }
    if (entry === null) notFound();

    return (
        <>
            <EntryArticle entry={entry} />
            <p>
                <Link href="/">← All posts</Link>
            </p>
        </>
    );
}
