import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { workspace } from "@/features/workspace";
import { emptyState, localStateSchema } from "@/features/offline/model";
export async function GET() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session)
    return Response.json(
      { error: "Sign in first." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  const orgs = await workspace.listOrganizations(session.user.id);
  const state = emptyState();
  for (const org of orgs) {
    const data = await workspace.snapshot(session.user.id, org.id);
    state.organizations.push({
      ...data.organization,
      createdAt: data.organization.createdAt.toISOString(),
    });
    state.clients.push(
      ...data.clients.map((c) => ({
        ...c,
        email: c.email ?? "",
        company: c.company ?? "",
        notes: c.notes ?? "",
        createdAt: c.createdAt.toISOString(),
      })),
    );
    state.projects.push(
      ...data.projects.map((p) => ({
        ...p,
        description: p.description ?? "",
        dueDate: p.dueDate ?? "",
        createdAt: p.createdAt.toISOString(),
      })),
    );
    state.tasks.push(
      ...data.tasks.map((t) => ({
        ...t,
        dueDate: t.dueDate ?? "",
        createdAt: t.createdAt.toISOString(),
      })),
    );
  }
  return Response.json(localStateSchema.parse(state), {
    headers: { "Cache-Control": "no-store" },
  });
}
