"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/session";
import { workspace } from "./index";
import { WorkspaceError } from "./policy";
export type ActionResult =
  { ok: true; id?: string; token?: string } | { ok: false; error: string };
export async function mutate(
  action: string,
  orgId: string,
  data: Record<string, string>,
): Promise<ActionResult> {
  const user = await requireUser();
  try {
    switch (action) {
      case "organization.create": {
        const id = await workspace.createOrganization(user.id, data);
        revalidatePath("/workspaces");
        return { ok: true, id };
      }
      case "organization.rename":
        await workspace.renameOrganization(user.id, orgId, data);
        revalidatePath("/workspaces");
        revalidatePath(`/w/${orgId}`, "layout");
        break;
      case "project.status":
        await workspace.setProjectStatus(user.id, orgId, data.id, data.status);
        break;
      case "client.save":
        await workspace.saveClient(user.id, orgId, data, data.id || undefined);
        break;
      case "client.delete":
        await workspace.deleteClient(user.id, orgId, data.id);
        break;
      case "project.save":
        await workspace.saveProject(user.id, orgId, data, data.id || undefined);
        break;
      case "project.delete":
        await workspace.deleteProject(user.id, orgId, data.id);
        break;
      case "task.save":
        await workspace.saveTask(user.id, orgId, data, data.id || undefined);
        break;
      case "task.status":
        await workspace.setTaskStatus(user.id, orgId, data.id, data.status);
        break;
      case "task.delete":
        await workspace.deleteTask(user.id, orgId, data.id);
        break;
      case "invite.create": {
        const token = await workspace.invite(user.id, orgId, data);
        revalidatePath(`/w/${orgId}`);
        return { ok: true, token };
      }
      case "invite.accept": {
        const id = await workspace.acceptInvite(user.id, data.token);
        revalidatePath("/workspaces");
        return { ok: true, id };
      }
      case "invite.revoke":
        await workspace.revokeInvite(user.id, orgId, data.id);
        break;
      case "member.change": {
        const role = z
          .enum(["admin", "member", "viewer", "remove"])
          .parse(data.role);
        await workspace.changeMember(user.id, orgId, data.userId, role);
        break;
      }
      default:
        throw new WorkspaceError("Unknown action.");
    }
    revalidatePath(`/w/${orgId}`);
    return { ok: true };
  } catch (error) {
    if (error instanceof z.ZodError)
      return {
        ok: false,
        error: error.issues[0]?.message ?? "Check your input.",
      };
    if (error instanceof WorkspaceError)
      return { ok: false, error: error.message };
    console.error("Workspace action failed", { action, error });
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
