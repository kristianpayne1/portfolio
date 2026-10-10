// The public, read-only server. The Cloudflare Tunnel points here.
// It has no upload route at all, so uploads cannot leak through the tunnel.
//
// GET /entries?limit=20          public entries, newest first
// GET /entries?before=<cursor>   the next (older) page, using nextCursor
// GET /media/<file>              processed media files
// GET /health                    for checking the service is up

import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { config } from "./config.ts";
import { listPublicEntries } from "./db.ts";

export async function buildPublicServer() {
    const app = Fastify({ logger: true });

    // Media file names are random and never change, so browsers and
    // Cloudflare can cache them for a year. Range requests (needed for
    // video playback on iOS Safari) are handled by @fastify/static.
    await app.register(fastifyStatic, {
        root: config.paths.publicMedia,
        prefix: "/media/",
        index: false,
        list: false,
        immutable: true,
        maxAge: "365d",
    });

    app.get<{ Querystring: { before?: string; limit?: string } }>(
        "/entries",
        async (request, reply) => {
            const before = request.query.before || null;
            const limit = clamp(Number(request.query.limit) || 20, 1, 50);

            const { entries, hasMore } = listPublicEntries(before, limit);

            // The feed page loads older posts straight from the browser
            // while scrolling, so allow any site to read this public data.
            reply.header("Access-Control-Allow-Origin", "*");
            reply.header("Cache-Control", "public, max-age=60");
            return {
                // Pass this back as ?before= to get the next page.
                // null means there is nothing older.
                nextCursor: hasMore
                    ? entries[entries.length - 1].created_at
                    : null,
                entries: entries.map((entry) => ({
                    id: entry.id,
                    created_at: entry.created_at,
                    type: entry.type,
                    title: entry.title,
                    caption: entry.caption,
                    media_url: entry.media_path
                        ? `${config.publicUrl}/media/${entry.media_path}`
                        : null,
                })),
            };
        }
    );

    app.get("/health", async () => ({ ok: true }));

    return app;
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(Math.floor(value), min), max);
}
