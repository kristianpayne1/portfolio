// Deletes files that will never be used, so the home lab's disk does not
// slowly fill up. Runs once at startup and then every hour.
//
// It removes:
//   - media added in the compose page but never published, after
//     UNUSED_MEDIA_HOURS (default 24), so drafts have a day to be finished
//   - stray files in the drafts folder with no database row (left by a
//     crash mid-processing), after the same time
//   - raw uploads left in "incoming" by a crash, after the same time
//   - uploads that failed to process, after FAILED_UPLOAD_DAYS (default 7),
//     which leaves time to retry them by hand

import fs from "node:fs/promises";
import path from "node:path";
import { config } from "./config.ts";
import { deleteMediaRow, isTrackedMedia, listUnusedMedia } from "./db.ts";
import { folderPath } from "./embedded-media.ts";

const HOUR = 60 * 60 * 1000;

export function scheduleCleanup(): void {
    runCleanup();
    // unref: this timer alone should not keep the process running.
    setInterval(runCleanup, HOUR).unref();
}

async function runCleanup(): Promise<void> {
    try {
        const unusedCutoff = Date.now() - config.unusedMediaHours * HOUR;
        const failedCutoff = Date.now() - config.failedUploadDays * 24 * HOUR;

        let removed = 0;
        let bytes = 0;
        const remove = async (filePath: string) => {
            const size = await fileSize(filePath);
            await fs.rm(filePath, { force: true });
            removed += 1;
            bytes += size;
        };

        // 1. Embedded media that was never published.
        const cutoffIso = new Date(unusedCutoff).toISOString();
        for (const media of listUnusedMedia(cutoffIso)) {
            await remove(path.join(folderPath(media.folder), media.file_name));
            deleteMediaRow(media.id);
        }

        // 2. Stray files in the drafts folder that no row knows about.
        for (const name of await fs.readdir(config.paths.draftMedia)) {
            const filePath = path.join(config.paths.draftMedia, name);
            if (
                !isTrackedMedia(name) &&
                (await modifiedAt(filePath)) < unusedCutoff
            ) {
                await remove(filePath);
            }
        }

        // 3. Raw uploads in "incoming" with no job file (a job file means
        //    it is still queued and will be resumed, so leave those alone).
        const incoming = await fs.readdir(config.paths.incoming);
        for (const name of incoming) {
            if (name.endsWith(".json")) continue;
            const id = name.split(".")[0];
            if (incoming.includes(`${id}.json`)) continue;
            const filePath = path.join(config.paths.incoming, name);
            if ((await modifiedAt(filePath)) < unusedCutoff) {
                await remove(filePath);
            }
        }

        // 4. Old failed uploads.
        for (const name of await fs.readdir(config.paths.failed)) {
            const filePath = path.join(config.paths.failed, name);
            if ((await modifiedAt(filePath)) < failedCutoff) {
                await remove(filePath);
            }
        }

        if (removed > 0) {
            const megabytes = (bytes / 1024 / 1024).toFixed(1);
            console.log(`Cleanup removed ${removed} files (${megabytes} MB)`);
        }
    } catch (error) {
        console.error("Cleanup failed:", error);
    }
}

async function fileSize(filePath: string): Promise<number> {
    const stats = await fs.stat(filePath).catch(() => null);
    return stats?.size ?? 0;
}

async function modifiedAt(filePath: string): Promise<number> {
    const stats = await fs.stat(filePath).catch(() => null);
    return stats?.mtimeMs ?? Date.now();
}
