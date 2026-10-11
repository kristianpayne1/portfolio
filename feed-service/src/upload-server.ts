// The private upload server. Only reachable over Tailscale.
//
// GET    /                  the compose page (plain HTML, see compose.html)
// GET    /theme.css         the stylesheet shared with the feed
// POST   /upload            create a post (multipart/form-data):
//   file     optional  a video, photo or audio file
//   title    optional  short heading for longer posts
//   caption  optional  the post body, in Markdown
//   private  optional  "true" to hide the entry from the public feed
//   At least one of file, title or caption is required.
// POST   /api/media         add a file to embed in a post's Markdown
//                           (multipart "file"). Waits until it is processed,
//                           then returns the Markdown to insert.
// GET    /api/entries       recent posts, including private ones
// PATCH  /api/entries/:id   edit a post's title, text or privacy (JSON body)
// DELETE /api/entries/:id   delete a post and all of its media
//
// Everything except the compose page needs the bearer token.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import multipart from "@fastify/multipart";
import { config } from "./config.ts";
import {
    deleteEntry,
    findEntry,
    insertDraftMedia,
    insertEntry,
    listRecentEntries,
    updateEntry,
} from "./db.ts";
import {
    deleteEmbeddedMedia,
    publishEmbeddedMedia,
    syncEmbeddedMedia,
} from "./embedded-media.ts";
import { enqueueJob, runInQueue } from "./jobs.ts";
import { detectMediaType, outputExtension, processMedia } from "./media.ts";

// "__SITE_URL__" in the page is replaced with the feed website's address.
const composePage = fs
    .readFileSync(new URL("./compose.html", import.meta.url), "utf8")
    .replaceAll("__SITE_URL__", config.siteUrl);
const theme = fs.readFileSync(new URL("./theme.css", import.meta.url), "utf8");

export async function buildUploadServer() {
    const app = Fastify({ logger: true });

    await app.register(multipart, {
        limits: {
            fileSize: config.maxUploadBytes,
            files: 1,
            fields: 10,
        },
    });

    // The page itself holds no data, so it loads without the token.
    // It asks for the token and sends it with every request it makes.
    app.get("/", async (_request, reply) => {
        return reply.type("text/html").send(composePage);
    });
    app.get("/theme.css", async (_request, reply) => {
        return reply.type("text/css").send(theme);
    });

    app.post("/upload", { onRequest: requireToken }, handleUpload);

    app.post("/api/media", { onRequest: requireToken }, handleMediaUpload);

    app.get("/api/entries", { onRequest: requireToken }, async () => {
        return { entries: listRecentEntries(50) };
    });

    app.patch<{
        Params: { id: string };
        Body: { title?: string; caption?: string; private?: boolean };
    }>(
        "/api/entries/:id",
        { onRequest: requireToken },
        async (request, reply) => {
            const entry = findEntry(request.params.id);
            if (!entry) {
                return reply.code(404).send({ error: "No such post" });
            }

            const title = request.body?.title?.trim() || null;
            const caption = request.body?.caption?.trim() || null;
            const isPrivate = request.body?.private === true;

            if (title && title.length > config.maxTitleLength) {
                return reply.code(400).send({
                    error: `Title is longer than ${config.maxTitleLength} characters`,
                });
            }
            if (caption && caption.length > config.maxCaptionLength) {
                return reply.code(400).send({
                    error: `Post is longer than ${config.maxCaptionLength} characters`,
                });
            }
            // A text post with nothing left in it would be an empty post.
            if (entry.type === "text" && !title && !caption) {
                return reply
                    .code(400)
                    .send({ error: "A text post needs a title or some text" });
            }

            // A post's attached file (from the Shortcut) moves too if it
            // switched between public and private.
            if (entry.media_path && entry.private !== isPrivate) {
                const from = entry.private
                    ? config.paths.privateMedia
                    : config.paths.publicMedia;
                const to = isPrivate
                    ? config.paths.privateMedia
                    : config.paths.publicMedia;
                fs.renameSync(
                    path.join(from, entry.media_path),
                    path.join(to, entry.media_path)
                );
            }

            updateEntry(entry.id, { title, caption, private: isPrivate });
            await syncEmbeddedMedia(caption, entry.id, isPrivate);
            return { id: entry.id, message: "Saved" };
        }
    );

    app.delete<{ Params: { id: string } }>(
        "/api/entries/:id",
        { onRequest: requireToken },
        async (request, reply) => {
            const entry = deleteEntry(request.params.id);
            if (!entry) {
                return reply.code(404).send({ error: "No such post" });
            }
            if (entry.media_path) {
                const folder = entry.private
                    ? config.paths.privateMedia
                    : config.paths.publicMedia;
                removeFile(path.join(folder, entry.media_path));
            }
            await deleteEmbeddedMedia(entry.id);
            return { deleted: entry.id };
        }
    );

    return app;
}

async function requireToken(request: FastifyRequest, reply: FastifyReply) {
    if (!hasValidToken(request)) {
        return reply.code(401).send({ error: "Unauthorized" });
    }
}

