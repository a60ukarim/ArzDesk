"use client";
import { useClientReady } from "@/lib/use-client-ready";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { UserRound, Mail, KeyRound, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useFeedback } from "@/components/feedback-provider";
export function AccountForm({
  user,
  delivery,
}: {
  user: { name: string; email: string };
  delivery: "smtp" | "console" | "unavailable";
}) {
  const ready = useClientReady();
  const router = useRouter();
  const id = useId();
  const [section, setSection] = useState<"name" | "email" | "password">("name");
  const sections = [
    { id: "name", label: "Your name", icon: UserRound },
    { id: "email", label: "Email address", icon: Mail },
    { id: "password", label: "Password", icon: KeyRound },
  ] as const;
  const { notify } = useFeedback();
  const [busy, setBusy] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailSent, setEmailSent] = useState(false);
  async function submit(kind: string, form: HTMLFormElement) {
    const values = new FormData(form);
    setErrors((e) => ({ ...e, [kind]: "" }));
    setBusy(kind);
    try {
      if (kind === "name") {
        const name = String(values.get("name")).trim();
        if (!name || name.length > 120)
          throw new Error("Enter a name between 1 and 120 characters.");
        const r = await authClient.updateUser({ name });
        if (r.error)
          throw new Error(r.error.message || "Could not update your name.");
        notify("Profile name updated.");
        router.refresh();
      } else if (kind === "email") {
        const newEmail = String(values.get("email")).trim();
        if (newEmail.toLowerCase() === user.email.toLowerCase())
          throw new Error("Enter a different email address.");
        const r = await authClient.changeEmail({
          newEmail,
          callbackURL: "/profile",
        });
        if (r.error)
          throw new Error(
            r.error.message ||
              "Could not request the change. Sign in again and retry.",
          );
        setEmailSent(true);
      } else {
        const newPassword = String(values.get("newPassword"));
        if (newPassword !== String(values.get("confirm")))
          throw new Error("The new passwords do not match.");
        const r = await authClient.changePassword({
          currentPassword: String(values.get("currentPassword")),
          newPassword,
          revokeOtherSessions: true,
        });
        if (r.error)
          throw new Error(
            r.error.message ||
              "Could not change your password. Check your current password.",
          );
        form.reset();
        notify("Password updated. Your other sessions were signed out.");
        router.refresh();
      }
    } catch (e) {
      setErrors((old) => ({
        ...old,
        [kind]:
          e instanceof Error ? e.message : "Could not save. Please try again.",
      }));
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="account-grid">
      <div
        className="account-tabs"
        role="tablist"
        aria-label="Account settings sections"
        onKeyDown={(e) => {
          const current = sections.findIndex((s) => s.id === section);
          const next =
            e.key === "ArrowRight" || e.key === "ArrowDown"
              ? (current + 1) % sections.length
              : e.key === "ArrowLeft" || e.key === "ArrowUp"
                ? (current + sections.length - 1) % sections.length
                : e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? sections.length - 1
                    : -1;
          if (next < 0) return;
          e.preventDefault();
          setSection(sections[next].id);
          document.getElementById(`${id}-tab-${sections[next].id}`)?.focus();
        }}
      >
        {sections.map((s) => (
          <button
            key={s.id}
            id={`${id}-tab-${s.id}`}
            type="button"
            role="tab"
            aria-selected={section === s.id}
            aria-controls={`${id}-panel-${s.id}`}
            tabIndex={section === s.id ? 0 : -1}
            onClick={() => setSection(s.id)}
          >
            <s.icon size={18} />
            {s.label}
          </button>
        ))}
      </div>
      <div className="account-panels">
        <section
          role="tabpanel"
          id={`${id}-panel-name`}
          aria-labelledby={`${id}-tab-name`}
          hidden={section !== "name"}
          className="panel account-card"
        >
          <div className="account-card-heading">
            <UserRound size={22} />
            <div>
              <h2>Your name</h2>
              <p>How you appear to your team.</p>
            </div>
          </div>
          <form
            method="post"
            action="/auth/page-not-ready"
            onSubmit={(e) => {
              e.preventDefault();
              void submit("name", e.currentTarget);
            }}
          >
            <label className="field">
              Full name
              <input
                name="name"
                required
                maxLength={120}
                defaultValue={user.name}
                autoComplete="name"
                dir="auto"
              />
            </label>
            {errors.name && (
              <p className="error" role="alert">
                {errors.name}
              </p>
            )}
            <Button disabled={!ready || !!busy} type="submit">
              {busy === "name" ? "Saving…" : "Save name"}
            </Button>
          </form>
        </section>
        <section
          role="tabpanel"
          id={`${id}-panel-email`}
          aria-labelledby={`${id}-tab-email`}
          hidden={section !== "email"}
          className="panel account-card"
        >
          <div className="account-card-heading">
            <Mail size={22} />
            <div>
              <h2>Email address</h2>
              <p>Your sign-in and recovery address.</p>
            </div>
          </div>
          <p className="current-email">
            Current: <strong>{user.email}</strong>
          </p>
          <form
            method="post"
            action="/auth/page-not-ready"
            onSubmit={(e) => {
              e.preventDefault();
              void submit("email", e.currentTarget);
            }}
          >
            <label className="field">
              New email address
              <input
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
            <p className="field-hint">
              Your current address stays active until the new address is
              confirmed.
            </p>
            {delivery === "console" && (
              <p className="notice">
                Local development: confirmation links appear in the server
                terminal.
              </p>
            )}
            {delivery === "unavailable" && (
              <p className="notice">
                Email changes need email delivery enabled by the person running
                this installation.
              </p>
            )}
            {emailSent && (
              <p className="notice" role="status">
                {delivery === "console"
                  ? "Open the confirmation link in the local server terminal. Once confirmed, your sign-in address will update."
                  : "Follow the confirmation email to finish. If your current address is verified, approve the change there first, then confirm the new address."}
              </p>
            )}
            {errors.email && (
              <p className="error" role="alert">
                {errors.email}
              </p>
            )}
            <Button
              type="submit"
              disabled={!ready || !!busy || delivery === "unavailable"}
            >
              {busy === "email" ? "Sending…" : "Confirm email change"}
              <ArrowRight size={15} />
            </Button>
          </form>
        </section>
        <section
          role="tabpanel"
          id={`${id}-panel-password`}
          aria-labelledby={`${id}-tab-password`}
          hidden={section !== "password"}
          className="panel account-card account-password"
        >
          <div className="account-card-heading">
            <KeyRound size={22} />
            <div>
              <h2>Change password</h2>
              <p>
                Use at least 12 characters. Other sessions will be signed out.
              </p>
            </div>
          </div>
          <form
            method="post"
            action="/auth/page-not-ready"
            onSubmit={(e) => {
              e.preventDefault();
              void submit("password", e.currentTarget);
            }}
          >
            <label className="field">
              Current password
              <input
                name="currentPassword"
                type="password"
                required
                maxLength={128}
                autoComplete="current-password"
              />
            </label>
            <div className="account-password-fields">
              <label className="field">
                New password
                <input
                  name="newPassword"
                  type="password"
                  required
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                />
              </label>
              <label className="field">
                Confirm new password
                <input
                  name="confirm"
                  type="password"
                  required
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                />
              </label>
            </div>
            {errors.password && (
              <p className="error" role="alert">
                {errors.password}
              </p>
            )}
            <Button type="submit" disabled={!ready || !!busy}>
              {busy === "password" ? "Updating…" : "Update password"}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
