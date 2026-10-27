import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
const { destination, WEB, HOME } = createRequire(import.meta.url)(
  "../desktop/navigation.cjs",
);
describe("desktop account navigation", () => {
  it("keeps account/auth routes inside the app and preserves invitation parameters", () => {
    for (const path of [
      "/cloud",
      "/sign-in",
      "/sign-up",
      "/profile",
      "/workspaces",
      "/w/test/tasks",
      "/invite/123?email=qa%40example.test#accept",
    ]) {
      expect(destination("arzdesk://local" + path)).toEqual({
        kind: "online",
        url: WEB + path,
      });
      expect(destination(WEB + path)).toEqual({
        kind: "online",
        url: WEB + path,
      });
    }
  });
  it("returns to existing device workspaces for local links", () => {
    expect(destination(HOME + "#workspace/tasks")).toEqual({
      kind: "device",
      url: HOME + "#workspace/tasks",
    });
    for (const path of ["/", "/offline", "/start"])
      expect(destination(WEB + path).kind).toBe("device");
  });
  it("never embeds lookalike origins or grants local/system navigation", () => {
    for (const url of [
      "https://arzdesk-sage.vercel.app.evil.test/sign-in",
      "https://evil.test/?next=" + WEB,
      "https://arzdesk-sage.vercel.app:444/sign-in",
    ])
      expect(destination(url).kind).toBe("external");
    for (const url of [
      "https://user:pass@arzdesk-sage.vercel.app/sign-in",
      "javascript:alert(1)",
      "file:///etc/passwd",
      "http://arzdesk-sage.vercel.app/sign-in",
      "arzdesk://evil/offline",
      "not an address",
    ])
      expect(destination(url).kind).toBe("blocked");
  });
});
