// Talking to the feed service on the home lab, served through the
// Cloudflare Tunnel. Set FEED_API_URL to use a different one (for example
// `npm run dev:local` points it at a local copy).
export const FEED_API_URL =
    process.env.FEED_API_URL ?? "https://media.kristianpayne.dev";

// Server-side fetch from the feed service. Responses are cached for
// `revalidateSeconds` in production and always fresh in development, so new
// posts show on refresh while you work. Returns null if the service cannot
// be reached, so the home lab being offline never breaks a page or a build.
export async function fetchFromFeed(
    path: string,
    revalidateSeconds: number
): Promise<Response | null> {
    try {
        return await fetch(`${FEED_API_URL}${path}`, {
            next: {
                revalidate:
                    process.env.NODE_ENV === "development"
                        ? 0
                        : revalidateSeconds,
            },
        });
    } catch {
        return null;
    }
}
