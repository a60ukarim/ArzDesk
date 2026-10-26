import { describe, it, expect } from "vitest";
import {
  applyLocalAction as act,
  emptyState,
  importLocalBackup,
  localStateSchema,
  localSnapshot,
} from "../src/features/offline/model";
function fixture() {
  const org = act(emptyState(), "organization.create", "", { name: "Studio" });
  const client = act(org.state, "client.save", org.id, { name: "Client" });
  const project = act(client.state, "project.save", org.id, {
    name: "Project",
    clientId: client.id,
  });
  const task = act(project.state, "task.save", org.id, {
    title: "Draft",
    projectId: project.id,
  });
  return {
    state: task.state,
    org: org.id,
    client: client.id,
    project: project.id,
    task: task.id,
  };
}
describe("device workspaces", () => {
  it("creates and updates real work without mutating previous saved state", () => {
    const f = fixture();
    const next = act(f.state, "task.status", f.org, {
      id: f.task,
      status: "done",
    }).state;
    expect(f.state.tasks[0].status).toBe("todo");
    expect(localSnapshot(next, f.org).stats.completedTasks).toBe(1);
    expect(
      act(next, "organization.rename", f.org, { name: "Renamed" }).state
        .organizations[0].name,
    ).toBe("Renamed");
  });
  it("deletes only the selected offline workspace, even when names are identical", () => {
    const original = fixture();
    const second = act(original.state, "organization.create", "", {
      name: "Studio",
    });
    const other = act(second.state, "client.save", second.id, { name: "Keep" });
    expect(() =>
      act(other.state, "organization.delete", original.org, {
        confirmation: "Wrong",
      }),
    ).toThrow("exact workspace name");
    const deleted = act(other.state, "organization.delete", original.org, {
      confirmation: "Studio",
    }).state;
    expect(deleted.organizations.map((o) => o.id)).toEqual([second.id]);
    expect(deleted.clients.map((c) => c.id)).toEqual([other.id]);
    expect(deleted.projects).toHaveLength(0);
    expect(deleted.tasks).toHaveLength(0);
    expect(original.state.organizations).toHaveLength(1);
    expect(() =>
      act(deleted, "organization.delete", original.org, {
        confirmation: "Studio",
      }),
    ).toThrow("not found");
  });
  it("enforces workspace boundaries, parent links and deletion rules", () => {
    const f = fixture();
    const other = act(f.state, "organization.create", "", { name: "Other" });
    expect(() =>
      act(other.state, "task.status", other.id, { id: f.task, status: "done" }),
    ).toThrow();
    expect(() =>
      act(other.state, "project.save", other.id, {
        name: "Wrong",
        clientId: f.client,
      }),
    ).toThrow();
    expect(() =>
      act(f.state, "client.delete", f.org, { id: f.client }),
    ).toThrow(/projects first/);
    const next = act(f.state, "project.delete", f.org, { id: f.project }).state;
    expect(next.tasks).toEqual([]);
    expect(next.clients).toHaveLength(1);
  });
  it("validates edits and rejects unavailable online mutations", () => {
    const f = fixture();
    expect(() =>
      act(f.state, "task.status", f.org, { id: f.task, status: "invalid" }),
    ).toThrow();
    expect(() => act(f.state, "client.save", f.org, { name: "" })).toThrow();
    expect(() =>
      act(f.state, "invite.create", f.org, { email: "person@example.com" }),
    ).toThrow(/online/);
  });
  it("imports as additional workspaces with remapped relationships", () => {
    const f = fixture();
    const merged = importLocalBackup(
      f.state,
      JSON.parse(JSON.stringify(f.state)),
    );
    expect(merged.organizations).toHaveLength(2);
    expect(merged.tasks).toHaveLength(2);
    expect(merged.tasks[0]).toEqual(f.state.tasks[0]);
    expect(merged.tasks[1].projectId).toBe(merged.projects[1].id);
    expect(merged.projects[1].clientId).toBe(merged.clients[1].id);
    expect(merged.tasks[1].organizationId).toBe(merged.organizations[1].id);
  });
  it("rejects corrupt, future, cross-workspace and ambiguous backups", () => {
    const f = fixture();
    expect(() =>
      importLocalBackup(f.state, { ...f.state, version: 99 }),
    ).toThrow();
    const broken = structuredClone(f.state);
    broken.tasks[0].projectId = "missing";
    expect(() => localStateSchema.parse(broken)).toThrow();
    const duplicate = structuredClone(f.state);
    duplicate.tasks[0].id = duplicate.projects[0].id;
    expect(() => localStateSchema.parse(duplicate)).toThrow();
    expect(f.state.organizations).toHaveLength(1);
  });
});
