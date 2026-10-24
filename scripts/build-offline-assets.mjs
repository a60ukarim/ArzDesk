import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? walk(path.join(directory, entry.name))
          : [path.join(directory, entry.name)],
      ),
    )
  ).flat();
}
const assets = (await walk(".next/static"))
  .filter((file) => /\.(js|css|woff2?)$/.test(file))
  .map(
    (file) =>
      "/_next/static/" +
      path.relative(".next/static", file).split(path.sep).join("/"),
  );
assets.push("/offline", "/arzdesk-logo-v1.png", "/arzcore-company-icon-v3.png");
assets.sort();
const version = createHash("sha256")
  .update(assets.join("\n"))
  .update(await readFile(".next/BUILD_ID", "utf8"))
  .digest("hex")
  .slice(0, 20);
await writeFile(
  "public/offline-assets.js",
  `self.ARZDESK_OFFLINE_BUILD=${JSON.stringify({ version, assets })};\n`,
);
console.log(
  `Offline shell: ${assets.length} public assets prepared (${version}).`,
);
