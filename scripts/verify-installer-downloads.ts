import { createHash } from "node:crypto";
import {
  desktopPlatforms,
  getApprovedRelease,
} from "../src/lib/desktop-releases";
let verified = 0;
for (const platform of desktopPlatforms) {
  const release = getApprovedRelease(platform);
  if (!release) continue;
  const response = await fetch(release.url, {
    redirect: "error",
    signal: AbortSignal.timeout(300000),
  });
  if (
    !response.ok ||
    !response.body ||
    Number(response.headers.get("content-length")) !== release.bytes
  )
    throw Error(`${platform}: missing file or incorrect length`);
  const disposition = response.headers.get("content-disposition");
  // Dashboard uploads use binary MIME type, which prompts a download without
  // Content-Disposition. If attachment metadata exists, its filename must match.
  if (
    disposition
      ? !disposition.includes(release.fileName)
      : response.headers.get("content-type")?.split(";")[0].trim() !==
        "application/octet-stream"
  )
    throw Error(
      `${platform}: missing binary download type or incorrect attachment filename`,
    );
  const hash = createHash("sha256");
  let bytes = 0;
  for await (const chunk of response.body) {
    bytes += chunk.length;
    hash.update(chunk);
  }
  if (bytes !== release.bytes || hash.digest("hex") !== release.sha256)
    throw Error(`${platform}: downloaded bytes do not match approved file`);
  console.log(
    `${platform}: verified ${release.fileName}, ${bytes} bytes, SHA-256 ${release.sha256}`,
  );
  verified++;
}
if (!verified)
  throw Error(
    "No tested and approved installers are configured. Public downloads remain disabled.",
  );
