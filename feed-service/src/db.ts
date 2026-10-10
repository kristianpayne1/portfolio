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

const publicPageStatement = db.prepare(`
    SELECT * FROM entries
    WHERE private = 0
    ORDER BY created_at DESC, id DESC
    LIMIT ? OFFSET ?
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

// Returns one page of public entries, newest first.
// We ask for one extra row so we know whether another page exists.
export function listPublicEntries(
    page: number,
    pageSize: number
): { entries: Entry[]; hasMore: boolean } {
    const offset = (page - 1) * pageSize;
    const rows = publicPageStatement.all(
        pageSize + 1,
        offset
    ) as unknown as EntryRow[];

    const entries = rows.slice(0, pageSize).map(fromRow);
    return { entries, hasMore: rows.length > pageSize };
}

// Newest entries including private ones. Only for the compose page.
export function listRecentEntries(limit: number): Entry[] {
    const rows = recentStatement.all(limit) as unknown as EntryRow[];
    return rows.map(fromRow);
}

// Removes an entry and returns it, or null if it did not exist.
export function deleteEntry(id: string): Entry | null {
    const row = findStatement.get(id) as unknown as EntryRow | undefined;
    if (!row) return null;
    deleteStatement.run(id);
    return fromRow(row);
}

function fromRow(row: EntryRow): Entry {
    return { ...row, private: row.private === 1 };
}
