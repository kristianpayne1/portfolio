// SQLite storage for feed entries, using Node's built-in node:sqlite module.

import { DatabaseSync } from "node:sqlite";
import { config } from "./config.ts";

export type EntryType = "video" | "image" | "audio" | "text";

export type Entry = {
    id: string;
    created_at: string; // ISO 8601, UTC
    type: EntryType;
    media_path: string | null; // file name inside the media folder
    caption: string | null;
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

const insertStatement = db.prepare(`
    INSERT INTO entries (id, created_at, type, media_path, caption, private)
    VALUES (?, ?, ?, ?, ?, ?)
`);

const publicPageStatement = db.prepare(`
    SELECT * FROM entries
    WHERE private = 0
    ORDER BY created_at DESC, id DESC
    LIMIT ? OFFSET ?
`);

export function insertEntry(entry: Entry): void {
    insertStatement.run(
        entry.id,
        entry.created_at,
        entry.type,
        entry.media_path,
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

    const entries = rows.slice(0, pageSize).map((row) => ({
        ...row,
        private: row.private === 1,
    }));

    return { entries, hasMore: rows.length > pageSize };
}
