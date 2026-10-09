// Background processing for uploaded media.
//
// Transcoding a video can take a while, so /upload saves the raw file, queues
// a job and answers right away. The entry only appears in the feed once its
// file is ready.
//
// Each queued job is also written to disk as "incoming/<id>.json" next to the
// raw upload. If the service restarts mid-job, those files are picked up again
// on startup, so nothing is lost.

import fs from "node:fs/promises";
import path from "node:path";
import { config } from "./config.ts";
import { insertEntry, type EntryType } from "./db.ts";
import { outputExtension, processMedia } from "./media.ts";

export type Job = {
    id: string;
    created_at: string;
    type: Exclude<EntryType, "text">;
    mime: string;
    caption: string | null;
    private: boolean;
    raw_path: string; // the untouched upload inside the incoming folder
};

// Jobs run one at a time so the CPU is not swamped by parallel transcodes.
let queue: Promise<void> = Promise.resolve();

export async function enqueueJob(job: Job): Promise<void> {
    await fs.writeFile(jobFilePath(job.id), JSON.stringify(job, null, 4));
    addToQueue(job);
}

export async function resumeUnfinishedJobs(): Promise<void> {
    const files = await fs.readdir(config.paths.incoming);
    for (const file of files.filter((name) => name.endsWith(".json"))) {
        const job: Job = JSON.parse(
            await fs.readFile(path.join(config.paths.incoming, file), "utf8")
        );
        console.log(`Resuming unfinished job ${job.id}`);
        addToQueue(job);
    }
}

// Resolves once every queued job has finished. Used on shutdown.
export function waitForQueue(): Promise<void> {
    return queue;
}

function addToQueue(job: Job) {
    queue = queue.then(() => runJob(job));
}

async function runJob(job: Job): Promise<void> {
    const fileName = `${job.id}.${outputExtension[job.type]}`;
    const folder = job.private
        ? config.paths.privateMedia
        : config.paths.publicMedia;
    const outputPath = path.join(folder, fileName);
    const startedAt = Date.now();

    try {
        console.log(`Processing ${job.type} ${job.id}`);
        await processMedia(job.type, job.mime, job.raw_path, outputPath);

        insertEntry({
            id: job.id,
            created_at: job.created_at,
            type: job.type,
            media_path: fileName,
            caption: job.caption,
            private: job.private,
        });

        await fs.rm(job.raw_path, { force: true });
        await fs.rm(jobFilePath(job.id), { force: true });

        const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
        console.log(`Published ${job.type} ${job.id} in ${seconds}s`);
    } catch (error) {
        console.error(`Job ${job.id} failed:`, error);

        // Keep the raw upload and job file so it can be retried by hand:
        // move both back into "incoming" and restart the container.
        await fs.rm(outputPath, { force: true });
        await moveToFailed(job.raw_path);
        await moveToFailed(jobFilePath(job.id));
    }
}

function jobFilePath(id: string): string {
    return path.join(config.paths.incoming, `${id}.json`);
}

async function moveToFailed(filePath: string) {
    const target = path.join(config.paths.failed, path.basename(filePath));
    await fs.rename(filePath, target).catch(() => {});
}
