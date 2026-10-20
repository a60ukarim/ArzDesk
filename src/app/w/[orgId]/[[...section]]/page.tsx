import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { workspace } from "@/features/workspace";
import { WorkspaceError } from "@/features/workspace/policy";
import { WorkspaceUI, type Section } from "@/features/workspace/workspace-ui";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string; section?: string[] }>;
  searchParams: Promise<{
    client?: string | string[];
    project?: string | string[];
  }>;
}) {
  const { orgId, section: parts } = await params;
  const section = parts?.[0] ?? "overview";
  if (
    (parts && parts.length > 1) ||
    !["overview", "clients", "projects", "tasks", "team", "settings"].includes(
      section,
    )
  )
    notFound();
  const user = await requireUser();
  const data = await workspace.snapshot(user.id, orgId).catch((error) => {
    if (error instanceof WorkspaceError) notFound();
    throw error;
  });
  const query = await searchParams;
  const clientId =
    section === "projects" && typeof query.client === "string"
      ? query.client
      : undefined;
  const projectId =
    section === "tasks" && typeof query.project === "string"
      ? query.project
      : undefined;
  if (
    (clientId && !data.clients.some((c) => c.id === clientId)) ||
    (projectId && !data.projects.some((p) => p.id === projectId))
  )
    notFound();
  return (
    <WorkspaceUI
      key={`${orgId}/${section}/${clientId ?? ""}/${projectId ?? ""}`}
      data={data}
      context={{ clientId, projectId }}
      section={section as Section}
    />
  );
}
