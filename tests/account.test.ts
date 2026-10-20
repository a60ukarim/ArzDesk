import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { accountOptions } from "@/lib/account-options";
import { sendVerificationEmail, sendEmailChangeConfirmation } from "@/lib/mail";
import { testDatabase } from "./helpers/database";
vi.mock("@/lib/mail", () => ({
  getEmailDeliveryMode: () => "smtp",
  sendVerificationEmail: vi.fn(async () => {}),
  sendEmailChangeConfirmation: vi.fn(async () => {}),
}));
let database: Awaited<ReturnType<typeof testDatabase>>;
beforeAll(async () => {
  database = await testDatabase();
});
afterAll(async () => {
  await database.close();
});
it("keeps a verified account's email until both old and new addresses approve", async () => {
  const auth = betterAuth({
    baseURL: "http://localhost:3000",
    secret: "test-only-secret-at-least-thirty-two-characters",
    database: drizzleAdapter(database.db, { provider: "pg", schema }),
    emailAndPassword: { enabled: true, minPasswordLength: 12 },
    ...accountOptions(),
    rateLimit: { enabled: false },
  });
  const call = (path: string, body?: object, cookie?: string) =>
    auth.handler(
      new Request(`http://localhost:3000/api/auth/${path}`, {
        method: body ? "POST" : "GET",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          ...(cookie ? { Cookie: cookie } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      }),
    );
  const signed = await call("sign-up/email", {
    name: "Example User",
    email: "before@example.com",
    password: "a-strong-password-123",
  });
  expect(signed.status).toBe(200);
  const cookie = signed.headers
    .getSetCookie()
    .map((v) => v.split(";")[0])
    .join("; ");
  const user = (await signed.json()).user;
  await database.db
    .update(schema.user)
    .set({ emailVerified: true })
    .where(eq(schema.user.id, user.id));
  expect(
    (await call("change-email", { newEmail: "after@example.com" })).status,
  ).toBe(401);
  const renamed = await call("update-user", { name: "New name" }, cookie);
  expect(renamed.status).toBe(200);
  const requested = await call(
    "change-email",
    { newEmail: "after@example.com", callbackURL: "/profile" },
    cookie,
  );
  expect(requested.status).toBe(200);
  const approval = vi.mocked(sendEmailChangeConfirmation);
  const verification = vi.mocked(sendVerificationEmail);
  expect(approval).toHaveBeenCalledTimes(1);
  expect(approval.mock.calls[0][0].to).toBe("before@example.com");
  expect(verification).not.toHaveBeenCalled();
  const readUser = async () =>
    (
      await database.db
        .select()
        .from(schema.user)
        .where(eq(schema.user.id, user.id))
    )[0];
  expect((await readUser()).email).toBe("before@example.com");
  const approved = await auth.handler(
    new Request(approval.mock.calls[0][0].url, { headers: { Cookie: cookie } }),
  );
  expect(approved.status).toBe(302);
  expect(verification).toHaveBeenCalledTimes(1);
  expect(verification.mock.calls[0][0].to).toBe("after@example.com");
  expect((await readUser()).email).toBe("before@example.com");
  const verified = await auth.handler(
    new Request(verification.mock.calls[0][0].url, {
      headers: { Cookie: cookie },
    }),
  );
  expect(verified.status).toBe(302);
  expect((await readUser()).email).toBe("after@example.com");
  expect((await readUser()).name).toBe("New name");
  expect((await readUser()).emailVerified).toBe(true);
});
