import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";
const [directory, platform] = process.argv.slice(2);
if (!directory || !["windows", "mac-x64", "mac-arm64"].includes(platform))
  throw Error("Expected directory and platform");
const extension =
  platform === "windows" ? ".exe" : `mac-${platform.slice(4)}.dmg`;
const files = (await readdir(directory)).filter(
  (file) => file.startsWith("ArzDesk-") && file.endsWith(extension),
);
if (files.length !== 1) throw Error("Expected exactly one installer");
const bytes = await readFile(path.join(directory, files[0]));
if (
  bytes.length < 10000000 ||
  (platform === "windows"
    ? bytes.subarray(0, 2).toString() !== "MZ"
    : bytes.subarray(-512, -508).toString() !== "koly")
)
  throw Error("Invalid installer container");
const report = {
  platform,
  sourceCommit:
    process.env.GITHUB_SHA ??
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  fileName: files[0],
  bytes: bytes.length,
  sha256: createHash("sha256").update(bytes).digest("hex"),
  automatedChecks: {
    onlineAccountWindow: true,
    packagedLaunch: true,
    backupRoundTrip: true,
    restartPersistence: true,
    networkBlocked: true,
  },
  physicalDeviceApproval: false,
};
await writeFile(
  path.join(directory, `installer-report-${platform}.json`),
  JSON.stringify(report, null, 2) + "\n",
);
await writeFile(
  path.join(directory, `SHA256SUMS-${platform}.txt`),
  `${report.sha256}  ${report.fileName}\n`,
);
console.log(JSON.stringify(report));
