// Media embedded in a post's Markdown, added from the compose page.
//
// A post refers to its media with normal Markdown image syntax:
//   ![Optional caption](media/AbC123xyz_-9.webp)
// Videos (.mp4) and audio (.m4a) use the same syntax; the feed decides how
// to show each one from its file extension.
//
// Life of an embedded file:
//   1. Uploaded and processed into the drafts folder (never served).
//   2. When a post that mentions it is published, it moves to the public
//      folder (or the private one for a private post).
//   3. Deleting the post deletes the file. If it is never published, the
//      cleanup job deletes it (see cleanup.ts).

import fs from "node:fs/promises";
import path from "node:path";
import { config } from "./config.ts";
import {
    deleteMediaRow,
    findDraftMedia,
    listMediaForEntry,
    markMediaPublished,
    type MediaFolder,
} from "./db.ts";

// Matches "](media/<12 character id>.<ext>)" and captures the id.
const MEDIA_REFERENCE = /\]\(media\/([A-Za-z0-9_-]{12})\.(?:webp|mp4|m4a)\)/g;

export function folderPath(folder: MediaFolder): string {
    if (folder === "public") return config.paths.publicMedia;
    if (folder === "private") return config.paths.privateMedia;
    return config.paths.draftMedia;
}

// Moves every draft file the post mentions into the folder it belongs in,
// and links it to the post. Unknown or already published ids are skipped.
export async function publishEmbeddedMedia(
    markdown: string | null,
    entryId: string,
    isPrivate: boolean
): Promise<void> {
    if (!markdown) return;
    const target: MediaFolder = isPrivate ? "private" : "public";

    for (const match of markdown.matchAll(MEDIA_REFERENCE)) {
        const media = findDraftMedia(match[1]);
        if (!media) continue;

        await fs.rename(
            path.join(config.paths.draftMedia, media.file_name),
            path.join(folderPath(target), media.file_name)
        );
        markMediaPublished(media.id, entryId, target);
    }
}

// Deletes the files embedded in a post. Called when the post is deleted.
export async function deleteEmbeddedMedia(entryId: string): Promise<void> {
    for (const media of listMediaForEntry(entryId)) {
        await fs.rm(path.join(folderPath(media.folder), media.file_name), {
            force: true,
        });
        deleteMediaRow(media.id);
    }
}
