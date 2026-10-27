import { describe, expect, it } from "vitest";
import { safeWorkspaceReturn } from "@/lib/workspace-return";
describe("workspace return destinations", () => {
  it("retains the selected online workspace, section, query and fragment", () => {
    for (const value of [
      "/w/team-id",
      "/w/team-id/tasks?view=recent#item",
      "/workspaces",
      "/cloud",
    ])
      expect(safeWorkspaceReturn(value)).toBe(value);
  });
  it("rejects external destinations and local-mode detours", () => {
    for (const value of [
      null,
      "",
      "https://evil.example/w/team",
      "//evil.example",
      "/\\evil.example",
      "/profile",
      "/install",
      "/offline",
      "/w/team/tasks/other",
      "/w/team/../../sign-in",
    ])
      expect(safeWorkspaceReturn(value)).toBeNull();
  });
});
