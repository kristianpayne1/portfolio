# feed-service

Upload and read API for the kristianpayne.dev feed. Runs on the home lab in Docker.

```
iPhone Shortcut ─┐
Compose page    ─┴─Tailscale──▶ :8081  upload server   POST /upload, compose page
                                       │
                                       ▼  ./data (SQLite + media files)
                                       │
Next.js site  ◀──Cloudflare Tunnel── :8080  public server  GET /entries, GET /media/*
```

The two servers listen on separate ports. The public server has no upload route at all,
so nothing you do in the Cloudflare dashboard can expose uploads by accident.

| Port | What                          | Reachable from                                  |
| ---- | ----------------------------- | ----------------------------------------------- |
| 8080 | `/entries`, `/media/*`, `/health` | Only the `cloudflared` container (not published on the host) |
| 8081 | compose page, `/upload`, `/api/*` | `127.0.0.1` on the host, shared to your tailnet by `tailscale serve` |

Neither container joins the Gluetun/VPN network.

## What happens to an upload

| Upload            | Result                                                         |
| ----------------- | -------------------------------------------------------------- |
| Video (MOV, MP4)  | 720p H.264 MP4. iPhone HDR is tone mapped so it does not look washed out. |
| Photo (HEIC, JPEG, PNG, WebP) | WebP, max 2048px, EXIF and GPS removed            |
| Audio (M4A, AAC, MP3, WAV)    | M4A. AAC is copied as-is, anything else is re-encoded. |
| Text only (title and/or body) | Text entry, published immediately                  |

All metadata (including location) is stripped from every file. File types are
detected from the file contents, not the name. Anything else gets a `415`.

Text posts appear straight away. Media is processed in the background, one job at
a time, so the Shortcut gets an answer as soon as the upload finishes. The entry
shows up in `/entries` once processing is done. If the container restarts in the
middle of a job, the job starts again on the next boot.

## Set up on the EliteDesk

You need Docker, and Tailscale installed on the host (not in a container).

**1. Get the code and create the config**

```bash
git clone https://github.com/kristianpayne1/portfolio.git
cd portfolio/feed-service
cp .env.example .env
```

**2. Make an upload token** and paste it into `.env` as `UPLOAD_TOKEN`:

```bash
openssl rand -hex 32
```

**3. Create the Cloudflare Tunnel** (in the browser):

1. Cloudflare dashboard > Zero Trust > Networks > Tunnels > Create a tunnel > Cloudflared.
2. Name it `feed`. On the install screen, copy the token (the long string after
   `--token`) into `.env` as `TUNNEL_TOKEN`. You do not need to run their install command.
3. Add a public hostname:
   - Subdomain `media`, domain `kristianpayne.dev`
   - Service type `HTTP`, URL `feed:8080`
4. Do not add any hostname pointing at port 8081.

**4. Create the data folder.** The container runs as user id 1000, which is usually
your own user on Linux, so a plain `mkdir` is enough:

```bash
mkdir data
```

If `id -u` prints something other than 1000, also run `sudo chown 1000:1000 data`.

**5. Start it.** This downloads the published image (see "Automatic updates" below):

```bash
docker compose up -d
```

**6. Share the upload port with your tailnet.** This gives you an HTTPS address like
`https://elitedesk.your-tailnet.ts.net` that only your Tailscale devices can reach.
The setting survives reboots.

```bash
sudo tailscale serve --bg 8081
```

If HTTPS certificates are not enabled for your tailnet yet, the command tells you
how to turn them on (one toggle in the Tailscale admin console). If you already use
`tailscale serve` on port 443 for something else, use `--https=8443 8081` instead
and add `:8443` to the Shortcut URL.

