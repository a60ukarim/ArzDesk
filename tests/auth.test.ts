import { beforeAll, afterAll, it, expect } from "vitest";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/lib/db/schema";
import { testDatabase } from "./helpers/database";
let database: Awaited<ReturnType<typeof testDatabase>>;
beforeAll(async () => {
  database = await testDatabase();
});
afterAll(async () => {
  await database.close();
});
it("registers credentials, rejects a wrong password and invalidates sessions after sign-out", async () => {
  const auth = betterAuth({
    baseURL: "http://localhost:3000",
    secret: "test-only-secret-at-least-thirty-two-characters-long",
    database: drizzleAdapter(database.db, { provider: "pg", schema }),
    emailAndPassword: { enabled: true, minPasswordLength: 12 },
    rateLimit: { enabled: true, storage: "database", max: 100 },
  });
  const request = (path: string, body?: object, cookie?: string) =>
    new Request(`http://localhost:3000/api/auth/${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  const signUp = await auth.handler(
    request("sign-up/email", {
      name: "Test User",
      email: "person@example.com",
      password: "a-strong-test-password",
    }),
  );
  expect(signUp.status).toBe(200);
  const wrong = await auth.handler(
    request("sign-in/email", {
      email: "person@example.com",
      password: "incorrect-password",
    }),
  );
  expect(wrong.status).toBe(401);
  const signIn = await auth.handler(
    request("sign-in/email", {
      email: "person@example.com",
      password: "a-strong-test-password",
    }),
  );
  expect(signIn.status).toBe(200);
  const cookie = signIn.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  expect(cookie).toContain("session_token");
  const sessionResponse = await auth.handler(
    request("get-session", undefined, cookie),
  );
  expect((await sessionResponse.json()).user.email).toBe("person@example.com");
  const signOut = await auth.handler(request("sign-out", {}, cookie));
  expect(signOut.status).toBe(200);
  const after = await auth.handler(request("get-session", undefined, cookie));
  expect(await after.json()).toBeNull();
});
