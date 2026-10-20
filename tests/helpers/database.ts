import { PGlite } from "@electric-sql/pglite";
import { drizzle as pgliteDrizzle } from "drizzle-orm/pglite";
import { drizzle as pgDrizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { readFileSync, readdirSync } from "node:fs";
import * as schema from "@/lib/db/schema";
import type { Database } from "@/lib/db";
export async function testDatabase() {
  const url = process.env.TEST_DATABASE_URL;
  // TEST_DATABASE_URL must point to a dedicated, disposable database.
  const client = url ? new Pool({ connectionString: url }) : new PGlite();
  const raw = async (sql: string) => {
    if (client instanceof Pool) await client.query(sql);
    else await client.exec(sql);
  };
  const db = (client instanceof Pool
    ? pgDrizzle(client, { schema })
    : pgliteDrizzle(client, { schema })) as unknown as Database;
  // Apply checked-in SQL, not a separately maintained test schema.
  if (client instanceof Pool)
    await migrate(db, { migrationsFolder: "drizzle/migrations" });
  else
    for (const file of readdirSync("drizzle/migrations")
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await raw(readFileSync(`drizzle/migrations/${file}`, "utf8"));
  return {
    db,
    raw,
    close: () => (client instanceof Pool ? client.end() : client.close()),
    reset: () =>
      raw('TRUNCATE TABLE "user", organizations, rate_limit CASCADE'),
  };
}