**7. Check it works.** From any device on your tailnet (replace the address and token):

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" -F caption="Hello from curl" https://elitedesk.your-tailnet.ts.net/upload
```

Then open https://media.kristianpayne.dev/entries and you should see the post.

## Day to day

See the logs (shows each job being processed or failing):

```bash
docker compose logs -f feed
```

Updates happen by themselves, see "Automatic updates" below.


**If a job fails**, its raw upload and a `.json` job file are moved to `data/failed/`.
To retry, move both files back into `data/incoming/` and restart with
`docker compose restart feed`.

**Cleanup** runs at startup and every hour, and logs what it removes. It deletes media
added in the compose page but never published (after 24 hours), raw uploads left behind by
a crash (after 24 hours) and failed uploads (after 7 days). Change these with the settings
below.

**Back up** by copying the whole `data/` folder. It holds the database and every media file.

**Deleting a post:** use the Delete button on the compose page. It removes the entry and
all of its files, including media embedded in the text. Cloudflare may still have a cached copy of the media file, so for anything
sensitive also purge its URL in Cloudflare (Caching > Configuration > Custom Purge).

## Automatic updates

Push to `main` and the EliteDesk updates itself within about 5 minutes. No `git pull`,
no rebuilding.

```
push to main ──▶ GitHub Actions: typecheck, build ──▶ ghcr.io/kristianpayne1/feed-service:latest
                                                                    │
EliteDesk timer, every 5 min: docker compose pull ◀─────────────────┘
                              docker compose up -d   (restarts only if the image changed)
                              docker image prune     (deletes old versions)
```

- **GitHub side:** `.github/workflows/feed-service.yml` runs when anything in
  `feed-service/` changes on `main` (or by hand from the Actions tab). If the typecheck or
  the build fails, nothing is published and the EliteDesk keeps running the old version.
  Each image is tagged `latest` and with its commit hash.
- **EliteDesk side:** `deploy/feed-update.service` and `deploy/feed-update.timer`. The
  EliteDesk only ever downloads. GitHub has no way into the home lab.
- **The image is public**, like the repo. It contains only the code; `.env`, `data/` and
  all media stay on the EliteDesk.
- **The workflow's actions are pinned** to exact commits, so a hijacked release tag of one
  of them cannot change what runs. Dependabot opens a pull request when one has a new
  release (`.github/dependabot.yml`).
- **The feed container is locked down** in `docker-compose.yml`, in case an image were
  ever bad: its files are read-only (only `data/` and a small `/tmp` are writable), it has
  no Linux privileges and cannot gain any, and it may use at most 3 CPU cores, 3 GB of
  memory and 512 processes, so the rest of the EliteDesk stays responsive. The Cloudflare
  tunnel token is not in this container at all.

**Install the timer** (once, on the EliteDesk):

```bash
sudo cp ~/portfolio/feed-service/deploy/feed-update.* /etc/systemd/system/
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now feed-update.timer
```

**Which version is running?** `/health` shows the commit it was built from:

```bash
curl https://media.kristianpayne.dev/health
```

**See what the timer did:**

```bash
journalctl -u feed-update.service --since today
```

**Update right now** instead of waiting:

```bash
sudo systemctl start feed-update.service
```

**Pause updates** (for example while testing something by hand):

```bash
sudo systemctl stop feed-update.timer
```

`sudo systemctl start feed-update.timer` turns them back on.

**Roll back** to an older version: in `docker-compose.yml`, replace `:latest` with that
commit's hash (from the Actions tab), stop the timer, and run `docker compose up -d`.

**Changes to `docker-compose.yml` or `deploy/`** are not picked up automatically, because
the timer only updates the image. After changing those, run `git pull` in `~/portfolio`
on the EliteDesk (and `docker compose up -d`, or re-copy the deploy files).

**Build locally instead**, for testing changes in Docker:
`docker compose -f docker-compose.yml -f compose.build.yml up -d --build`. The timer
swaps it back to the published image on its next run, so stop the timer first.

## Settings

Set in `docker-compose.yml` (secrets in `.env`):

| Variable        | Default                           | Meaning                                    |
| --------------- | --------------------------------- | ------------------------------------------ |
| `UPLOAD_TOKEN`  | required                          | Bearer token for `/upload`                 |
| `TUNNEL_TOKEN`  | required (cloudflared)            | Cloudflare Tunnel token                    |
| `PUBLIC_URL`    | `https://media.kristianpayne.dev` | Used to build `media_url` in `/entries`    |
| `MAX_UPLOAD_MB` | `1024`                            | Largest accepted file                      |
| `VIDEO_ENCODER` | `software`                        | `software` (libx264). `vaapi` is a placeholder, see `videoEncoderArgs()` in `src/media.ts` |
| `SITE_URL`      | `https://kristianpayne.dev`       | The feed website, linked from the compose page |
| `UNUSED_MEDIA_HOURS` | `24`                         | Media added in the compose page but never published is deleted after this |
| `FAILED_UPLOAD_DAYS` | `7`                          | Uploads that failed to process are kept this long for a manual retry |

