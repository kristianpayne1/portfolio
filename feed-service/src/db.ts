// SQLite storage for feed entries, using Node's built-in node:sqlite module.

import { DatabaseSync } from "node:sqlite";
import { config } from "./config.ts";

export type EntryType = "video" | "image" | "audio" | "text";

export type Entry = {
    id: string;
    created_at: string; // ISO 8601, UTC
    type: EntryType;
    media_path: string | null; // file name inside the media folder
    title: string | null;
    caption: string | null; // the post body, written in Markdown
    private: boolean;
};

type EntryRow = Omit<Entry, "private"> & { private: number };

const db = new DatabaseSync(config.paths.database);

db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
        id         TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        type       TEXT NOT NULL,
        media_path TEXT,
        caption    TEXT,
        private    INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS entries_created_at ON entries (created_at);
`);

// Media embedded in a post's Markdown (added in the compose page). Each file
// starts as a draft and is linked to its post when the post is published.
// Unlinked drafts are deleted by the cleanup job.
db.exec(`
    CREATE TABLE IF NOT EXISTS media (
        id         TEXT PRIMARY KEY,
        file_name  TEXT NOT NULL,
        folder     TEXT NOT NULL,  -- "drafts", "public" or "private"
        entry_id   TEXT,           -- null until its post is published
        created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS media_entry_id ON media (entry_id);
`);

// Migration: "title" was added after the first release.
const columns = db.prepare("PRAGMA table_info(entries)").all() as {
    name: string;
}[];
if (!columns.some((column) => column.name === "title")) {
    db.exec("ALTER TABLE entries ADD COLUMN title TEXT");
}

const insertStatement = db.prepare(`
    INSERT INTO entries (id, created_at, type, media_path, title, caption, private)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`);

// Pages are fetched by "everything older than this created_at" rather than
// by page number, so a new post never shifts later pages (no duplicates or
// gaps while someone is scrolling). Only one person posts, so two entries
// never share the same millisecond.
const publicPageStatement = db.prepare(`
    SELECT * FROM entries
    WHERE private = 0 AND created_at < ?
    ORDER BY created_at DESC
    LIMIT ?
`);

const recentStatement = db.prepare(`
    SELECT * FROM entries
    ORDER BY created_at DESC, id DESC
    LIMIT ?
`);

const findStatement = db.prepare("SELECT * FROM entries WHERE id = ?");
const deleteStatement = db.prepare("DELETE FROM entries WHERE id = ?");

export function insertEntry(entry: Entry): void {
    insertStatement.run(
        entry.id,
        entry.created_at,
        entry.type,
        entry.media_path,
        entry.title,
        entry.caption,
        entry.private ? 1 : 0
    );
}

// Returns public entries older than `before` (or the newest ones when it is
// null), newest first. We ask for one extra row so we know whether there
// are more after this page.
export function listPublicEntries(
    before: string | null,
    pageSize: number
): { entries: Entry[]; hasMore: boolean } {
    // "9999" sorts after every real ISO date, so it means "from the newest".
    const rows = publicPageStatement.all(
        before ?? "9999",
        pageSize + 1
    ) as unknown as EntryRow[];

    const entries = rows.slice(0, pageSize).map(fromRow);
    return { entries, hasMore: rows.length > pageSize };
}

// Newest entries including private ones. Only for the compose page.
export function listRecentEntries(limit: number): Entry[] {
    const rows = recentStatement.all(limit) as unknown as EntryRow[];
    return rows.map(fromRow);
}

// One public entry, or null if it does not exist or is private.
export function findPublicEntry(id: string): Entry | null {
    const row = findStatement.get(id) as unknown as EntryRow | undefined;
    if (!row || row.private === 1) return null;
    return fromRow(row);
}

// Removes an entry and returns it, or null if it did not exist.
export function deleteEntry(id: string): Entry | null {
    const row = findStatement.get(id) as unknown as EntryRow | undefined;
    if (!row) return null;
    deleteStatement.run(id);
    return fromRow(row);
}

// ---- Embedded media ----

export type MediaFolder = "drafts" | "public" | "private";

export type Media = {
    id: string;
    file_name: string;
    folder: MediaFolder;
    entry_id: string | null;
    created_at: string;
};

const insertMediaStatement = db.prepare(`
    INSERT INTO media (id, file_name, folder, entry_id, created_at)
    VALUES (?, ?, 'drafts', NULL, ?)
`);
const findDraftMediaStatement = db.prepare(
    "SELECT * FROM media WHERE id = ? AND entry_id IS NULL"
);
const publishMediaStatement = db.prepare(
    "UPDATE media SET entry_id = ?, folder = ? WHERE id = ?"
);
const mediaForEntryStatement = db.prepare(
    "SELECT * FROM media WHERE entry_id = ?"
);
const deleteMediaStatement = db.prepare("DELETE FROM media WHERE id = ?");

// Unused media: never published, or its post never made it into the feed
// (for example the post's own upload failed to process).
const unusedMediaStatement = db.prepare(`
    SELECT * FROM media
    WHERE created_at < ?
      AND (entry_id IS NULL OR entry_id NOT IN (SELECT id FROM entries))
`);

export function insertDraftMedia(id: string, fileName: string): void {
    insertMediaStatement.run(id, fileName, new Date().toISOString());
}

export function findDraftMedia(id: string): Media | null {
    const row = findDraftMediaStatement.get(id) as unknown as Media | undefined;
    return row ?? null;
}

export function markMediaPublished(
    id: string,
    entryId: string,
    folder: MediaFolder
): void {
    publishMediaStatement.run(entryId, folder, id);
}

export function listMediaForEntry(entryId: string): Media[] {
    return mediaForEntryStatement.all(entryId) as unknown as Media[];
}

export function listUnusedMedia(createdBefore: string): Media[] {
    return unusedMediaStatement.all(createdBefore) as unknown as Media[];
}

const trackedFileStatement = db.prepare(
    "SELECT 1 FROM media WHERE file_name = ?"
);

// Whether a file in the media folders belongs to a row in the media table.
export function isTrackedMedia(fileName: string): boolean {
    return trackedFileStatement.get(fileName) !== undefined;
}

export function deleteMediaRow(id: string): void {
    deleteMediaStatement.run(id);
}

function fromRow(row: EntryRow): Entry {
    return { ...row, private: row.private === 1 };
}
