import { developmentOrigins } from "./development-origins";
import { accountOptions } from "./account-options";
import { passwordRecoveryOptions } from "./password-recovery";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { after } from "next/server";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
function createAuth() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  if (
    !process.env.BETTER_AUTH_SECRET ||
    process.env.BETTER_AUTH_SECRET.length < 32 ||
    process.env.BETTER_AUTH_SECRET.startsWith("replace-with")
  )
    throw new Error(
      "Set BETTER_AUTH_SECRET to a random secret of at least 32 characters.",
    );
  if (!process.env.BETTER_AUTH_URL)
    throw new Error("BETTER_AUTH_URL is required.");
  return betterAuth({
    appName: "ArzDesk",
    trustedOrigins: developmentOrigins(
      process.env.BETTER_AUTH_URL,
      process.env.NODE_ENV,
    ),
    ...accountOptions(),
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      ...passwordRecoveryOptions(),
    },
    advanced: {
      backgroundTasks: {
        handler: (promise) => {
          after(async () => {
            await promise;
          });
        },
      },
    },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/email": { window: 60, max: 10 },
        "/sign-up/email": { window: 60, max: 5 },
        "/request-password-reset": { window: 60, max: 5 },
        "/reset-password": { window: 60, max: 10 },
        "/change-email": { window: 60, max: 5 },
        "/change-password": { window: 60, max: 5 },
        "/update-user": { window: 60, max: 10 },
      },
    },
    plugins: [nextCookies()],
  });
}
let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  return (instance ??= createAuth());
}
