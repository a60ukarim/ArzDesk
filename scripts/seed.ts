import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";
import { createWorkspaceService } from "../src/features/workspace/service";
const email = process.argv[2]?.trim().toLowerCase();
if (!email || !process.env.DATABASE_URL)
  throw new Error(
    "Usage: npm run db:seed -- your-registered-email@example.com (DATABASE_URL required)",
  );
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const db = drizzle(pool, { schema });
  const [person] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, email));
  if (!person)
    throw new Error(
      "Register this email in the app first. No default users/passwords are created.",
    );
  const service = createWorkspaceService(db);
  const orgId = await service.createOrganization(person.id, {
    name: "ArzDesk Demo",
  });
  const sampleClient = await service.saveClient(person.id, orgId, {
    name: "Cedar Academy",
    company: "Cedar Academy",
    email: "hello@cedar.example",
  });
  const studio = await service.saveClient(person.id, orgId, {
    name: "North Studio",
    company: "North Studio",
    email: "team@north.example",
  });
  for (const item of [
    { name: "Website redesign", clientId: sampleClient.id, status: "active" },
    { name: "Brand refresh", clientId: studio.id, status: "active" },
    { name: "Product catalog", clientId: sampleClient.id, status: "planned" },
  ]) {
    const project = await service.saveProject(person.id, orgId, item);
    await service.saveTask(person.id, orgId, {
      title: `Plan ${item.name.toLowerCase()}`,
      projectId: project.id,
      status: "done",
      priority: "medium",
    });
    await service.saveTask(person.id, orgId, {
      title: `Review ${item.name.toLowerCase()}`,
      projectId: project.id,
      status: "in_progress",
      priority: "high",
    });
  }
  console.log(`Demo workspace created: /w/${orgId}`);
} finally {
  await pool.end();
}
