import { z } from "zod";
const name = z.string().trim().min(1, "A name is required.").max(120);
const optionalText = (max: number) => z.string().trim().max(max).default("");
const dueDate = z.union([z.literal(""), z.iso.date()]).default("");
export const organizationInput = z.object({ name });
export const clientInput = z.object({
  name,
  email: z.union([z.literal(""), z.email()]).default(""),
  company: optionalText(120),
  notes: optionalText(2000),
});
export const projectInput = z.object({
  name,
  clientId: z.string().min(1),
  description: optionalText(2000),
  status: z.enum(["planned", "active", "completed"]).default("planned"),
  dueDate,
});
export const taskInput = z.object({
  title: name,
  projectId: z.string().min(1),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate,
});
export const invitationInput = z.object({
  email: z.email().transform((v) => v.toLowerCase()),
  role: z.enum(["admin", "member", "viewer"]),
});

export const taskStatusInput = z.enum(["todo", "in_progress", "done"]);

export const projectStatusInput = z.enum(["planned", "active", "completed"]);
