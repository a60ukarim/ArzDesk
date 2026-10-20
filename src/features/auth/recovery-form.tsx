"use client";
import { useClientReady } from "@/lib/use-client-ready";
import { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
export function RecoveryForm({
  mode,
  token = "",
  invalid = false,
  delivery = "smtp",
}: {
  mode: "request" | "reset";
  token?: string;
  invalid?: boolean;
  delivery?: "smtp" | "console" | "unavailable";
}) {
  const ready = useClientReady();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const resetting = mode === "reset";
  return (
    <div className="auth-card recovery-card">
      <span className="auth-form-icon">
        {done ? <CheckCircle2 size={23} /> : <Mail size={23} />}
      </span>
      <h2>
        {done
          ? resetting
            ? "Password updated"
            : "Check your email"
          : resetting
            ? "Choose a new password"
            : "Forgot your password?"}
      </h2>
      <p>
        {done
          ? resetting
            ? "Your password has been changed. Sign in with your new password."
            : delivery === "console"
              ? "If the account exists, the recovery link is available in the local server terminal."
              : "If an account matches that address, we sent a private reset link. Check your inbox and spam folder."
          : resetting
            ? "Use at least 12 characters. Your other sessions will be signed out."
            : "Enter the email address you used to create your account."}
      </p>
      {done ? (
        <Button asChild>
          <Link href="/sign-in">Back to sign in</Link>
        </Button>
      ) : invalid || (resetting && !token) ? (
        <div className="error" role="alert">
          This reset link is invalid or has expired.{" "}
          <Link href="/forgot-password">Request a new link</Link>.
        </div>
      ) : !resetting && delivery === "unavailable" ? (
        <div className="notice">
          Recovery email has not been set up for this installation. Contact the
          person who runs this ArzDesk instance.
        </div>
      ) : (
        <form
          method="post"
          action="/auth/page-not-ready"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            const data = new FormData(e.currentTarget);
            const password = String(data.get("password") ?? "");
            if (resetting && password !== String(data.get("confirm"))) {
              setError("The passwords do not match.");
              return;
            }
            setPending(true);
            try {
              const result = resetting
                ? await authClient.resetPassword({
                    newPassword: password,
                    token,
                  })
                : await authClient.requestPasswordReset({
                    email: String(data.get("email")).trim(),
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
              if (result.error) {
                setError(
                  resetting
                    ? "This link may have expired or already been used. Request a new link and try again."
                    : "We could not send a reset link. Please try again later.",
                );
                return;
              }
              setDone(true);
            } catch {
              setError("Could not connect. Please try again.");
            } finally {
              setPending(false);
            }
          }}
        >
          {resetting ? (
            <>
              <label className="field">
                New password
                <input
                  name="password"
                  type="password"
                  required
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  placeholder="At least 12 characters"
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
                  placeholder="Enter the new password again"
                />
              </label>
            </>
          ) : (
            <label className="field">
              Email address
              <input
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
          )}
          {!resetting && delivery === "console" && (
            <p className="notice">
              Local development mode: the reset link is printed in the server
              terminal instead of being emailed.
            </p>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <Button type="submit" disabled={!ready || pending}>
            {pending
              ? "Please wait…"
              : resetting
                ? "Update password"
                : "Send reset link"}
          </Button>
        </form>
      )}
      {!done && (
        <Link className="auth-back" href="/sign-in">
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      )}
    </div>
  );
}
