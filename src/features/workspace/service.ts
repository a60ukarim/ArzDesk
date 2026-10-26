import { randomBytes, createHash, randomUUID } from "node:crypto";
import { and, eq, desc, sql, isNull, gt } from "drizzle-orm";
import type { Database } from "@/lib/db";
import {
  organizations,
  members,
  clients,
  projects,
  tasks,
  invitations,
  user,
} from "@/lib/db/schema";
import {
  authorize,
  WorkspaceError,
  type Permission,
  type Role,
} from "./policy";
import {
  organizationInput,
  clientInput,
  projectInput,
  taskInput,
  taskStatusInput,
  projectStatusInput,
  invitationInput,
} from "./validation";
type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];
const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function createWorkspaceService(db: Database) {
  // Resolve membership from the database on EVERY operation. Never trust a cookie's role.
  async function access(
    tx: Tx | Database,
    userId: string,
    orgId: string,
    permission: Permission,
  ) {
    const [member] = await tx
      .select()
      .from(members)
      .where(and(eq(members.organizationId, orgId), eq(members.userId, userId)))
      .limit(1);
    authorize(member?.role, permission);
    return member!;
  }
  async function write<T>(
    userId: string,
    orgId: string,
    permission: Permission,
    work: (tx: Tx, role: Role) => Promise<T>,
  ) {
    return db.transaction(async (tx) => {
      // Serialize membership changes with writes, preventing revocation/write races.
      await tx
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .for("update");
      const member = await access(tx, userId, orgId, permission);
      return work(tx, member.role);
    });
  }
  async function snapshot(userId: string, orgId: string) {
    // A short transaction also keeps related dashboard queries coherent.
    return db.transaction(async (tx) => {
      await tx
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .for("share");
      const membership = await access(tx, userId, orgId, "read");
      const [organization] = await tx
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId));
      const clientRows = await tx
        .select()
        .from(clients)
        .where(eq(clients.organizationId, orgId))
        .orderBy(desc(clients.createdAt));
      const projectRows = await tx
        .select()
        .from(projects)
        .where(eq(projects.organizationId, orgId))
        .orderBy(desc(projects.createdAt));
      const taskRows = await tx
        .select()
        .from(tasks)
        .where(eq(tasks.organizationId, orgId))
        .orderBy(desc(tasks.createdAt));
      const people = await tx
        .select({
          userId: members.userId,
          role: members.role,
          name: user.name,
          email: user.email,
        })
        .from(members)
        .innerJoin(user, eq(members.userId, user.id))
        .where(eq(members.organizationId, orgId));
      const invites = ["owner", "admin"].includes(membership.role)
        ? await tx
            .select({
              id: invitations.id,
              email: invitations.email,
              role: invitations.role,
              expiresAt: invitations.expiresAt,
            })
            .from(invitations)
            .where(
              and(
                eq(invitations.organizationId, orgId),
                isNull(invitations.acceptedAt),
                isNull(invitations.revokedAt),
                gt(invitations.expiresAt, new Date()),
              ),
            )
        : [];
      return {
        organization,
        membership,
        clients: clientRows,
        projects: projectRows,
        tasks: taskRows,
        people,
        invitations: invites,
        stats: {
          clients: clientRows.length,
          activeProjects: projectRows.filter((p) => p.status === "active")
            .length,
          openTasks: taskRows.filter((t) => t.status !== "done").length,
          completedTasks: taskRows.filter((t) => t.status === "done").length,
        },
      };
    });
  }
  return {
    snapshot,
    async listOrganizations(userId: string) {
      return db
        .select({
          id: organizations.id,
          name: organizations.name,
          role: members.role,
        })
        .from(organizations)
        .innerJoin(
          members,
          and(
            eq(members.organizationId, organizations.id),
            eq(members.userId, userId),
          ),
        )
        .orderBy(organizations.createdAt);
    },
    async createOrganization(userId: string, input: unknown) {
      const data = organizationInput.parse(input);
      const id = randomUUID();
      await db.transaction(async (tx) => {
        await tx.insert(organizations).values({ id, ...data });
        await tx
          .insert(members)
          .values({ organizationId: id, userId, role: "owner" });
      });
      return id;
    },
    async renameOrganization(userId: string, orgId: string, input: unknown) {
      const data = organizationInput.parse(input);
      return write(userId, orgId, "manage-workspace", async (tx) => {
        const [row] = await tx
          .update(organizations)
          .set(data)
          .where(eq(organizations.id, orgId))
          .returning();
        if (!row) throw new WorkspaceError("Workspace not found.", "NOT_FOUND");
        return row;
      });
    },
    async deleteOrganization(
      userId: string,
      orgId: string,
      confirmation: string,
    ) {
      return write(userId, orgId, "manage-workspace", async (tx) => {
        const [org] = await tx
          .select({ id: organizations.id, name: organizations.name })
          .from(organizations)
          .where(eq(organizations.id, orgId));
        if (!org) throw new WorkspaceError("Workspace not found.", "NOT_FOUND");
        if (confirmation !== org.name)
          throw new WorkspaceError(
            "Enter the exact workspace name to confirm deletion.",
          );
        // Delete dependents in dependency order, including project->client RESTRICT.
        // The transaction guarantees all-or-nothing removal.
        await tx.delete(tasks).where(eq(tasks.organizationId, orgId));
        await tx.delete(projects).where(eq(projects.organizationId, orgId));
        await tx.delete(clients).where(eq(clients.organizationId, orgId));
        await tx
          .delete(invitations)
          .where(eq(invitations.organizationId, orgId));
        await tx.delete(members).where(eq(members.organizationId, orgId));
        await tx.delete(organizations).where(eq(organizations.id, orgId));
      });
    },
    async listPendingInvitations(userId: string) {
      return db
        .select({
          id: invitations.id,
          organizationId: invitations.organizationId,
          organizationName: organizations.name,
          role: invitations.role,
          expiresAt: invitations.expiresAt,
          createdAt: invitations.createdAt,
        })
        .from(invitations)
        .innerJoin(
          organizations,
          eq(organizations.id, invitations.organizationId),
        )
        .innerJoin(user, eq(sql`lower(${user.email})`, invitations.email))
        .where(
          and(
            eq(user.id, userId),
            isNull(invitations.acceptedAt),
            isNull(invitations.revokedAt),
            gt(invitations.expiresAt, new Date()),
          ),
        )
        .orderBy(desc(invitations.createdAt))
        .limit(40);
    },
    async respondToInvitation(
      userId: string,
      inviteId: string,
      decision: "accept" | "decline",
    ) {
      if (!/^[a-f0-9-]{36}$/.test(inviteId))
        throw new WorkspaceError("Invalid invitation.");
      return db.transaction(async (tx) => {
        const [lookup] = await tx
          .select({ orgId: invitations.organizationId })
          .from(invitations)
          .where(eq(invitations.id, inviteId));
        if (!lookup)
          throw new WorkspaceError("Invitation not found.", "NOT_FOUND");
        await tx
          .select({ id: organizations.id })
          .from(organizations)
          .where(eq(organizations.id, lookup.orgId))
          .for("update");
        const [invite] = await tx
          .select()
          .from(invitations)
          .where(
            and(
              eq(invitations.id, inviteId),
              isNull(invitations.acceptedAt),
              isNull(invitations.revokedAt),
              gt(invitations.expiresAt, new Date()),
            ),
          )
          .for("update");
        const [person] = await tx
          .select({ email: user.email })
          .from(user)
          .where(eq(user.id, userId));
        if (
          !invite ||
          !person ||
          person.email.toLowerCase() !== invite.email.toLowerCase()
        )
          throw new WorkspaceError(
            "Invitation not available for this account.",
            "FORBIDDEN",
          );
        if (decision === "accept") {
          await tx
            .insert(members)
            .values({
              organizationId: invite.organizationId,
              userId,
              role: invite.role,
            })
            .onConflictDoNothing();
          await tx
            .update(invitations)
            .set({ acceptedAt: new Date() })
            .where(eq(invitations.id, inviteId));
        } else {
          await tx
            .update(invitations)
            .set({ revokedAt: new Date() })
            .where(eq(invitations.id, inviteId));
        }
        return invite.organizationId;
      });
    },
    async setProjectStatus(
      userId: string,
      orgId: string,
      id: string,
      input: unknown,
    ) {
      const status = projectStatusInput.parse(input);
      return write(userId, orgId, "write", async (tx) => {
        const [row] = await tx
          .update(projects)
          .set({ status })
          .where(and(eq(projects.organizationId, orgId), eq(projects.id, id)))
          .returning();
        if (!row) throw new WorkspaceError("Project not found.", "NOT_FOUND");
        return row;
      });
    },
    async saveClient(
      userId: string,
      orgId: string,
      input: unknown,
      id?: string,
    ) {
      const data = clientInput.parse(input);
      return write(userId, orgId, "write", async (tx) => {
        if (id) {
          const [row] = await tx
            .update(clients)
            .set(data)
            .where(and(eq(clients.organizationId, orgId), eq(clients.id, id)))
            .returning();
          if (!row) throw new WorkspaceError("Client not found.", "NOT_FOUND");
          return row;
        }
        const [row] = await tx
          .insert(clients)
          .values({ id: randomUUID(), organizationId: orgId, ...data })
          .returning();
        return row;
      });
    },
    async deleteClient(userId: string, orgId: string, id: string) {
      return write(userId, orgId, "delete", async (tx) => {
        const [dependent] = await tx
          .select({ id: projects.id })
          .from(projects)
          .where(
            and(eq(projects.organizationId, orgId), eq(projects.clientId, id)),
          )
          .limit(1);
        if (dependent)
          throw new WorkspaceError(
            "Delete this client's projects before deleting the client.",
          );
        const rows = await tx
          .delete(clients)
          .where(and(eq(clients.organizationId, orgId), eq(clients.id, id)))
          .returning();
        if (!rows.length)
          throw new WorkspaceError("Client not found.", "NOT_FOUND");
      });
    },
    async saveProject(
      userId: string,
      orgId: string,
      input: unknown,
      id?: string,
    ) {
      const data = projectInput.parse(input);
      return write(userId, orgId, "write", async (tx) => {
        const [client] = await tx
          .select({ id: clients.id })
          .from(clients)
          .where(
            and(
              eq(clients.organizationId, orgId),
              eq(clients.id, data.clientId),
            ),
          )
          .limit(1);
        if (!client)
          throw new WorkspaceError(
            "Select a client from this workspace.",
            "NOT_FOUND",
          );
        if (id) {
          const [row] = await tx
            .update(projects)
            .set(data)
            .where(and(eq(projects.organizationId, orgId), eq(projects.id, id)))
            .returning();
          if (!row) throw new WorkspaceError("Project not found.", "NOT_FOUND");
          return row;
        }
        const [row] = await tx
          .insert(projects)
          .values({ id: randomUUID(), organizationId: orgId, ...data })
          .returning();
        return row;
      });
    },
    async deleteProject(userId: string, orgId: string, id: string) {
      return write(userId, orgId, "delete", async (tx) => {
        const rows = await tx
          .delete(projects)
          .where(and(eq(projects.organizationId, orgId), eq(projects.id, id)))
          .returning();
        if (!rows.length)
          throw new WorkspaceError("Project not found.", "NOT_FOUND");
      });
    },
    async saveTask(userId: string, orgId: string, input: unknown, id?: string) {
      const data = taskInput.parse(input);
      return write(userId, orgId, "write", async (tx) => {
        const [project] = await tx
          .select({ id: projects.id })
          .from(projects)
          .where(
            and(
              eq(projects.organizationId, orgId),
              eq(projects.id, data.projectId),
            ),
          )
          .limit(1);
        if (!project)
          throw new WorkspaceError(
            "Select a project from this workspace.",
            "NOT_FOUND",
          );
        if (id) {
          const [row] = await tx
            .update(tasks)
            .set(data)
            .where(and(eq(tasks.organizationId, orgId), eq(tasks.id, id)))
            .returning();
          if (!row) throw new WorkspaceError("Task not found.", "NOT_FOUND");
          return row;
        }
        const [row] = await tx
          .insert(tasks)
          .values({ id: randomUUID(), organizationId: orgId, ...data })
          .returning();
        return row;
      });
    },
    async setTaskStatus(
      userId: string,
      orgId: string,
      id: string,
      input: unknown,
    ) {
      const status = taskStatusInput.parse(input);
      return write(userId, orgId, "write", async (tx) => {
        const [row] = await tx
          .update(tasks)
          .set({ status })
          .where(and(eq(tasks.organizationId, orgId), eq(tasks.id, id)))
          .returning();
        if (!row) throw new WorkspaceError("Task not found.", "NOT_FOUND");
        return row;
      });
    },
    async deleteTask(userId: string, orgId: string, id: string) {
      return write(userId, orgId, "delete", async (tx) => {
        const rows = await tx
          .delete(tasks)
          .where(and(eq(tasks.organizationId, orgId), eq(tasks.id, id)))
          .returning();
        if (!rows.length)
          throw new WorkspaceError("Task not found.", "NOT_FOUND");
      });
    },
    async invite(userId: string, orgId: string, input: unknown) {
      const data = invitationInput.parse(input);
      const token = randomBytes(32).toString("hex");
      await write(userId, orgId, "invite", async (tx, role) => {
        if (role === "admin" && data.role === "admin")
          throw new WorkspaceError(
            "Only the owner can invite an admin.",
            "FORBIDDEN",
          );
        const [existing] = await tx
          .select({ id: user.id })
          .from(members)
          .innerJoin(user, eq(user.id, members.userId))
          .where(
            and(
              eq(members.organizationId, orgId),
              eq(sql`lower(${user.email})`, data.email),
            ),
          );
        if (existing)
          throw new WorkspaceError("This person is already a member.");
        // Reissuing an invitation invalidates all earlier links for this email.
        await tx
          .update(invitations)
          .set({ revokedAt: new Date() })
          .where(
            and(
              eq(invitations.organizationId, orgId),
              eq(invitations.email, data.email),
              isNull(invitations.acceptedAt),
              isNull(invitations.revokedAt),
            ),
          );
        await tx.insert(invitations).values({
          id: randomUUID(),
          organizationId: orgId,
          ...data,
          tokenHash: hash(token),
          expiresAt: new Date(Date.now() + 7 * 86400000),
        });
      });
      return token;
    },
    async acceptInvite(userId: string, token: string) {
      if (!/^[a-f0-9]{64}$/.test(token))
        throw new WorkspaceError("This invitation is invalid or expired.");
      return db.transaction(async (tx) => {
        const [lookup] = await tx
          .select({ orgId: invitations.organizationId })
          .from(invitations)
          .where(eq(invitations.tokenHash, hash(token)));
        if (!lookup)
          throw new WorkspaceError("This invitation is invalid or expired.");
        await tx
          .select()
          .from(organizations)
          .where(eq(organizations.id, lookup.orgId))
          .for("update");
        const [invite] = await tx
          .select()
          .from(invitations)
          .where(
            and(
              eq(invitations.tokenHash, hash(token)),
              isNull(invitations.acceptedAt),
              isNull(invitations.revokedAt),
              gt(invitations.expiresAt, new Date()),
            ),
          )
          .for("update");
        if (!invite)
          throw new WorkspaceError("This invitation is invalid or expired.");
        const [person] = await tx
          .select()
          .from(user)
          .where(eq(user.id, userId));
        if (!person || person.email.toLowerCase() !== invite.email)
          throw new WorkspaceError(
            "Sign in with the email address this invitation was sent to.",
            "FORBIDDEN",
          );
        // Existing membership is never upgraded or downgraded by an old invitation.
        await tx
          .insert(members)
          .values({
            organizationId: invite.organizationId,
            userId,
            role: invite.role,
          })
          .onConflictDoNothing();
        await tx
          .update(invitations)
          .set({ acceptedAt: new Date() })
          .where(eq(invitations.id, invite.id));
        return invite.organizationId;
      });
    },
    async revokeInvite(userId: string, orgId: string, id: string) {
      return write(userId, orgId, "invite", async (tx, role) => {
        const [invite] = await tx
          .select()
          .from(invitations)
          .where(
            and(eq(invitations.organizationId, orgId), eq(invitations.id, id)),
          );
        if (!invite)
          throw new WorkspaceError("Invitation not found.", "NOT_FOUND");
        if (role === "admin" && invite.role === "admin")
          throw new WorkspaceError(
            "Only the owner can revoke admin invitations.",
            "FORBIDDEN",
          );
        await tx
          .update(invitations)
          .set({ revokedAt: new Date() })
          .where(eq(invitations.id, id));
      });
    },
    async changeMember(
      userId: string,
      orgId: string,
      targetUserId: string,
      role: "admin" | "member" | "viewer" | "remove",
    ) {
      if (!["admin", "member", "viewer", "remove"].includes(role))
        throw new WorkspaceError("Invalid role.");
      return write(userId, orgId, "manage-members", async (tx) => {
        const where = and(
          eq(members.organizationId, orgId),
          eq(members.userId, targetUserId),
        );
        const [target] = await tx.select().from(members).where(where);
        if (!target) throw new WorkspaceError("Member not found.", "NOT_FOUND");
        if (target.role === "owner")
          throw new WorkspaceError(
            "The owner cannot be removed or demoted.",
            "FORBIDDEN",
          );
        if (role === "remove") await tx.delete(members).where(where);
        else await tx.update(members).set({ role }).where(where);
      });
    },
  };
}
export type WorkspaceSnapshot = Awaited<
  ReturnType<ReturnType<typeof createWorkspaceService>["snapshot"]>
>;
