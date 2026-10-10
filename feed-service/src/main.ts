// Starts both servers on separate ports:
//   public server (read only)  -> exposed through the Cloudflare Tunnel
//   upload server (write)      -> exposed only on Tailscale

import { scheduleCleanup } from "./cleanup.ts";
import { config } from "./config.ts";
import { resumeUnfinishedJobs, waitForQueue } from "./jobs.ts";
import { buildPublicServer } from "./public-server.ts";
import { buildUploadServer } from "./upload-server.ts";

const publicServer = await buildPublicServer();
const uploadServer = await buildUploadServer();

await publicServer.listen({ host: config.publicHost, port: config.publicPort });
await uploadServer.listen({ host: config.uploadHost, port: config.uploadPort });

await resumeUnfinishedJobs();
scheduleCleanup();

// On "docker stop", stop taking requests and let the current job finish.
// Docker waits 10 seconds by default (see stop_grace_period in compose);
// any job cut short is resumed on the next start.
async function shutdown() {
    await uploadServer.close();
    await publicServer.close();
    await waitForQueue();
    process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
