import { z } from "zod";
import {
  clientInput,
  projectInput,
  taskInput,
  organizationInput,
  taskStatusInput,
  projectStatusInput,
} from "../workspace/validation";
import type { WorkspaceSnapshot } from "../workspace/service";
const id = z.string().min(1).max(150);
const stamp = z.iso.datetime();
const record = { id, organizationId: id, createdAt: stamp };
export const localStateSchema = z
  .object({
    format: z.literal("arzdesk-local"),
    version: z.literal(1),
    organizations: z.array(organizationInput.extend({ id, createdAt: stamp })),
    clients: z.array(clientInput.extend(record)),
    projects: z.array(projectInput.extend(record)),
    tasks: z.array(taskInput.extend(record)),
  })
  .strict()
  .superRefine((s, ctx) => {
    const unique = (rows: { id: string }[], path: string) => {
      if (new Set(rows.map((r) => r.id)).size !== rows.length)
        ctx.addIssue({
          code: "custom",
          message: `Duplicate ${path} IDs.`,
          path: [path],
        });
    };
    unique(s.organizations, "organizations");
    unique(s.clients, "clients");
    unique(s.projects, "projects");
    unique(s.tasks, "tasks");
    const all = [...s.organizations, ...s.clients, ...s.projects, ...s.tasks];
    if (new Set(all.map((r) => r.id)).size !== all.length)
      ctx.addIssue({
        code: "custom",
        message: "Record IDs must be unique across the backup.",
      });
    const orgs = new Set(s.organizations.map((o) => o.id));
    if (
      [...s.clients, ...s.projects, ...s.tasks].some(
        (r) => !orgs.has(r.organizationId),
      ) ||
      s.projects.some(
        (p) =>
          !s.clients.some(
            (c) => c.id === p.clientId && c.organizationId === p.organizationId,
          ),
      ) ||
      s.tasks.some(
        (t) =>
          !s.projects.some(
            (p) =>
              p.id === t.projectId && p.organizationId === t.organizationId,
          ),
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "The backup has broken workspace, client or project links.",
      });
  });
export type LocalState = z.infer<typeof localStateSchema>;
export const emptyState = (): LocalState => ({
  format: "arzdesk-local",
  version: 1,
  organizations: [],
  clients: [],
  projects: [],
  tasks: [],
});
export function applyLocalAction(
  state: LocalState,
  action: string,
  orgId: string,
  input: Record<string, string>,
) {
  const s = structuredClone(state);
  const newId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  if (action === "organization.create") {
    s.organizations.push({
      ...organizationInput.parse(input),
      id: newId,
      createdAt,
    });
    return { state: s, id: newId };
  }
  const org = s.organizations.find((o) => o.id === orgId);
  if (!org) throw new Error("Workspace not found on this device.");
  const within = <T extends { id: string; organizationId: string }>(
    rows: T[],
  ) => {
    const row = rows.find(
      (r) => r.id === input.id && r.organizationId === orgId,
    );
    if (!row) throw new Error("This record no longer exists. Reopen the page.");
    return row;
  };
  const identity = { id: newId, organizationId: orgId, createdAt };
  switch (action) {
    case "organization.rename":
      org.name = organizationInput.parse(input).name;
      break;
    case "client.save": {
      const values = clientInput.parse(input);
      if (input.id) Object.assign(within(s.clients), values);
      else s.clients.unshift({ ...identity, ...values });
      break;
    }
    case "project.save": {
      const values = projectInput.parse(input);
      if (
        !s.clients.some(
          (c) => c.id === values.clientId && c.organizationId === orgId,
        )
      )
        throw new Error("Choose a client from this workspace.");
      if (input.id) Object.assign(within(s.projects), values);
      else s.projects.unshift({ ...identity, ...values });
      break;
    }
    case "task.save": {
      const values = taskInput.parse(input);
      if (
        !s.projects.some(
          (p) => p.id === values.projectId && p.organizationId === orgId,
        )
      )
        throw new Error("Choose a project from this workspace.");
      if (input.id) Object.assign(within(s.tasks), values);
      else s.tasks.unshift({ ...identity, ...values });
      break;
    }
    case "client.delete": {
      const row = within(s.clients);
      if (s.projects.some((p) => p.clientId === row.id))
        throw new Error("Delete this client's projects first.");
      s.clients = s.clients.filter((c) => c.id !== row.id);
      break;
    }
    case "project.delete": {
      const row = within(s.projects);
      s.tasks = s.tasks.filter((t) => t.projectId !== row.id);
      s.projects = s.projects.filter((p) => p.id !== row.id);
      break;
    }
    case "task.delete": {
      const row = within(s.tasks);
      s.tasks = s.tasks.filter((t) => t.id !== row.id);
      break;
    }
    case "task.status":
      within(s.tasks).status = taskStatusInput.parse(input.status);
      break;
    case "project.status":
      within(s.projects).status = projectStatusInput.parse(input.status);
      break;
    default:
      throw new Error(
        "Team accounts and invitations need the online workspace.",
      );
  }
  return { state: s, id: input.id ?? newId };
}
export function importLocalBackup(
  current: LocalState,
  source: unknown,
): LocalState {
  const incoming = localStateSchema.parse(source);
  const ids = new Map<string, string>();
  for (const rows of [
    incoming.organizations,
    incoming.clients,
    incoming.projects,
    incoming.tasks,
  ])
    for (const r of rows) ids.set(r.id, crypto.randomUUID());
  const remap = (v: string) => ids.get(v)!;
  return localStateSchema.parse({
    ...current,
    organizations: [
      ...current.organizations,
      ...incoming.organizations.map((o) => ({ ...o, id: remap(o.id) })),
    ],
    clients: [
      ...current.clients,
      ...incoming.clients.map((c) => ({
        ...c,
        id: remap(c.id),
        organizationId: remap(c.organizationId),
      })),
    ],
    projects: [
      ...current.projects,
      ...incoming.projects.map((p) => ({
        ...p,
        id: remap(p.id),
        organizationId: remap(p.organizationId),
        clientId: remap(p.clientId),
      })),
    ],
    tasks: [
      ...current.tasks,
      ...incoming.tasks.map((t) => ({
        ...t,
        id: remap(t.id),
        organizationId: remap(t.organizationId),
        projectId: remap(t.projectId),
      })),
    ],
  });
}
export function localSnapshot(s: LocalState, orgId: string): WorkspaceSnapshot {
  const org = s.organizations.find((o) => o.id === orgId)!;
  const rows = <T extends { organizationId: string; createdAt: string }>(
    rs: T[],
  ) =>
    rs
      .filter((r) => r.organizationId === orgId)
      .map((r) => ({ ...r, createdAt: new Date(r.createdAt) }));
  const clients = rows(s.clients),
    projects = rows(s.projects),
    tasks = rows(s.tasks);
  return {
    organization: { ...org, createdAt: new Date(org.createdAt) },
    membership: {
      organizationId: orgId,
      userId: "local",
      role: "owner",
      createdAt: new Date(org.createdAt),
    },
    clients,
    projects,
    tasks,
    people: [],
    invitations: [],
    stats: {
      clients: clients.length,
      activeProjects: projects.filter((p) => p.status === "active").length,
      openTasks: tasks.filter((t) => t.status !== "done").length,
      completedTasks: tasks.filter((t) => t.status === "done").length,
    },
  };
}
