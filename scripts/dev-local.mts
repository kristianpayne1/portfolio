// Runs the feed service and the Next.js site together, fully local.
//
//   npm run dev:local
//
//   site:          http://localhost:3000
//   compose page:  http://localhost:8081  (token: dev)
//
// Posts go into feed-service/data-local/, never the live feed.
// Delete that folder to start fresh. Ctrl+C stops both servers.

import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import fs from "node:fs";

const feedServiceDir = new URL("../feed-service/", import.meta.url).pathname;

// The feed service has its own dependencies. Install them on first run.
if (!fs.existsSync(`${feedServiceDir}node_modules`)) {
    console.log("Installing feed-service dependencies...");
    spawnSync("npm", ["install"], { cwd: feedServiceDir, stdio: "inherit" });
}

const feed = start("feed", "npm", ["run", "dev"], {
    cwd: feedServiceDir,
    env: {
        UPLOAD_TOKEN: "dev",
        // A separate folder from ./data, which is where Docker keeps the
        // real data on the home lab.
        DATA_DIR: "./data-local",
        PUBLIC_URL: "http://localhost:8080",
        // Only reachable from this machine, not the rest of the network.
        UPLOAD_HOST: "127.0.0.1",
        PUBLIC_HOST: "127.0.0.1",
    },
});

const site = start("site", "npx", ["next", "dev"], {
    env: { FEED_API_URL: "http://localhost:8080" },
});

console.log(`
  site:          http://localhost:3000
  compose page:  http://localhost:8081  (token: dev)
`);

// Starts a command and prefixes each line of its output with a label,
// so the two servers' logs are easy to tell apart.
function start(
    label: string,
    command: string,
    args: string[],
    options: { cwd?: string; env: Record<string, string> }
): ChildProcess {
    const child = spawn(command, args, {
        cwd: options.cwd,
        env: { ...process.env, ...options.env },
    });

    const prefix = `[${label}] `;
    for (const stream of [child.stdout, child.stderr]) {
        stream?.on("data", (chunk: Buffer) => {
            const lines = chunk.toString().trimEnd().split("\n");
            for (const line of lines) console.log(prefix + line);
        });
    }

    // If one server dies, stop the other too.
    child.on("exit", (code) => {
        console.log(`${prefix}stopped (exit code ${code})`);
        stopAll();
    });

    return child;
}

function stopAll() {
    for (const child of [feed, site]) {
        if (child && child.exitCode === null) child.kill();
    }
}

process.on("SIGINT", stopAll);
process.on("SIGTERM", stopAll);
