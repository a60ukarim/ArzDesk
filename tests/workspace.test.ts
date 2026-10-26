import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import { createWorkspaceService } from "@/features/workspace/service";
import { members, user, invitations, projects, tasks } from "@/lib/db/schema";
import { testDatabase } from "./helpers/database";
let database: Awaited<ReturnType<typeof testDatabase>>;
let service: ReturnType<typeof createWorkspaceService>;
let orgA: string, orgB: string;
beforeAll(async () => {
  database = await testDatabase();
  service = createWorkspaceService(database.db);
});
afterAll(async () => {
  await database.close();
});
beforeEach(async () => {
  await database.reset();
  await database.db.insert(user).values(
    ["owner", "other", "admin", "member", "viewer", "invitee"].map((id) => ({
      id,
      name: id,
      email: `${id}@example.com`,
    })),
  );
  orgA = await service.createOrganization("owner", { name: "ArzCore" });
  orgB = await service.createOrganization("other", { name: "Other team" });
  await database.db.insert(members).values(
    ["admin", "member", "viewer"].map((id) => ({
      organizationId: orgA,
      userId: id,
      role: id as "admin" | "member" | "viewer",
    })),
  );
});
async function work(org = orgA, person = "owner") {
  const client = await service.saveClient(person, org, {
    name: "Example business",
    email: "client@example.com",
  });
  const project = await service.saveProject(person, org, {
    name: "Website redesign",
    clientId: client.id,
    status: "active",
  });
  const task = await service.saveTask(person, org, {
    title: "Build the contact page",
    projectId: project.id,
  });
  return { client, project, task };
}
describe("tenant isolation and real workspace data", () => {
  it("creates organizations atomically with owner membership", async () => {
    expect((await service.listOrganizations("owner")).map((o) => o.id)).toEqual(
      [orgA],
    );
    expect((await service.snapshot("owner", orgA)).membership.role).toBe(
      "owner",
    );
  });
  it("rejects anonymous IDs and nonmembers on reads and writes", async () => {
    await expect(service.snapshot("other", orgA)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      service.saveClient("unknown", orgA, { name: "x" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("returns only the current organization's records and correct statistics", async () => {
    const a = await work();
    await work(orgB, "other");
    await service.saveTask("owner", orgA, {
      title: "Finished",
      projectId: a.project.id,
      status: "done",
    });
    const snapshot = await service.snapshot("owner", orgA);
    expect(snapshot.clients).toHaveLength(1);
    expect(snapshot.projects).toHaveLength(1);
    expect(snapshot.stats).toEqual({
      clients: 1,
      activeProjects: 1,
      openTasks: 1,
      completedTasks: 1,
    });
  });
  it("does not allow guessed cross-tenant client update or deletion", async () => {
    const { client } = await work(orgB, "other");
    await expect(
      service.saveClient("owner", orgA, { name: "Stolen" }, client.id),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      service.deleteClient("owner", orgA, client.id),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await service.snapshot("other", orgB)).clients[0].name).toBe(
      "Example business",
    );
  });
  it("does not allow cross-tenant project or task update and deletion", async () => {
    const a = await work();
    const b = await work(orgB, "other");
    await expect(
      service.saveProject(
        "owner",
        orgA,
        { name: "x", clientId: a.client.id },
        b.project.id,
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      service.deleteProject("owner", orgA, b.project.id),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      service.saveTask(
        "owner",
        orgA,
        { title: "x", projectId: a.project.id },
        b.task.id,
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      service.deleteTask("owner", orgA, b.task.id),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  it("rejects cross-tenant parent references in the service", async () => {
    const b = await work(orgB, "other");
    await expect(
      service.saveProject("owner", orgA, { name: "x", clientId: b.client.id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      service.saveTask("owner", orgA, { title: "x", projectId: b.project.id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  it("enforces tenant references at the SQL layer even if the service is bypassed", async () => {
    const b = await work(orgB, "other");
    await expect(
      database.db.insert(projects).values({
        id: "bad",
        organizationId: orgA,
        clientId: b.client.id,
        name: "bad",
      }),
    ).rejects.toThrow();
    await expect(
      database.db.insert(tasks).values({
        id: "bad",
        organizationId: orgA,
        projectId: b.project.id,
        title: "bad",
      }),
    ).rejects.toThrow();
  });
  it("updates clients, projects and tasks, recomputing dashboard statistics", async () => {
    const a = await work();
    await service.saveClient(
      "owner",
      orgA,
      { name: "Updated", company: "Example business" },
      a.client.id,
    );
    await service.saveProject(
      "owner",
      orgA,
      { name: "Done", clientId: a.client.id, status: "completed" },
      a.project.id,
    );
    await service.saveTask(
      "owner",
      orgA,
      { title: "Done", projectId: a.project.id, status: "done" },
      a.task.id,
    );
    const s = await service.snapshot("owner", orgA);
    expect(s.clients[0].name).toBe("Updated");
    expect(s.stats).toEqual({
      clients: 1,
      activeProjects: 0,
      openTasks: 0,
      completedTasks: 1,
    });
  });
  it("prevents orphaned clients and deletes project tasks atomically", async () => {
    const a = await work();
    await expect(
      service.deleteClient("owner", orgA, a.client.id),
    ).rejects.toThrow("projects");
    await service.deleteProject("owner", orgA, a.project.id);
    expect((await service.snapshot("owner", orgA)).tasks).toHaveLength(0);
    await service.deleteClient("owner", orgA, a.client.id);
    expect((await service.snapshot("owner", orgA)).clients).toHaveLength(0);
  });
  it("ignores forged IDs and organization fields in form data", async () => {
    const row = await service.saveClient("owner", orgA, {
      id: "forged",
      organizationId: orgB,
      name: "Safe",
    });
    expect(row.organizationId).toBe(orgA);
    expect(row.id).not.toBe("forged");
  });
});
describe("RBAC", () => {
  it("permits viewers to read but rejects writes, deletes and invitations", async () => {
    const a = await work();
    expect((await service.snapshot("viewer", orgA)).clients).toHaveLength(1);
    await expect(
      service.saveClient("viewer", orgA, { name: "x" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      service.saveProject("viewer", orgA, { name: "x", clientId: a.client.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      service.saveTask("viewer", orgA, { title: "x", projectId: a.project.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      service.deleteTask("viewer", orgA, a.task.id),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      service.invite("viewer", orgA, {
        email: "x@example.com",
        role: "member",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("lets members create and update but not delete or manage members", async () => {
    const a = await work(orgA, "member");
    await service.saveTask(
      "member",
      orgA,
      { title: "Updated", projectId: a.project.id },
      a.task.id,
    );
    await expect(
      service.deleteTask("member", orgA, a.task.id),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      service.changeMember("member", orgA, "viewer", "admin"),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("lets admins delete work and invite viewers but not grant admin access", async () => {
    const a = await work();
    await service.deleteTask("admin", orgA, a.task.id);
    await service.invite("admin", orgA, {
      email: "invitee@example.com",
      role: "viewer",
    });
    await expect(
      service.invite("admin", orgA, { email: "x@example.com", role: "admin" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      service.changeMember("admin", orgA, "member", "admin"),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("protects ownership and applies role revocation on the next operation", async () => {
    await expect(
      service.changeMember("owner", orgA, "owner", "remove"),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await service.changeMember("owner", orgA, "admin", "viewer");
    await expect(
      service.saveClient("admin", orgA, { name: "x" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await service.changeMember("owner", orgA, "admin", "remove");
    await expect(service.snapshot("admin", orgA)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
  it("rejects cross-tenant member changes", async () => {
    await expect(
      service.changeMember("owner", orgA, "other", "admin"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
describe("invitation lifecycle", () => {
  it("stores hashes only and accepts the correct email once", async () => {
    const token = await service.invite("owner", orgA, {
      email: "INVITEE@example.com",
      role: "member",
    });
    const [row] = await database.db.select().from(invitations);
    expect(row.tokenHash).not.toBe(token);
    expect(row.tokenHash).toHaveLength(64);
    await expect(service.acceptInvite("other", token)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(await service.acceptInvite("invitee", token)).toBe(orgA);
    expect((await service.snapshot("invitee", orgA)).membership.role).toBe(
      "member",
    );
    await expect(service.acceptInvite("invitee", token)).rejects.toThrow(
      "invalid or expired",
    );
  });
  it("rejects expired and revoked tokens", async () => {
    const token = await service.invite("owner", orgA, {
      email: "invitee@example.com",
      role: "viewer",
    });
    await database.db
      .update(invitations)
      .set({ expiresAt: new Date(Date.now() - 1000) });
    await expect(service.acceptInvite("invitee", token)).rejects.toThrow(
      "invalid or expired",
    );
    const next = await service.invite("owner", orgA, {
      email: "invitee@example.com",
      role: "viewer",
    });
    const current = (await service.snapshot("owner", orgA)).invitations[0];
    await service.revokeInvite("owner", orgA, current.id);
    await expect(service.acceptInvite("invitee", next)).rejects.toThrow(
      "invalid or expired",
    );
  });
  it("reissuing revokes old links without upgrading existing membership", async () => {
    const old = await service.invite("owner", orgA, {
      email: "invitee@example.com",
      role: "admin",
    });
    const fresh = await service.invite("owner", orgA, {
      email: "invitee@example.com",
      role: "member",
    });
    await expect(service.acceptInvite("invitee", old)).rejects.toThrow();
    await database.db
      .insert(members)
      .values({ organizationId: orgA, userId: "invitee", role: "viewer" });
    await service.acceptInvite("invitee", fresh);
    expect((await service.snapshot("invitee", orgA)).membership.role).toBe(
      "viewer",
    );
  });
  it("rejects owner invitations, existing members and invalid tokens", async () => {
    await expect(
      service.invite("owner", orgA, {
        email: "invitee@example.com",
        role: "owner",
      }),
    ).rejects.toThrow();
    await expect(
      service.invite("owner", orgA, {
        email: "member@example.com",
        role: "member",
      }),
    ).rejects.toThrow("already a member");
    await expect(service.acceptInvite("invitee", "bad")).rejects.toThrow();
  });
  it("prevents admins from revoking owner-issued admin invitations", async () => {
    await service.invite("owner", orgA, {
      email: "invitee@example.com",
      role: "admin",
    });
    const invite = (await service.snapshot("owner", orgA)).invitations[0];
    await expect(
      service.revokeInvite("admin", orgA, invite.id),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
describe("workspace deletion and invitation inbox", () => {
  it("allows only the owner to delete a workspace after exact confirmation", async () => {
    const records = await work();
    await work(orgB, "other");
    await service.invite("owner", orgA, {
      email: "invitee@example.com",
      role: "member",
    });
    await expect(
      service.deleteOrganization("admin", orgA, "ArzCore"),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      service.deleteOrganization("owner", orgA, "Wrong"),
    ).rejects.toThrow("exact workspace name");
    expect((await service.snapshot("owner", orgA)).tasks[0].id).toBe(
      records.task.id,
    );
    await service.deleteOrganization("owner", orgA, "ArzCore");
    expect(await service.listOrganizations("owner")).toHaveLength(0);
    expect((await service.snapshot("other", orgB)).clients).toHaveLength(1);
    await expect(service.snapshot("owner", orgA)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("shows invitations only to the matching signed-in email", async () => {
    await service.invite("owner", orgA, {
      email: "INVITEE@example.com",
      role: "viewer",
    });
    expect(await service.listPendingInvitations("other")).toHaveLength(0);
    const pending = await service.listPendingInvitations("invitee");
    expect(pending).toHaveLength(1);
    expect(pending[0].organizationName).toBe("ArzCore");
    expect(pending[0].role).toBe("viewer");
    await expect(
      service.respondToInvitation("other", pending[0].id, "accept"),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    const joined = await service.respondToInvitation(
      "invitee",
      pending[0].id,
      "accept",
    );
    expect(joined).toBe(orgA);
    expect((await service.snapshot("invitee", orgA)).membership.role).toBe(
      "viewer",
    );
    expect(await service.listPendingInvitations("invitee")).toHaveLength(0);
    await expect(
      service.respondToInvitation("invitee", pending[0].id, "accept"),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows invitee to decline and hides revoked or expired invitations", async () => {
    await service.invite("owner", orgA, {
      email: "invitee@example.com",
      role: "member",
    });
    const [pending] = await service.listPendingInvitations("invitee");
    await service.respondToInvitation("invitee", pending.id, "decline");
    expect(await service.listPendingInvitations("invitee")).toHaveLength(0);
    await expect(service.snapshot("invitee", orgA)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await service.invite("owner", orgA, {
      email: "invitee@example.com",
      role: "member",
    });
    await database.db
      .update(invitations)
      .set({ expiresAt: new Date(Date.now() - 1000) });
    expect(await service.listPendingInvitations("invitee")).toHaveLength(0);
  });
});
describe("input validation", () => {
  it("rejects blank names, bad email addresses, invalid calendar dates and statuses", async () => {
    await expect(
      service.createOrganization("owner", { name: "   " }),
    ).rejects.toThrow();
    await expect(
      service.saveClient("owner", orgA, {
        name: "Example client",
        email: "bad",
      }),
    ).rejects.toThrow();
    const a = await work();
    await expect(
      service.saveProject("owner", orgA, {
        name: "x",
        clientId: a.client.id,
        dueDate: "2026-02-30",
      }),
    ).rejects.toThrow();
    await expect(
      service.saveTask("owner", orgA, {
        title: "x",
        projectId: a.project.id,
        status: "root",
      }),
    ).rejects.toThrow();
  });
});

describe("quick task status changes", () => {
  it("updates progress without overwriting task details", async () => {
    const { task } = await work();
    const updated = await service.setTaskStatus(
      "member",
      orgA,
      task.id,
      "done",
    );
    expect(updated).toEqual({ ...task, status: "done" });
    expect((await service.snapshot("owner", orgA)).stats.completedTasks).toBe(
      1,
    );
  });
  it("rejects viewers, cross-tenant IDs and invalid status values", async () => {
    const { task } = await work();
    await expect(
      service.setTaskStatus("viewer", orgA, task.id, "done"),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      service.setTaskStatus("other", orgB, task.id, "done"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      service.setTaskStatus("owner", orgA, task.id, "unknown"),
    ).rejects.toThrow();
    expect((await service.snapshot("owner", orgA)).tasks[0].status).toBe(
      "todo",
    );
  });
});

describe("workspace settings and project progress", () => {
  it("lets only the owner rename the current workspace without changing its records", async () => {
    const records = await work();
    await service.renameOrganization("owner", orgA, {
      name: "  ArzCore Studio  ",
    });
    const current = await service.snapshot("owner", orgA);
    expect(current.organization.name).toBe("ArzCore Studio");
    expect(current.clients[0].id).toBe(records.client.id);
    expect(current.projects[0].id).toBe(records.project.id);
    expect(current.tasks[0].id).toBe(records.task.id);
    for (const person of ["admin", "member", "viewer", "other"]) {
      await expect(
        service.renameOrganization(person, orgA, { name: "Changed" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    await expect(
      service.renameOrganization("owner", orgA, { name: " " }),
    ).rejects.toThrow();
    expect((await service.snapshot("owner", orgA)).organization.name).toBe(
      "ArzCore Studio",
    );
  });
  it("changes project progress without overwriting details or crossing workspaces", async () => {
    const { project } = await work();
    const updated = await service.setProjectStatus(
      "member",
      orgA,
      project.id,
      "completed",
    );
    expect(updated).toEqual({ ...project, status: "completed" });
    await expect(
      service.setProjectStatus("viewer", orgA, project.id, "active"),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      service.setProjectStatus("other", orgB, project.id, "active"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      service.setProjectStatus("owner", orgA, project.id, "bad"),
    ).rejects.toThrow();
  });
});
