# kristianpayne.dev

A single chronological feed of short posts: videos, photos, voice memos and text.

- `app/`: the Next.js site. The home page fetches entries from the feed service.
- `feed-service/`: the upload and read API that runs on the home lab. See its
  [README](feed-service/README.md) for setup and the iOS Shortcut.

To try things locally without touching the live feed, run both together:

```bash
npm run dev:local
```

Then open http://localhost:3000 for the site and http://localhost:8081 for the compose
page (token `dev`).
