// All settings come from environment variables so the same image runs
// anywhere. Defaults are chosen for running inside docker-compose.

import fs from "node:fs";
import path from "node:path";

function required(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable ${name}`);
    }
    return value;
}

// Resolved to an absolute path so "./data-local" works too
// (@fastify/static refuses relative paths).
const dataDir = path.resolve(process.env.DATA_DIR ?? "/data");

export const config = {
    // Secret the iOS Shortcut sends as "Authorization: Bearer <token>".
    uploadToken: required("UPLOAD_TOKEN"),

    // The upload server only listens here. Keep it on a private address and
    // reach it over Tailscale. It must never be routed through the tunnel.
    uploadHost: process.env.UPLOAD_HOST ?? "0.0.0.0",
    uploadPort: Number(process.env.UPLOAD_PORT ?? 8081),

    // The public server only has read routes (/entries and /media).
    // This is the one the Cloudflare Tunnel points at.
    publicHost: process.env.PUBLIC_HOST ?? "0.0.0.0",
    publicPort: Number(process.env.PUBLIC_PORT ?? 8080),

    // The commit the running image was built from ("dev" for local builds).
    version: process.env.GIT_SHA ?? "dev",

    // Used to build absolute media URLs in /entries responses.
    publicUrl: (
        process.env.PUBLIC_URL ?? "https://media.kristianpayne.dev"
    ).replace(/\/$/, ""),

    // The feed website. The compose page links to it and to each post's page.
    siteUrl: (process.env.SITE_URL ?? "https://kristianpayne.dev").replace(
        /\/$/,
        ""
    ),

    maxUploadBytes: Number(process.env.MAX_UPLOAD_MB ?? 1024) * 1024 * 1024,
    maxTitleLength: 200,
    maxCaptionLength: 20_000, // room for longer Markdown posts

    // "software" (libx264) for now. "vaapi" is reserved for Intel
    // hardware encoding later, see videoEncoderArgs() in media.ts.
    videoEncoder: process.env.VIDEO_ENCODER ?? "software",

    // Cleanup (see cleanup.ts), to keep the home lab's disk from filling up.
    // Media added in the compose page but never published is deleted after:
    unusedMediaHours: Number(process.env.UNUSED_MEDIA_HOURS ?? 24),
    // Uploads that failed to process are kept for a manual retry, then deleted:
    failedUploadDays: Number(process.env.FAILED_UPLOAD_DAYS ?? 7),

    paths: {
        database: path.join(dataDir, "feed.db"),
        // Raw uploads wait here until they are processed.
        incoming: path.join(dataDir, "incoming"),
        // Uploads that failed to process are moved here for inspection.
        failed: path.join(dataDir, "failed"),
        // Served at /media/*.
        publicMedia: path.join(dataDir, "media", "public"),
        // Never served. Private entries keep their files here.
        privateMedia: path.join(dataDir, "media", "private"),
        // Never served. Media added in the compose page waits here until
        // its post is published (then it moves to public or private).
        draftMedia: path.join(dataDir, "media", "drafts"),
    },
};

// Make sure every folder exists before anything else touches the disk.
for (const folder of [
    dataDir,
    config.paths.incoming,
    config.paths.failed,
    config.paths.publicMedia,
    config.paths.privateMedia,
    config.paths.draftMedia,
]) {
    fs.mkdirSync(folder, { recursive: true });
}
