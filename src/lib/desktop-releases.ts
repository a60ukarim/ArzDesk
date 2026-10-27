import { z } from "zod";
import approvals from "../../releases/approved-installers.json";
export const desktopPlatforms = ["windows", "mac-arm64", "mac-intel"] as const;
export type DesktopPlatform = (typeof desktopPlatforms)[number];
const releaseOrigin = "https://pub-53bc8476c2234ed0be7e02fb5c528d42.r2.dev";
const automatedTestSchema = z
  .object({
    provider: z.literal("github-actions"),
    runId: z.number().int().positive(),
    jobId: z.number().int().positive(),
    system: z.enum(["windows-x64", "macos-arm64", "macos-x64"]),
    sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
    testedAt: z.iso.datetime(),
    checks: z
      .object({
        packagedLaunch: z.literal(true),
        backupRoundTrip: z.literal(true),
        restartPersistence: z.literal(true),
        networkBlocked: z.literal(true),
        onlineAccountWindow: z.literal(true),
      })
      .strict(),
  })
  .strict();
const systems = {
  windows: ["windows-10", "windows-11"],
  "mac-arm64": ["macos-apple-silicon"],
  "mac-intel": ["macos-intel"],
} as const;
const checks = z
  .object({
    install: z.literal(true),
    offlineLaunch: z.literal(true),
    reopenPersistence: z.literal(true),
    backupRoundTrip: z.literal(true),
    upgradeDataPreserved: z.literal(true),
  })
  .strict();
const releaseSchema = z
  .object({
    platform: z.enum(desktopPlatforms),
    version: z.string().regex(/^\d+\.\d+\.\d+(?:-[a-z0-9.]+)?$/),
    sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
    fileName: z.string().regex(/^ArzDesk-[A-Za-z0-9.-]+\.(exe|dmg)$/),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    bytes: z.number().int().min(10000000),
    physicalTests: z.array(
      z
        .object({
          system: z.enum([
            "windows-10",
            "windows-11",
            "macos-apple-silicon",
            "macos-intel",
          ]),
          testedAt: z.iso.datetime(),
          evidence: z.string().trim().min(10).max(500),
          checks,
        })
        .strict(),
    ),
    automatedTest: automatedTestSchema.optional(),
  })
  .strict();
const manifestSchema = z
  .object({ schemaVersion: z.literal(1), releases: z.array(releaseSchema) })
  .strict();
export function getApprovedRelease(
  platform: string,
  manifest: unknown = approvals,
  base = process.env.ARZDESK_RELEASES_BASE_URL || releaseOrigin,
) {
  const parsed = manifestSchema.safeParse(manifest);
  if (
    !parsed.success ||
    !desktopPlatforms.includes(platform as DesktopPlatform) ||
    !base
  )
    return null;
  const matches = parsed.data.releases.filter((r) => r.platform === platform);
  if (matches.length !== 1) return null;
  const release = matches[0];
  const expected =
    release.platform === "windows"
      ? `ArzDesk-Setup-${release.version}-x64.exe`
      : `ArzDesk-${release.version}-mac-${release.platform === "mac-arm64" ? "arm64" : "x64"}.dmg`;
  if (release.fileName !== expected) return null;
  const manualPassed = systems[release.platform].every((system) =>
    release.physicalTests.some(
      (test) =>
        test.system === system && Date.parse(test.testedAt) <= Date.now(),
    ),
  );
  const nativeSystem = {
    windows: "windows-x64",
    "mac-arm64": "macos-arm64",
    "mac-intel": "macos-x64",
  }[release.platform];
  const automatedPassed =
    release.automatedTest?.system === nativeSystem &&
    release.automatedTest.sourceCommit === release.sourceCommit &&
    Date.parse(release.automatedTest.testedAt) <= Date.now();
  // The owner may release CI-tested native packages without claiming a personal
  // device test. Untested files and environment-variable-only activation fail closed.
  if (!manualPassed && !automatedPassed) return null;
  try {
    const origin = new URL(base);
    // Exact, reviewed hosts only. Adding a custom domain also requires proving its R2 binding.
    if (
      origin.protocol !== "https:" ||
      origin.username ||
      origin.password ||
      origin.port ||
      origin.search ||
      origin.hash ||
      origin.pathname !== "/" ||
      ![
        "pub-53bc8476c2234ed0be7e02fb5c528d42.r2.dev",
        "downloads.arzcore.com",
      ].includes(origin.hostname)
    )
      return null;
    const objectKey = `releases/${release.version}/${release.sha256}/${release.fileName}`;
    return {
      ...release,
      objectKey,
      url: new URL(objectKey, origin).href,
      downloadPath: `/download/${release.platform}`,
    };
  } catch {
    return null;
  }
}
