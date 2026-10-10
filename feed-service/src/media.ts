// Turns raw iPhone uploads into web-friendly files.
//
//   video -> 720p H.264 MP4 (ffmpeg)
//   image -> WebP, EXIF and GPS stripped (heif-dec for HEIC, then sharp).
//            Animated GIFs (and animated WebP) stay animated.
//   audio -> AAC in an M4A container (ffmpeg)
//
// Every path strips metadata, because iPhone files carry GPS location.

import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import { promisify } from "node:util";
import sharp from "sharp";
import { fileTypeFromFile } from "file-type";
import { config } from "./config.ts";
import type { EntryType } from "./db.ts";

const execFileAsync = promisify(execFile);

// The only file types we accept, detected from the file's actual bytes
// (not from the name or the Content-Type the client claims).
const allowedMimeTypes: Record<string, Exclude<EntryType, "text">> = {
    "video/quicktime": "video", // iPhone .MOV
    "video/mp4": "video",
    "video/x-m4v": "video",
    "image/jpeg": "image",
    "image/png": "image",
    "image/webp": "image",
    "image/gif": "image",
    "image/heic": "image", // iPhone photos
    "image/heif": "image",
    "audio/x-m4a": "audio", // Voice Memos
    "audio/mp4": "audio",
    "audio/aac": "audio",
    "audio/mpeg": "audio",
    "audio/wav": "audio",
    "audio/x-wav": "audio",
};

// File extension of the processed output for each type.
export const outputExtension: Record<Exclude<EntryType, "text">, string> = {
    video: "mp4",
    image: "webp",
    audio: "m4a",
};

export async function detectMediaType(
    filePath: string
): Promise<{ mime: string; type: Exclude<EntryType, "text"> } | null> {
    const detected = await fileTypeFromFile(filePath);
    if (!detected) return null;

    const type = allowedMimeTypes[detected.mime];
    if (!type) return null;

    return { mime: detected.mime, type };
}

export async function processMedia(
    type: Exclude<EntryType, "text">,
    mime: string,
    inputPath: string,
    outputPath: string
): Promise<void> {
    if (type === "video") return processVideo(inputPath, outputPath);
    if (type === "image") return processImage(mime, inputPath, outputPath);
    return processAudio(inputPath, outputPath);
}

// ---------------------------------------------------------------------------
// Video
// ---------------------------------------------------------------------------

async function processVideo(inputPath: string, outputPath: string) {
    const isHdr = await isHdrVideo(inputPath);
    const encoder = videoEncoderArgs(isHdr);

    await run("ffmpeg", [
        "-hide_banner",
        "-y",
        ...encoder.beforeInput,
        "-i",
        inputPath,
        // Only keep the first video track and the first audio track (if any).
        // iPhone MOVs also carry metadata tracks we do not want.
        "-map",
        "0:v:0",
        "-map",
        "0:a:0?",
        // Drop all metadata, including the GPS location.
        "-map_metadata",
        "-1",
        "-map_chapters",
        "-1",
        "-vf",
        encoder.filters.join(","),
        ...encoder.output,
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-ac",
        "2",
        // Move the index to the front so playback starts before download ends.
        "-movflags",
        "+faststart",
        outputPath,
    ]);
}

