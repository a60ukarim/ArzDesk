import { spawn } from "node:child_process";
import { cp, mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";

const cwd = process.cwd();
const destination = path.join(cwd, "desktop", "bundle");
const port = 45671;
const env = {
  ...process.env,
  NODE_ENV: "production",
  BETTER_AUTH_URL: "http://127.0.0.1:" + port,
  BETTER_AUTH_SECRET:
    "build-only-desktop-bundle-secret-over-thirty-two-characters",
};
const command = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "-H",
    "127.0.0.1",
    "-p",
    String(port),
  ],
  { cwd, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
);
let output = "";
for (const stream of [command.stdout, command.stderr]) {
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    output = (output + chunk).slice(-12000);
  });
}
try {
  let response;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (command.exitCode !== null)
      throw Error("Local Next server stopped: " + output);
    try {
      response = await fetch("http://127.0.0.1:" + port + "/offline", {
        signal: AbortSignal.timeout(2000),
        headers: { "cache-control": "no-store" },
      });
      if (response.ok) break;
    } catch {
      // The server is still booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  if (!response?.ok) throw Error("Unable to render desktop app: " + output);
  const html = await response.text();
  if (
    !html.toLowerCase().includes("<!doctype html") ||
    !html.includes("/_next/static/")
  ) {
    throw Error("Missing offline UI or scripts in desktop HTML");
  }
  // Only generated build output; never an installed application profile.
  await rm(destination, { recursive: true, force: true });
  await mkdir(path.join(destination, "offline"), { recursive: true });
  await writeFile(
    path.join(destination, "offline", "index.html"),
    html,
    "utf8",
  );
  await mkdir(path.join(destination, "_next"), { recursive: true });
  await cp(
    path.join(cwd, ".next", "static"),
    path.join(destination, "_next", "static"),
    { recursive: true },
  );
  await cp(path.join(cwd, "public"), destination, {
    recursive: true,
    filter: (source) =>
      !["sw.js", "offline-assets.js"].includes(path.basename(source)),
  });
  console.log("ARZDESK_BUNDLED_OFFLINE_OK " + Buffer.byteLength(html));
} finally {
  command.kill();
}
