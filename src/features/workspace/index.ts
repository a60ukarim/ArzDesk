import { db } from "@/lib/db";
import { createWorkspaceService } from "./service";
export const workspace = createWorkspaceService(db);
