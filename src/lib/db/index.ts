import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
const globalDb = globalThis as unknown as { arzdeskPool?: Pool };
const pool =
  globalDb.arzdeskPool ??
  new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
if (process.env.NODE_ENV !== "production") globalDb.arzdeskPool = pool;
export const db = drizzle(pool, { schema });
export type Database = typeof db;
