// The private upload server. Only reachable over Tailscale.
//
// POST /upload  (multipart/form-data)
//   file     optional  a video, photo or audio file
//   caption  optional  text
//   private  optional  "true" to hide the entry from the public feed
// At least one of file or caption is required.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import multipart from "@fastify/multipart";
import { config } from "./config.ts";
import { insertEntry } from "./db.ts";
import { enqueueJob } from "./jobs.ts";
import { detectMediaType } from "./media.ts";

export async function buildUploadServer() {
    const app = Fastify({ logger: true });

    await app.register(multipart, {
        limits: {
            fileSize: config.maxUploadBytes,
            files: 1,
            fields: 10,
        },
    });

    // Every request must carry the bearer token.
    app.addHook("onRequest", async (request, reply) => {
        if (!hasValidToken(request)) {
            return reply.code(401).send({ error: "Unauthorized" });
        }
    });

    app.post("/upload", handleUpload);

    return app;
}

async function handleUpload(request: FastifyRequest, reply: FastifyReply) {
    if (!request.isMultipart()) {
        return reply.code(400).send({ error: "Expected multipart/form-data" });
    }

    const id = newId();
    const createdAt = new Date().toISOString();
    const rawPath = path.join(config.paths.incoming, `${id}.upload`);

    let hasFile = false;
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
                // iOS Shortcuts can send an empty file field when there is
                // no input. Treat that as "no file".
                hasFile = fs.statSync(rawPath).size > 0;
                if (!hasFile) removeFile(rawPath);
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

    if (caption && caption.length > config.maxCaptionLength) {
        removeFile(rawPath);
        return reply.code(400).send({
            error: `Caption is longer than ${config.maxCaptionLength} characters`,
        });
    }

    // Text-only post: nothing to process, publish immediately.
    if (!hasFile) {
        if (!caption) {
            return reply
                .code(400)
                .send({ error: "Send a file, a caption, or both" });
        }
        insertEntry({
            id,
            created_at: createdAt,
            type: "text",
            media_path: null,
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

    await enqueueJob({
        id,
        created_at: createdAt,
        type: media.type,
        mime: media.mime,
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
function newId(): string {
    return crypto.randomBytes(9).toString("base64url");
}

function parseBoolean(value: string): boolean {
    return ["true", "1", "yes", "on"].includes(value.trim().toLowerCase());
}

function removeFile(filePath: string) {
    fs.rmSync(filePath, { force: true });
}