## Compose page

Open `https://hp-elitedesk.tail90c0ce.ts.net/` in any browser on a device connected to
Tailscale. It asks for the upload token once and remembers it in that browser.

- Write a post with an optional title, a Markdown body and a private toggle.
- Lists your 50 most recent posts, including private ones, each with Edit and Delete.
  Edit loads the post into the form (Post becomes Save); saving keeps its date and place
  in the feed. Media you remove from the text while editing is deleted, and switching
  Private moves the post's files between the public and private folders.
  Public posts link to their own page on the site; **View feed** opens the feed.
- ⌘ + Enter (Ctrl + Enter) posts.

**Media in the text.** Use **Add media**, or drop or paste files into the text box. Add as
many photos, videos and audio files as you like. Each one uploads and processes straight
away, then a line like this appears where your cursor was:

```
![IMG_1234](media/AbC123xyz_-9.webp)
```

The text between the `[ ]` is the caption shown under the media. It starts as the file's
name without its extension; edit it, or delete it to show no caption.

Shortcuts for captions and links:

- Highlight some text, then add media: the media replaces the text, and the text becomes
  its caption. With several files, the first one gets it.
- Highlight some text, then paste a web address: it becomes a link, `[text](https://...)`. Move or delete the line like
any other text. Post stays disabled until every file is ready, so a post never goes out
with broken media.

Files you add but never publish wait in `data/media/drafts/` (never served) and are
deleted after 24 hours. When you publish, a post's files move to the public folder, or the
private one for a private post.

The iOS Shortcut still attaches one photo, video or voice memo to a post, as before.

The body supports Markdown: `**bold**`, `*italic*`, `[links](https://example.com)`,
bare URLs, lists, quotes and code. Single line breaks are kept. Raw HTML is shown as
text, never run.

## API

**`POST /upload`** (port 8081, needs `Authorization: Bearer <token>`)

Multipart form fields, all optional, but send at least a file, a title or a caption:

- `file`: one video, photo or audio file
- `title`: a short heading, up to 200 characters
- `caption`: the post body in Markdown, up to 20,000 characters
- `private`: `true` keeps the entry out of `/entries`. Private files are stored in
  `data/media/private/`, which is never served.

Responds `201` for text posts and `202` for media (still processing). Both include a
`message` the Shortcut shows as a notification.

**`GET /api/entries`** (port 8081, needs the token): the 50 newest posts, including private ones.

**`PATCH /api/entries/<id>`** (port 8081, needs the token): edits a post. JSON body
`{ "title", "caption", "private" }`. Its date, type and attached file stay the same.

**`DELETE /api/entries/<id>`** (port 8081, needs the token): deletes a post and all its media.

**`POST /api/media`** (port 8081, needs the token): one multipart `file` to embed in a
post's Markdown. Waits until it is processed, then returns `{ id, type, markdown }`, where
`markdown` is the line to insert. `/entries` turns `media/<file>` references into full URLs.

**`GET /entries?limit=20`** (port 8080, public): the newest public posts.

```json
{
    "nextCursor": "2026-10-09T22:59:12.207Z",
    "entries": [
        {
            "id": "BtvDvOsxvMHB",
            "created_at": "2026-10-09T22:59:12.207Z",
            "type": "video",
            "title": "First vlog",
            "caption": "Testing the **new** camera",
            "media_url": "https://media.kristianpayne.dev/media/BtvDvOsxvMHB.mp4"
        }
    ]
}
```

For the next (older) page, pass `nextCursor` back as `before`:
`GET /entries?limit=20&before=2026-10-09T22:59:12.207Z`. `nextCursor` is `null` when
there is nothing older. Paging by "older than this post" instead of page numbers means
a new post never causes duplicates or gaps for someone scrolling. The feed page uses
this for endless scrolling, straight from the browser, so the response allows any origin
(CORS).