async function handleUpload(request: FastifyRequest, reply: FastifyReply) {
    if (!request.isMultipart()) {
        return reply.code(400).send({ error: "Expected multipart/form-data" });
    }

    const id = newId();
    const createdAt = new Date().toISOString();
    const rawPath = path.join(config.paths.incoming, `${id}.upload`);

    let hasFile = false;
    let title: string | null = null;
    let caption: string | null = null;
    let isPrivate = false;

    try {
        for await (const part of request.parts()) {
            if (part.type === "file") {
                if (part.fieldname !== "file") {
                    part.file.resume(); // ignore unexpected files
                    continue;
                }
                // Throws a 413 error if the file goes over maxUploadBytes.
                await pipeline(part.file, fs.createWriteStream(rawPath));
                // iOS Shortcuts and browsers can send an empty file field
                // when nothing was picked. Treat that as "no file".
                hasFile = fs.statSync(rawPath).size > 0;
                if (!hasFile) removeFile(rawPath);
            } else if (part.fieldname === "title") {
                title = String(part.value).trim() || null;
            } else if (part.fieldname === "caption") {
                caption = String(part.value).trim() || null;
            } else if (part.fieldname === "private") {
                isPrivate = parseBoolean(String(part.value));
            }
        }
    } catch (error) {
        removeFile(rawPath);
        throw error;
    }

    if (title && title.length > config.maxTitleLength) {
        removeFile(rawPath);
        return reply.code(400).send({
            error: `Title is longer than ${config.maxTitleLength} characters`,
        });
    }
    if (caption && caption.length > config.maxCaptionLength) {
        removeFile(rawPath);
        return reply.code(400).send({
            error: `Post is longer than ${config.maxCaptionLength} characters`,
        });
    }

    // Text-only post: nothing to process, publish immediately.
    if (!hasFile) {
        if (!title && !caption) {
            return reply
                .code(400)
                .send({ error: "Send a file, some text, or both" });
        }
        await publishEmbeddedMedia(caption, id, isPrivate);
        insertEntry({
            id,
            created_at: createdAt,
            type: "text",
            media_path: null,
            title,
            caption,
            private: isPrivate,
        });
        return reply.code(201).send({
            id,
            type: "text",
            status: "published",
            message: "Posted",
        });
    }

    const media = await detectMediaType(rawPath);
    if (!media) {
        removeFile(rawPath);
        return reply.code(415).send({ error: "Unsupported file type" });
    }

    await publishEmbeddedMedia(caption, id, isPrivate);
    await enqueueJob({
        id,
        created_at: createdAt,
        type: media.type,
        mime: media.mime,
        title,
        caption,
        private: isPrivate,
        raw_path: rawPath,
    });

    return reply.code(202).send({
        id,
        type: media.type,
        status: "processing",
        message: `Uploaded. Your ${media.type} will appear once processed.`,
    });
}

// Media for embedding in Markdown. Processed straight away (in the shared
// queue) into the drafts folder, so the compose page knows it is ready.
async function handleMediaUpload(request: FastifyRequest, reply: FastifyReply) {
    const file = await request.file();
    if (!file || file.fieldname !== "file") {
        return reply.code(400).send({ error: 'Send one file as "file"' });
    }

    const id = newId();
    const rawPath = path.join(config.paths.incoming, `${id}.upload`);

    try {
        await pipeline(file.file, fs.createWriteStream(rawPath));

        const media = await detectMediaType(rawPath);
        if (!media) {
            return reply.code(415).send({ error: "Unsupported file type" });
        }

        const fileName = `${id}.${outputExtension[media.type]}`;
        const outputPath = path.join(config.paths.draftMedia, fileName);
        try {
            await runInQueue(() =>
                processMedia(media.type, media.mime, rawPath, outputPath)
            );
        } catch (error) {
            removeFile(outputPath); // do not leave a half-written file
            throw error;
        }
        insertDraftMedia(id, fileName);

        return {
            id,
            type: media.type,
            // The original file name is the default caption.
            markdown: `![${captionFromFileName(file.filename)}](media/${fileName})`,
            // The bare reference, for when the page supplies its own caption.
            src: `media/${fileName}`,
        };
    } finally {
        removeFile(rawPath);
    }
}

function hasValidToken(request: FastifyRequest): boolean {
    const header = request.headers.authorization ?? "";
    const expected = Buffer.from(`Bearer ${config.uploadToken}`);
    const received = Buffer.from(header);
    // timingSafeEqual needs equal lengths and avoids leaking the token
    // through response timing.
    return (
        received.length === expected.length &&
        crypto.timingSafeEqual(received, expected)
    );
}

// 12 random URL-safe characters. Also used as the media file name, so it
// must not be guessable.
// "IMG_1234.HEIC" becomes "IMG_1234". Square brackets and backslashes are
// escaped so the name cannot break the Markdown around it.
function captionFromFileName(fileName: string | undefined): string {
    const name = (fileName ?? "").replace(/\.[^.]+$/, "").trim();
    return name.replace(/[\\[\]]/g, (character) => `\\${character}`);
}

function newId(): string {
    return crypto.randomBytes(9).toString("base64url");
}

function parseBoolean(value: string): boolean {
    return ["true", "1", "yes", "on"].includes(value.trim().toLowerCase());
}

function removeFile(filePath: string) {
    fs.rmSync(filePath, { force: true });
}