// Builds the ffmpeg arguments for the chosen encoder.
//
// HOOK FOR HARDWARE ENCODING: to use the EliteDesk's Intel GPU later, add a
// "vaapi" case here and pass /dev/dri into the container. Roughly:
//   beforeInput: ["-vaapi_device", "/dev/dri/renderD128"]
//   filters:     [...same scale/tonemap filters..., "format=nv12", "hwupload"]
//   output:      ["-c:v", "h264_vaapi", "-qp", "23"]
// Then set VIDEO_ENCODER=vaapi in docker-compose.yml.
function videoEncoderArgs(isHdr: boolean): {
    beforeInput: string[];
    filters: string[];
    output: string[];
} {
    // Make the shorter side 720px (works for portrait and landscape)
    // and keep both sides even, which H.264 requires.
    const scale =
        "scale=720:720:force_original_aspect_ratio=increase:force_divisible_by=2";

    // iPhones record HDR (HLG) by default. Converting that straight to
    // normal H.264 looks washed out, so tone map it down to standard range.
    const toneMap = [
        "zscale=t=linear:npl=100",
        "format=gbrpf32le",
        "zscale=p=bt709",
        "tonemap=hable:desat=0",
        "zscale=t=bt709:m=bt709:r=tv",
    ];

    switch (config.videoEncoder) {
        case "software":
            return {
                beforeInput: [],
                filters: [scale, ...(isHdr ? toneMap : []), "format=yuv420p"],
                output: [
                    "-c:v",
                    "libx264",
                    "-preset",
                    "veryfast",
                    "-crf",
                    "23",
                    "-colorspace",
                    "bt709",
                    "-color_primaries",
                    "bt709",
                    "-color_trc",
                    "bt709",
                ],
            };
        default:
            throw new Error(
                `VIDEO_ENCODER "${config.videoEncoder}" is not supported yet`
            );
    }
}

async function isHdrVideo(inputPath: string): Promise<boolean> {
    const { stdout } = await run("ffprobe", [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=color_transfer",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        inputPath,
    ]);
    const transfer = stdout.trim();
    // HLG and PQ are the two HDR transfer curves.
    return transfer === "arib-std-b67" || transfer === "smpte2084";
}

// ---------------------------------------------------------------------------
// Image
// ---------------------------------------------------------------------------

async function processImage(
    mime: string,
    inputPath: string,
    outputPath: string
) {
    // sharp's bundled libvips cannot decode HEIC, so convert it to PNG first
    // with heif-dec (from the libheif-examples package).
    const isHeic = mime === "image/heic" || mime === "image/heif";
    const decodedPath = `${inputPath}.png`;
    if (isHeic) {
        await run("heif-dec", [inputPath, decodedPath]);
    }

    try {
        // animated: true keeps every frame of a GIF or animated WebP.
        // It makes no difference for still images.
        await sharp(isHeic ? decodedPath : inputPath, { animated: true })
            .rotate() // apply the EXIF orientation before metadata is dropped
            .resize({
                width: 2048,
                height: 2048,
                fit: "inside",
                withoutEnlargement: true,
            })
            .webp({ quality: 82 })
            .toFile(outputPath); // sharp drops EXIF (and GPS) by default
    } finally {
        if (isHeic) await fs.rm(decodedPath, { force: true });
    }
}

// ---------------------------------------------------------------------------
// Audio
// ---------------------------------------------------------------------------

async function processAudio(inputPath: string, outputPath: string) {
    const { stdout } = await run("ffprobe", [
        "-v",
        "error",
        "-select_streams",
        "a:0",
        "-show_entries",
        "stream=codec_name",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        inputPath,
    ]);
    const alreadyAac = stdout.trim() === "aac";

    await run("ffmpeg", [
        "-hide_banner",
        "-y",
        "-i",
        inputPath,
        "-map",
        "0:a:0",
        "-map_metadata",
        "-1",
        // Voice Memos are usually AAC already: copy instead of re-encoding.
        ...(alreadyAac ? ["-c:a", "copy"] : ["-c:a", "aac", "-b:a", "128k"]),
        "-movflags",
        "+faststart",
        outputPath,
    ]);
}

// ---------------------------------------------------------------------------

// Runs a command without a shell and includes its error output on failure.
async function run(command: string, args: string[]) {
    try {
        return await execFileAsync(command, args, {
            maxBuffer: 10 * 1024 * 1024,
            timeout: 30 * 60 * 1000, // give up on anything taking 30+ minutes
        });
    } catch (error) {
        const stderr = (error as { stderr?: string }).stderr ?? "";
        throw new Error(
            `${command} failed: ${stderr.trim().slice(-2000) || error}`
        );
    }
}
