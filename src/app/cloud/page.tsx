import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { workspace } from "@/features/workspace";
export const dynamic = "force-dynamic";
export default async function Page() {
  const user = await requireUser();
  const orgs = await workspace.listOrganizations(user.id);
  redirect(orgs.length === 1 ? `/w/${orgs[0].id}/overview` : "/workspaces");
}
