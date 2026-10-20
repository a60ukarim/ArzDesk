import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { workspace } from "@/features/workspace";
import { WorkspaceShell } from "@/features/workspace/workspace-shell";
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const user = await requireUser();
  const { orgId } = await params;
  const organizations = await workspace.listOrganizations(user.id);
  const organization = organizations.find((o) => o.id === orgId);
  if (!organization) notFound();
  return (
    <WorkspaceShell
      organization={organization}
      organizations={organizations}
      person={{ name: user.name, email: user.email }}
    >
      {children}
    </WorkspaceShell>
  );
}
