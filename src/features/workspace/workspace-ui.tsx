"use client";
import { useState } from "react";
import { WorkspaceLink as Link } from "./runtime";
import { useWorkspaceRuntime } from "./runtime";
import {
  Users,
  FolderKanban,
  ListTodo,
  ChevronRight,
  ArrowUpRight,
  Search,
  Check,
  Plus,
  CircleCheck,
  ArrowRight,
  Folder,
  Shield,
  X,
} from "lucide-react";
import { DeveloperCredits } from "@/components/developer-credits";
import { Button } from "@/components/ui/button";
import { EntityDialog, type Field } from "./entity-dialog";
import { workflowExample } from "./examples";
import { can } from "./policy";
import { WorkspaceSettings } from "./workspace-settings";
import { ProjectStatusControl } from "./task-status-control";
import { TaskStatusControl } from "./task-status-control";
import type { WorkspaceSnapshot } from "./service";

export type Section =
  "overview" | "clients" | "projects" | "tasks" | "team" | "settings";
const label = (s: string) =>
  s === "todo"
    ? "To do"
    : s.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
function Badge({ value }: { value: string }) {
  return <span className={`badge badge-${value}`}>{label(value)}</span>;
}
function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="empty">
      <Folder size={27} />
      <h3>{title}</h3>
      <p>{detail}</p>
    </div>
  );
}
function date(value: string | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
const clientFields: Field[] = [
  {
    name: "name",
    label: "Client name",
    required: true,
    placeholder: `e.g. ${workflowExample.client}`,
    hint: "The person or business you are working for.",
  },
  { name: "email", label: "Email address", type: "email", maxLength: 254 },
  {
    name: "company",
    label: "Company",
    advanced: true,
    full: true,
    placeholder: "Business name (optional)",
  },
  {
    name: "notes",
    label: "Notes",
    type: "textarea",
    full: true,
    advanced: true,
  },
];
function recordValues(row: object) {
  return Object.fromEntries(
    Object.entries(row)
      .filter(([, v]) => typeof v === "string")
      .map(([k, v]) => [k, String(v)]),
  );
}
export function WorkspaceUI({
  data,
  section,
  context = {},
}: {
  data: WorkspaceSnapshot;
  section: Section;
  context?: { clientId?: string; projectId?: string };
}) {
  const { router, local } = useWorkspaceRuntime();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const orgId = data.organization.id;
  const role = data.membership.role;
  const writable = can(role, "write");
  const deletable = can(role, "delete");
  const invitable = can(role, "invite");
  const base = local?.base ?? `/w/${orgId}`;
  const selectedClient = data.clients.find((c) => c.id === context.clientId);
  const selectedProject = data.projects.find((p) => p.id === context.projectId);
  const setupComplete =
    data.clients.length > 0 &&
    data.projects.length > 0 &&
    data.tasks.length > 0;
  const nextStep =
    data.clients.length === 0
      ? "clients"
      : data.projects.length === 0
        ? "projects"
        : "tasks";
  const nextStepCopy = {
    clients: {
      title: "Add your first client",
      detail: `Start with the person or business you work for. Example: ${workflowExample.client}.`,
    },
    projects: {
      title: "Create your first project",
      detail: `Name the job you are delivering for this client. Example: ${workflowExample.project}.`,
    },
    tasks: {
      title: "Add your first task",
      detail: `Break the project into one action. Example: ${workflowExample.task}.`,
    },
  }[nextStep];
  const activeContext =
    section === "projects"
      ? selectedClient?.name
      : section === "tasks"
        ? selectedProject?.name
        : undefined;
  const clientName = (id: string) =>
    data.clients.find((c) => c.id === id)?.name ?? "Client";
  const projectName = (id: string) =>
    data.projects.find((p) => p.id === id)?.name ?? "Project";
  const progress = (id: string) => {
    const rows = data.tasks.filter((t) => t.projectId === id);
    return rows.length
      ? Math.round(
          (100 * rows.filter((t) => t.status === "done").length) / rows.length,
        )
      : 0;
  };
  const projectFields: Field[] = [
    {
      name: "name",
      label: "Project name",
      required: true,
      placeholder: `e.g. ${workflowExample.project}`,
      hint: "The overall job you will deliver to your client.",
    },
    {
      name: "clientId",
      label: "Client",
      hint: "Who is this project for? Choose an existing client.",
      defaultValue:
        selectedClient?.id ??
        (data.clients.length === 1 ? data.clients[0].id : undefined),
      type: "select",
      required: true,
      options: data.clients.map((c) => ({ value: c.id, label: c.name })),
    },
    {
      name: "status",
      label: "Status",
      advanced: true,
      type: "select",
      defaultValue: "planned",
      options: ["planned", "active", "completed"].map((v) => ({
        value: v,
        label: label(v),
      })),
    },
    {
      name: "dueDate",
      label: "Due date",
      advanced: true,
      type: "date",
      hint: "Choose the planned finish date, or leave it empty.",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      full: true,
      advanced: true,
    },
  ];
  const taskFields: Field[] = [
    {
      name: "title",
      label: "Task title",
      required: true,
      full: true,
      placeholder: `e.g. ${workflowExample.task}`,
      hint: "Write one specific action to complete, rather than the whole project name.",
    },
    {
      name: "projectId",
      label: "Project",
      hint: "Which project does this task belong to?",
      defaultValue:
        selectedProject?.id ??
        (data.projects.length === 1 ? data.projects[0].id : undefined),
      type: "select",
      required: true,
      options: data.projects.map((p) => ({ value: p.id, label: p.name })),
    },
    {
      name: "status",
      label: "Status",
      advanced: true,
      type: "select",
      defaultValue: "todo",
      hint: "To do: not started. In progress: working on it. Done: finished.",
      options: ["todo", "in_progress", "done"].map((v) => ({
        value: v,
        label: label(v),
      })),
    },
    {
      name: "priority",
      label: "Priority",
      advanced: true,
      type: "select",
      defaultValue: "medium",
      hint: "High: urgent. Medium: normal. Low: can wait.",
      options: ["low", "medium", "high"].map((v) => ({
        value: v,
        label: label(v),
      })),
    },
    {
      name: "dueDate",
      label: "Due date",
      advanced: true,
      type: "date",
      hint: "Choose the planned finish date, or leave it empty.",
    },
  ];
  const matches = (value: string) =>
    value.toLowerCase().includes(search.toLowerCase().trim());
  const filteredClients = data.clients.filter((c) =>
    matches(`${c.name} ${c.company ?? ""} ${c.email ?? ""}`),
  );
  const filteredProjects = data.projects.filter(
    (p) =>
      matches(`${p.name} ${clientName(p.clientId)}`) &&
      (filter === "all" || p.status === filter) &&
      (!selectedClient || p.clientId === selectedClient.id),
  );
  const filteredTasks = data.tasks.filter(
    (t) =>
      matches(`${t.title} ${projectName(t.projectId)}`) &&
      (filter === "all" || t.status === filter) &&
      (!selectedProject || t.projectId === selectedProject.id),
  );
  const titles: Record<Section, { title: string; description: string }> = {
    overview: {
      title:
        !setupComplete && writable
          ? "Let’s set up your workspace"
          : "Your work at a glance",
      description:
        !setupComplete && writable
          ? "Follow the steps below to organize your first job."
          : "See what needs to be done and keep your projects moving.",
    },
    clients: {
      title: "Clients",
      description:
        "Add the people or businesses you work for, then create their projects.",
    },
    projects: {
      title: activeContext ? `${activeContext} — projects` : "Projects",
      description:
        "Create a project for a client. Progress increases when its tasks are marked Done.",
    },
    tasks: {
      title: activeContext ? `${activeContext} — tasks` : "Tasks",
      description:
        "Add a specific task, choose its project, and update its status as you work.",
    },
    settings: {
      title: "Workspace settings",
      description: "Update the workspace name and manage access.",
    },
    team: {
      title: "Your team",
      description:
        "Invite people to your workspace and choose what they can access.",
    },
  };
  function addButton() {
    if (!writable || section === "settings") return null;
    if (
      section === "clients" ||
      (section === "overview" && data.clients.length === 0)
    )
      return (
        <EntityDialog
          orgId={orgId}
          action="client.save"
          title="Add client"
          fields={clientFields}
        />
      );
    if (
      section === "tasks" ||
      (section === "overview" && data.projects.length > 0)
    )
      return data.projects.length ? (
        <EntityDialog
          orgId={orgId}
          action="task.save"
          title="Add task"
          fields={taskFields}
        />
      ) : (
        <Button asChild>
          <Link
            href={`${base}/${data.clients.length ? "projects" : "clients"}`}
          >
            <Plus size={15} />
            {data.clients.length
              ? "Create a project first"
              : "Add a client first"}
          </Link>
        </Button>
      );
    if (section === "team")
      return invitable ? (
        <EntityDialog
          orgId={orgId}
          action="invite.create"
          title="Invite member"
          description="Create a private invitation link. Only the person with the matching email can accept it."
          fields={[
            {
              name: "email",
              label: "Email address",
              type: "email",
              required: true,
              maxLength: 254,
              full: true,
            },
            {
              name: "role",
              label: "Workspace role",
              type: "select",
              defaultValue: "member",
              full: true,
              options: (role === "owner"
                ? ["admin", "member", "viewer"]
                : ["member", "viewer"]
              ).map((v) => ({
                value: v,
                label: `${label(v)} — ${v === "viewer" ? "Can only view" : v === "admin" ? "Can manage work and members" : "Can add and edit work"}`,
              })),
            },
          ]}
        />
      ) : null;
    return data.clients.length ? (
      <EntityDialog
        orgId={orgId}
        action="project.save"
        title="New project"
        fields={projectFields}
      />
    ) : (
      <Button asChild>
        <Link href={`${base}/clients`}>
          <Plus size={15} />
          Add your first client
        </Link>
      </Button>
    );
  }
  function actions(
    entity: "client" | "project" | "task",
    row: object,
    fields: Field[],
  ) {
    const values = recordValues(row);
    return (
      <div className="row-actions">
        {writable && (
          <EntityDialog
            orgId={orgId}
            action={`${entity}.save`}
            title={`Edit ${entity}`}
            label={`Edit ${values.name ?? values.title}`}
            kind="edit"
            values={values}
            fields={fields}
          />
        )}{" "}
        {deletable && (
          <EntityDialog
            orgId={orgId}
            action={`${entity}.delete`}
            title={`Delete ${entity}?`}
            label={`Delete ${values.name ?? values.title}`}
            kind="delete"
            values={{ id: values.id }}
            description={
              entity === "project"
                ? "This permanently deletes the project and all its tasks."
                : entity === "client"
                  ? "This permanently deletes the client. Clients with projects cannot be deleted."
                  : "This permanently deletes the task."
            }
          />
        )}
      </div>
    );
  }
  const projectTable = (
    rows: WorkspaceSnapshot["projects"],
    overview = false,
  ) => (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Project name</th>
            <th>Status</th>
            <th>Progress</th>
            {!overview && <th>Due date</th>}
            <th>{overview ? "" : "Manage"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td data-label="Project" className="row-title">
                <div className="entity-name">
                  <span className="entity-icon">
                    <FolderKanban size={14} />
                  </span>
                  <div>
                    <Link
                      className="record-link"
                      href={`${base}/tasks?project=${p.id}`}
                    >
                      {p.name}
                      <ChevronRight size={14} />
                    </Link>
                    <small>{clientName(p.clientId)}</small>
                  </div>
                </div>
              </td>
              <td data-label="Status">
                {writable ? (
                  <ProjectStatusControl
                    orgId={orgId}
                    id={p.id}
                    title={p.name}
                    status={p.status}
                  />
                ) : (
                  <Badge value={p.status} />
                )}
              </td>
              <td data-label="Progress">
                <div
                  className="progress-label"
                  title="Progress is based on tasks marked Done. Open the project’s tasks to update them."
                >
                  <div className="progress">
                    <span style={{ width: `${progress(p.id)}%` }} />
                  </div>
                  {progress(p.id)}%
                </div>
              </td>
              {!overview && (
                <td data-label="Due date" className="muted">
                  {date(p.dueDate)}
                </td>
              )}
              <td data-label="Actions">
                {overview ? (
                  <Link
                    className="text-action"
                    href={`${base}/tasks?project=${p.id}`}
                  >
                    Open tasks <ArrowRight size={14} />
                  </Link>
                ) : (
                  <div className="record-actions">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`${base}/tasks?project=${p.id}`}>
                        Open tasks <ArrowRight size={14} />
                      </Link>
                    </Button>
                    {actions("project", p, projectFields)}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <main
      id="main-content"
      className={`page-content section-${section}${section === "overview" && (setupComplete || !writable) ? " overview-ready" : ""}`}
    >
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {section === "overview" ? "YOUR WORKSPACE" : label(section)}
          </span>
          <h1 style={{ marginTop: 8 }}>{titles[section].title}</h1>
          <p>{titles[section].description}</p>
        </div>
        <div className="heading-actions">
          {section === "overview" && !setupComplete ? null : addButton()}
        </div>
      </div>
      {writable && section === "overview" && !setupComplete && (
        <section className="setup-panel" aria-label="Getting started">
          <div className="setup-panel-copy">
            <span className="setup-step">
              STEP{" "}
              {nextStep === "clients" ? 1 : nextStep === "projects" ? 2 : 3} OF
              3
            </span>
            <h2>{nextStepCopy.title}</h2>
            <p>{nextStepCopy.detail}</p>
          </div>
          <div className="setup-cta">{addButton()}</div>
          <ol className="setup-progress">
            {[
              {
                id: "clients",
                title: "Client",
                example: workflowExample.client,
                done: data.clients.length > 0,
              },
              {
                id: "projects",
                title: "Project",
                example: workflowExample.project,
                done: data.projects.length > 0,
              },
              {
                id: "tasks",
                title: "Task",
                example: workflowExample.task,
                done: data.tasks.length > 0,
              },
            ].map((step, i) => (
              <li
                key={step.id}
                className={
                  step.done ? "complete" : nextStep === step.id ? "current" : ""
                }
              >
                <span>{step.done ? <Check size={16} /> : i + 1}</span>
                <div>
                  <strong>{step.title}</strong>
                  <small>{step.example}</small>
                </div>
              </li>
            ))}
          </ol>
          <p className="setup-help">
            Use the blue button above to complete this step. We’ll show you the
            next one.
          </p>
        </section>
      )}
      {section !== "overview" &&
        section !== "team" &&
        section !== "settings" && (
          <nav className="work-path" aria-label="Work flow">
            <Link
              href={`${base}/clients`}
              aria-current={section === "clients" ? "step" : undefined}
            >
              <span>1</span> Clients
            </Link>
            <ChevronRight size={14} />
            <Link
              href={`${base}/projects${selectedProject ? `?client=${selectedProject.clientId}` : selectedClient ? `?client=${selectedClient.id}` : ""}`}
              aria-current={section === "projects" ? "step" : undefined}
            >
              <span>2</span> Projects
            </Link>
            <ChevronRight size={14} />
            <Link
              href={`${base}/tasks${selectedProject ? `?project=${selectedProject.id}` : ""}`}
              aria-current={section === "tasks" ? "step" : undefined}
            >
              <span>3</span> Tasks
            </Link>
          </nav>
        )}
      {activeContext && (
        <div className="context-strip">
          <span>
            Showing {section} for <strong>{activeContext}</strong>
          </span>
          <Link href={`${base}/${section}`}>
            Show all {section} <X size={14} />
          </Link>
        </div>
      )}
      {role === "viewer" && (
        <p className="notice">
          You have viewer access. Your workspace is available in read-only mode.
        </p>
      )}
      {section === "overview" && (setupComplete || !writable) && (
        <>
          <section className="metrics" aria-label="Workspace statistics">
            {[
              {
                name: "Total clients",
                tone: "clients",
                value: data.stats.clients,
                note: "People and businesses you work for",
                icon: Users,
              },
              {
                name: "Active projects",
                tone: "projects",
                value: data.stats.activeProjects,
                note: "Projects currently being worked on",
                icon: FolderKanban,
              },
              {
                name: "Open tasks",
                tone: "open",
                value: data.stats.openTasks,
                note: "Tasks still to finish",
                icon: ListTodo,
              },
              {
                name: "Completed tasks",
                tone: "completed",
                value: data.stats.completedTasks,
                note: "Tasks marked as done",
                icon: CircleCheck,
              },
            ].map((m) => (
              <article className={`metric metric-${m.tone}`} key={m.name}>
                <div className="metric-top">
                  <span>{m.name}</span>
                  <span className="metric-icon">
                    <m.icon size={15} />
                  </span>
                </div>
                <p className="metric-value">
                  {m.value.toString().padStart(2, "0")}
                </p>
                <p className="metric-note">{m.note}</p>
              </article>
            ))}
          </section>
          {writable && (
            <section className="daily-flow" aria-label="Your next step">
              <div>
                <span className="eyebrow">YOUR DAILY WORKFLOW</span>
                <h2>
                  {data.stats.openTasks > 0
                    ? "Ready to start working?"
                    : "All tasks done. Plan your next step."}
                </h2>
                <p>
                  Open a task and set it to <strong>In progress</strong>. Do the
                  work in your usual tools, then mark it <strong>Done</strong>{" "}
                  here. Your progress updates in this workspace.
                </p>
              </div>
              <Button asChild>
                <Link href={`${base}/tasks`}>
                  Open my tasks <ArrowRight size={16} />
                </Link>
              </Button>
            </section>
          )}
          <div className="dashboard-grid">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Recent projects</h2>
                  <p>Open a project to see its tasks.</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`${base}/projects`}>
                    View all <ArrowUpRight size={12} />
                  </Link>
                </Button>
              </div>
              {data.projects.length ? (
                <div className="project-summaries">
                  {data.projects.slice(0, 5).map((p) => (
                    <article className="project-summary" key={p.id}>
                      <div>
                        <Link
                          className="record-link"
                          href={`${base}/tasks?project=${p.id}`}
                        >
                          {p.name}
                          <ChevronRight size={14} />
                        </Link>
                        <small>{clientName(p.clientId)}</small>
                      </div>
                      {writable ? (
                        <ProjectStatusControl
                          orgId={orgId}
                          id={p.id}
                          title={p.name}
                          status={p.status}
                        />
                      ) : (
                        <Badge value={p.status} />
                      )}
                      <div className="project-summary-progress">
                        <div className="progress">
                          <span style={{ width: `${progress(p.id)}%` }} />
                        </div>
                        <span>
                          {
                            data.tasks.filter(
                              (t) =>
                                t.projectId === p.id && t.status === "done",
                            ).length
                          }
                          /
                          {
                            data.tasks.filter((t) => t.projectId === p.id)
                              .length
                          }{" "}
                          tasks done
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <Empty
                  title="No projects yet"
                  detail="Start by adding a client, then create a project for them."
                />
              )}
              <div className="panel-footer">
                <span>
                  {data.projects.length}{" "}
                  {data.projects.length === 1 ? "project" : "projects"} in your
                  workspace
                </span>
                <span>Updated from your workspace</span>
              </div>
            </section>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Tasks to finish</h2>
                  <p>Start a task, update its status, and see what is left.</p>
                </div>
                <Link href={`${base}/tasks`} aria-label="View all tasks">
                  <ArrowUpRight size={16} />
                </Link>
              </div>
              {data.tasks.some((t) => t.status !== "done") ? (
                <div className="task-list">
                  {[...data.tasks]
                    .filter((t) => t.status !== "done")
                    .sort((a, b) =>
                      (a.dueDate || "9999").localeCompare(b.dueDate || "9999"),
                    )
                    .slice(0, 5)
                    .map((t) => (
                      <div className="task-row" key={t.id}>
                        <span className="check-circle" />
                        <div>
                          <Link
                            className="record-link"
                            href={`${base}/tasks?project=${t.projectId}`}
                          >
                            {t.title}
                          </Link>
                          <small>
                            {projectName(t.projectId)} · {date(t.dueDate)}
                          </small>
                        </div>
                        {writable ? (
                          <TaskStatusControl
                            orgId={orgId}
                            id={t.id}
                            title={t.title}
                            status={t.status}
                          />
                        ) : (
                          <Badge value={t.status} />
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <Empty
                  title="No unfinished tasks"
                  detail="There are no open tasks. Add a task to plan your next step."
                />
              )}
            </section>
          </div>
        </>
      )}
      {section !== "overview" &&
        section !== "team" &&
        section !== "settings" && (
          <div className="toolbar">
            <div className="search">
              <Search size={15} />
              <label className="sr-only" htmlFor="entity-search">
                Search {section}
              </label>
              <input
                id="entity-search"
                placeholder={`Search ${section}…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {section !== "clients" && (
              <div className="toolbar-filters">
                {section === "tasks" && data.projects.length > 0 && (
                  <div className="toolbar-filter">
                    <label htmlFor="project-filter">Project</label>
                    <select
                      id="project-filter"
                      value={selectedProject?.id ?? "all"}
                      onChange={(e) =>
                        router.push(
                          e.target.value === "all"
                            ? `${base}/tasks`
                            : `${base}/tasks?project=${e.target.value}`,
                        )
                      }
                    >
                      <option value="all">All projects</option>
                      {data.projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="toolbar-filter">
                  <label htmlFor="status-filter">Status</label>
                  <select
                    id="status-filter"
                    aria-label="Filter by status"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All statuses</option>
                    {(section === "tasks"
                      ? ["todo", "in_progress", "done"]
                      : ["planned", "active", "completed"]
                    ).map((v) => (
                      <option key={v} value={v}>
                        {label(v)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      {section === "clients" && (
        <section className="panel">
          <div className="panel-head">
            <h2>Client directory</h2>
            <span className="muted">{filteredClients.length} clients</span>
          </div>
          {filteredClients.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Email</th>
                    <th>Projects</th>
                    <th>Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((c) => (
                    <tr key={c.id}>
                      <td data-label="Client" className="row-title">
                        <div className="entity-name">
                          <span className="entity-icon">
                            <Users size={14} />
                          </span>
                          <div>
                            <Link
                              className="record-link"
                              href={`${base}/projects?client=${c.id}`}
                            >
                              {c.name}
                              <ChevronRight size={14} />
                            </Link>
                            <small>{c.company || "Independent client"}</small>
                          </div>
                        </div>
                      </td>
                      <td data-label="Email">{c.email || "—"}</td>
                      <td data-label="Projects">
                        <Link
                          className="text-action"
                          href={`${base}/projects?client=${c.id}`}
                        >
                          {
                            data.projects.filter((p) => p.clientId === c.id)
                              .length
                          }{" "}
                          projects <ArrowRight size={14} />
                        </Link>
                      </td>
                      <td data-label="Actions">
                        <div className="record-actions">
                          {writable && (
                            <EntityDialog
                              orgId={orgId}
                              action="project.save"
                              title="New project"
                              label={`New project for ${c.name}`}
                              compact
                              fields={projectFields.map((f) =>
                                f.name === "clientId"
                                  ? { ...f, defaultValue: c.id }
                                  : f,
                              )}
                            />
                          )}{" "}
                          {actions("client", c, clientFields)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title={search ? "No matching clients" : "No clients yet"}
              detail={
                search
                  ? "Try a different search."
                  : `Click Add client above. Example: ${workflowExample.client}.`
              }
            />
          )}
        </section>
      )}
      {section === "projects" && (
        <section className="panel">
          <div className="panel-head">
            <h2>All projects</h2>
            <span className="muted">
              {filteredProjects.length}{" "}
              {filteredProjects.length === 1 ? "project" : "projects"}
            </span>
          </div>
          {filteredProjects.length ? (
            projectTable(filteredProjects)
          ) : (
            <Empty
              title={
                search || filter !== "all"
                  ? "No matching projects"
                  : "No projects yet"
              }
              detail={
                search || filter !== "all"
                  ? "Try a different search or status."
                  : selectedClient
                    ? "Click New project above. This client is already selected for you."
                    : "Click New project above and choose the client you are working for."
              }
            />
          )}
        </section>
      )}
      {section === "tasks" && (
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Task list</h2>
              <p>
                {writable
                  ? "Use the status menu to update progress. Use Edit to change the details."
                  : "Task progress and deadlines for this workspace."}
              </p>
            </div>
            <span className="muted">
              {filteredTasks.length}{" "}
              {filteredTasks.length === 1 ? "task" : "tasks"}
            </span>
          </div>
          {filteredTasks.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Due date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((t) => (
                    <tr key={t.id}>
                      <td data-label="Task" className="row-title">
                        <div className="entity-name">
                          <span
                            className={`check-circle ${t.status === "done" ? "done" : ""}`}
                          >
                            {t.status === "done" && <Check size={10} />}
                          </span>
                          <div>
                            <strong>{t.title}</strong>
                            <small>{projectName(t.projectId)}</small>
                          </div>
                        </div>
                      </td>
                      <td data-label="Status">
                        {writable ? (
                          <TaskStatusControl
                            orgId={orgId}
                            id={t.id}
                            title={t.title}
                            status={t.status}
                          />
                        ) : (
                          <Badge value={t.status} />
                        )}
                      </td>
                      <td data-label="Priority">
                        <Badge value={t.priority} />
                      </td>
                      <td data-label="Due date" className="muted">
                        {date(t.dueDate)}
                      </td>
                      <td data-label="Actions">
                        {actions("task", t, taskFields)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title={
                search || filter !== "all"
                  ? "No matching tasks"
                  : "No tasks yet"
              }
              detail={
                search || filter !== "all"
                  ? "Try a different search or status."
                  : selectedProject
                    ? "Click Add task above. This project is already selected for you."
                    : `Click Add task above and name one action. Example: ${workflowExample.task}.`
              }
            />
          )}
        </section>
      )}
      {section === "settings" && (
        <WorkspaceSettings
          orgId={orgId}
          name={data.organization.name}
          role={role}
        />
      )}
      {section === "team" && !local && (
        <>
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>{data.organization.name}</h2>
                <p>
                  {data.people.length}{" "}
                  {data.people.length === 1 ? "member" : "members"} · Your role:{" "}
                  {label(role)}
                </p>
              </div>
              <Shield size={19} />
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Person</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.people.map((p) => (
                    <tr key={p.userId}>
                      <td data-label="Person" className="row-title">
                        <div className="entity-name">
                          <span className="avatar">
                            {p.name.slice(0, 2).toUpperCase()}
                          </span>
                          <strong>{p.name}</strong>
                        </div>
                      </td>
                      <td data-label="Email">{p.email}</td>
                      <td data-label="Role">
                        <Badge value={p.role} />
                      </td>
                      <td data-label="Actions">
                        {role === "owner" && p.role !== "owner" && (
                          <div className="row-actions">
                            <EntityDialog
                              orgId={orgId}
                              action="member.change"
                              title="Change member role"
                              kind="edit"
                              label={`Change role for ${p.name}`}
                              values={{ userId: p.userId, role: p.role }}
                              fields={[
                                {
                                  name: "role",
                                  label: "Role",
                                  type: "select",
                                  defaultValue: "member",
                                  full: true,
                                  options: ["admin", "member", "viewer"].map(
                                    (v) => ({
                                      value: v,
                                      label: label(v),
                                    }),
                                  ),
                                },
                              ]}
                            />
                            <EntityDialog
                              orgId={orgId}
                              action="member.change"
                              title="Remove member?"
                              label={`Remove ${p.name}`}
                              kind="delete"
                              values={{ userId: p.userId, role: "remove" }}
                              description="This person will lose access to this workspace immediately."
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          {invitable && (
            <section className="panel" style={{ marginTop: 24 }}>
              <div className="panel-head">
                <div>
                  <h2>Pending invitations</h2>
                  <p>
                    Copy the invitation link and share it with the person. Links
                    expire after 7 days.
                  </p>
                </div>
              </div>
              {data.invitations.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Expires</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.invitations.map((i) => (
                        <tr key={i.id}>
                          <td data-label="Email" className="row-title">
                            {i.email}
                          </td>
                          <td data-label="Role">
                            <Badge value={i.role} />
                          </td>
                          <td data-label="Expires">
                            {new Date(i.expiresAt).toLocaleDateString("en", {
                              timeZone: "UTC",
                            })}
                          </td>
                          <td data-label="Actions">
                            {(role === "owner" || i.role !== "admin") && (
                              <EntityDialog
                                orgId={orgId}
                                action="invite.revoke"
                                title="Revoke invitation?"
                                kind="delete"
                                label={`Revoke invitation for ${i.email}`}
                                values={{ id: i.id }}
                                description="The invitation link will stop working immediately."
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  title="Everyone’s accounted for"
                  detail="Invite a teammate using their email, then share the private link with them."
                />
              )}
            </section>
          )}
          <p className="notice" style={{ marginTop: 24 }}>
            Owners manage roles. Admins manage work and invite members or
            viewers. Members create and update work. Viewers can browse.
          </p>
        </>
      )}
      <footer className="footer">
        <DeveloperCredits />
        <span>ArzDesk · Open source</span>
      </footer>
    </main>
  );
}