`limit` is capped at 50.

**`GET /entries/<id>`** (port 8080, public): one post, in the same shape as an item in
`entries`. `404` if it does not exist or is private. The site uses it for each post's own
page at `kristianpayne.dev/p/<id>`. `type` is `video`, `image`, `audio` or `text` (`media_url` is `null` for text). `title` and `caption` can each be `null`.

**`GET /media/<file>`**: processed files, cached for a year (file names never change).
Supports range requests, which iOS Safari needs to play video.

## Run it locally (optional)

From the repo root, this runs the feed service and the site together against a local
database, so you can try things without touching the live feed:

```bash
npm run dev:local
```

- Site: http://localhost:3000
- Compose page: http://localhost:8081 (token `dev`)
- Local posts are stored in `feed-service/data-local/`. Delete it to start fresh.

Needs Node 24 and ffmpeg. HEIC photos also need `heif-dec` (`brew install libheif`).

`npm run typecheck` (in `feed-service/`) checks the types. Node runs the `.ts` files
directly, so there is no build step.

---

# iOS Shortcut

One Shortcut handles everything. Share a video, photo or voice memo to it, or run it
on its own for a text post.

**Before you start:** install Tailscale on the iPhone and sign in to the same tailnet.
The Shortcut only works while Tailscale is connected.

## Build it

1. Open **Shortcuts**, tap **+** to make a new Shortcut, and name it **Post**.

2. Tap the **(i)** / settings button at the bottom, turn on **Show in Share Sheet**,
   and close it. A **Receive** block appears at the top of the Shortcut.

3. In the Receive block:
   - Tap the input types and select only **Images**, **Media** and **Files**.
   - Tap **If there's no input** and choose **Continue**. This is what makes text-only posts work.

4. Add the action **Ask for Input**.
   - Input type: **Text**
   - Prompt: `Caption (optional)`

5. Add the action **Get Contents of URL**.
   - URL: `https://elitedesk.your-tailnet.ts.net/upload` (your address from setup step 6)
   - Tap the arrow to show more options:
   - **Method**: `POST`
   - **Headers**: add one header
     - Key `Authorization`, value `Bearer ` followed by your token (with a space after `Bearer`)
   - **Request Body**: `Form`, then add three fields:
     - `file`, type **File**, value: tap and pick the **Shortcut Input** variable
     - `caption`, type **Text**, value: tap and pick the **Provided Input** variable
       (the answer from Ask for Input)
     - `private`, type **Text**, value `false`

6. Add the action **Get Dictionary Value**.
   - Get **Value** for key `message` in **Contents of URL**

7. Add the action **Show Notification** and set its text to the **Dictionary Value** variable.

That's it. You should see "Uploaded. Your video will appear once processed." or "Posted".

## Use it

- **Video, photo or voice memo:** in Photos or Voice Memos, tap Share, then **Post**,
  type a caption (or leave it empty) and tap Done.
- **Text only:** run **Post** from the Shortcuts app, a Home Screen icon, or the
  Action button. Type the text and tap Done.
- Share **one item at a time**. The server accepts a single file per post.

## Optional: a private toggle

To choose public or private on each post, add **Choose from Menu** before Get Contents
of URL with options `Public` and `Private`. Inside each option add a **Text** action
containing `false` or `true`. Then set the `private` form field to the **Menu Result**
variable. This adds one tap, so leave it out if you want the fastest path.

## Tips for staying under 15 seconds

- Upload time is the slow part, not the server. A 30 second clip in 4K is huge.
  Settings > Camera > Record Video > **1080p at 30 fps** keeps files small. The server
  downscales to 720p anyway.
- If the Shortcut says it cannot connect, Tailscale is probably off on the phone.
- An error notification showing `{"error": ...}` means the server rejected the post.
  `Unauthorized` means the token or the `Bearer ` prefix is wrong.

## Troubleshooting from the server

```bash
docker compose logs --tail 50 feed
```

Each upload logs a request line, then `Processing ...` and `Published ...` (or `failed`
with the ffmpeg error).
