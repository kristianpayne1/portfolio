import Link from "next/link";

// Shown for any address that does not exist, and for posts that were
// deleted or are private. Plain, like the rest of the site.
export default function NotFound() {
    return (
        <>
            <p>404 Not Found. There&apos;s nothing here...</p>
            <p>
                <Link href="/">← All posts</Link>
            </p>
        </>
    );
}
