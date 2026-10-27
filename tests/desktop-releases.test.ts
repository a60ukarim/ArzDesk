import { describe, it, expect } from "vitest";
import { getApprovedRelease } from "../src/lib/desktop-releases";
const base = "https://pub-53bc8476c2234ed0be7e02fb5c528d42.r2.dev";
function approved() {
  return {
    schemaVersion: 1,
    releases: [
      {
        platform: "windows",
        version: "0.7.0-beta.2",
        sourceCommit: "a".repeat(40),
        fileName: "ArzDesk-Setup-0.7.0-beta.2-x64.exe",
        sha256: "b".repeat(64),
        bytes: 121378834,
        physicalTests: ["windows-10", "windows-11"].map((system) => ({
          system,
          testedAt: "2026-01-01T00:00:00.000Z",
          evidence:
            "Synthetic unit-test fixture only, never a release approval",
          checks: {
            install: true,
            offlineLaunch: true,
            reopenPersistence: true,
            backupRoundTrip: true,
            upgradeDataPreserved: true,
          },
        })),
      },
    ],
  };
}
describe("public installer gate", () => {
  it("keeps releases without test evidence unavailable", () => {
    for (const platform of ["windows", "mac-arm64", "mac-intel", "android"]) {
      expect(
        getApprovedRelease(platform, { schemaVersion: 1, releases: [] }, base),
      ).toBeNull();
    }
  });
  it("builds versioned R2 URLs for the uploaded files and branded site links", () => {
    const r = getApprovedRelease("windows", approved(), base);
    expect(r?.downloadPath).toBe("/download/windows");
    expect(r?.url).toBe(`${base}/ArzDesk-Setup-0.7.0-beta.2-x64.exe`);
  });
  it("rejects missing, failed, partial, future or duplicated approvals", () => {
    const partial = approved();
    partial.releases[0].physicalTests.pop();
    expect(getApprovedRelease("windows", partial, base)).toBeNull();
    const failed = approved();
    failed.releases[0].physicalTests[0].checks.install = false;
    expect(getApprovedRelease("windows", failed, base)).toBeNull();
    const future = approved();
    future.releases[0].physicalTests[0].testedAt = "2099-01-01T00:00:00.000Z";
    expect(getApprovedRelease("windows", future, base)).toBeNull();
    const duplicate = approved();
    duplicate.releases.push(duplicate.releases[0]);
    expect(getApprovedRelease("windows", duplicate, base)).toBeNull();
  });
  it("refuses personal GitHub, lookalike hosts, credentials and wrong artifact architectures", () => {
    for (const host of [
      "https://github.com/a/releases",
      "https://objects.githubusercontent.com",
      "https://downloads.arzcore.com.evil.example",
      "https://user:password@downloads.arzcore.com",
      "http://downloads.arzcore.com",
      "https://downloads.arzcore.com/not-a-base/",
    ]) {
      expect(getApprovedRelease("windows", approved(), host)).toBeNull();
    }
    const wrong = approved();
    wrong.releases[0].fileName = "ArzDesk-0.7.0-beta.2-mac-arm64.dmg";
    expect(getApprovedRelease("windows", wrong, base)).toBeNull();
  });
});

it("uses real native CI evidence without claiming a physical-device test", () => {
  for (const platform of ["windows", "mac-arm64", "mac-intel"]) {
    const release = getApprovedRelease(platform, undefined, base);
    expect(release?.version).toBe("1.0.2");
    expect(release?.physicalTests).toEqual([]);
    expect(release?.automatedTest?.provider).toBe("github-actions");
    const record = JSON.parse(JSON.stringify(release));
    record.automatedTest.checks.onlineAccountWindow = false;
    const { objectKey, url, downloadPath, ...entry } = record;
    void objectKey;
    void url;
    void downloadPath;
    expect(
      getApprovedRelease(
        platform,
        { schemaVersion: 1, releases: [entry] },
        base,
      ),
    ).toBeNull();
    entry.automatedTest.checks.onlineAccountWindow = true;
    entry.automatedTest.sourceCommit = "f".repeat(40);
    expect(
      getApprovedRelease(
        platform,
        { schemaVersion: 1, releases: [entry] },
        base,
      ),
    ).toBeNull();
    entry.automatedTest.sourceCommit = entry.sourceCommit;
    entry.automatedTest.testedAt = "2099-01-01T00:00:00.000Z";
    expect(
      getApprovedRelease(
        platform,
        { schemaVersion: 1, releases: [entry] },
        base,
      ),
    ).toBeNull();
  }
});

it("requires the correct native Mac architecture test before enabling either DMG", () => {
  for (const [platform, arch, system] of [
    ["mac-arm64", "arm64", "macos-apple-silicon"],
    ["mac-intel", "x64", "macos-intel"],
  ]) {
    const fixture = approved();
    fixture.releases[0].platform = platform;
    fixture.releases[0].fileName = `ArzDesk-0.7.0-beta.2-mac-${arch}.dmg`;
    fixture.releases[0].physicalTests = [
      { ...fixture.releases[0].physicalTests[0], system },
    ];
    expect(getApprovedRelease(platform, fixture, base)?.downloadPath).toBe(
      `/download/${platform}`,
    );
    expect(
      getApprovedRelease(
        platform === "mac-arm64" ? "mac-intel" : "mac-arm64",
        fixture,
        base,
      ),
    ).toBeNull();
  }
});
