import { beforeAll, afterAll, it, expect, vi } from "vitest";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/lib/db/schema";
import { passwordRecoveryOptions } from "@/lib/password-recovery";
import { sendPasswordResetEmail } from "@/lib/mail";
import { testDatabase } from "./helpers/database";
vi.mock("@/lib/mail", () => ({
  getEmailDeliveryMode: () => "smtp",
  sendPasswordResetEmail: vi.fn(async () => {}),
}));
let database: Awaited<ReturnType<typeof testDatabase>>;
beforeAll(async () => {
  database = await testDatabase();
});
afterAll(async () => {
  await database.close();
});
it("recovers credentials with an expiring, single-use link and revokes old sessions", async () => {
  const auth = betterAuth({
    baseURL: "http://localhost:3000",
    secret: "test-only-secret-with-at-least-32-characters",
    database: drizzleAdapter(database.db, { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      ...passwordRecoveryOptions(),
    },
    rateLimit: { enabled: false },
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
  const signup = await auth.handler(
    request("sign-up/email", {
      name: "Example User",
      email: "recover@example.com",
      password: "old-test-password-123",
    }),
  );
  expect(signup.status).toBe(200);
  const cookie = signup.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  const known = await auth.handler(
    request("request-password-reset", {
      email: "recover@example.com",
      redirectTo: "/reset-password",
    }),
  );
  const unknown = await auth.handler(
    request("request-password-reset", {
      email: "unknown@example.com",
      redirectTo: "/reset-password",
    }),
  );
  expect(known.status).toBe(200);
  expect(unknown.status).toBe(200);
  expect(await known.json()).toEqual(await unknown.json());
  const sent = vi.mocked(sendPasswordResetEmail);
  expect(sent).toHaveBeenCalledTimes(1);
  const resetUrl = new URL(sent.mock.calls[0][0].url);
  const token = resetUrl.pathname.split("/").pop()!;
  const weak = await auth.handler(
    request("reset-password", { token, newPassword: "short" }),
  );
  expect(weak.status).toBe(400);
  const reset = await auth.handler(
    request("reset-password", { token, newPassword: "new-test-password-456" }),
  );
  expect(reset.status).toBe(200);
  expect(
    await (
      await auth.handler(request("get-session", undefined, cookie))
    ).json(),
  ).toBeNull();
  expect(
    (
      await auth.handler(
        request("sign-in/email", {
          email: "recover@example.com",
          password: "old-test-password-123",
        }),
      )
    ).status,
  ).toBe(401);
  expect(
    (
      await auth.handler(
        request("sign-in/email", {
          email: "recover@example.com",
          password: "new-test-password-456",
        }),
      )
    ).status,
  ).toBe(200);
  expect(
    (
      await auth.handler(
        request("reset-password", {
          token,
          newPassword: "reused-test-password-789",
        }),
      )
    ).status,
  ).toBe(400);
  await auth.handler(
    request("request-password-reset", {
      email: "recover@example.com",
      redirectTo: "/reset-password",
    }),
  );
  const expiredToken = new URL(sent.mock.calls[1][0].url).pathname
    .split("/")
    .pop()!;
  await database.db
    .update(schema.verification)
    .set({ expiresAt: new Date(Date.now() - 1000) });
  expect(
    (
      await auth.handler(
        request("reset-password", {
          token: expiredToken,
          newPassword: "expired-test-password-789",
        }),
      )
    ).status,
  ).toBe(400);
});
