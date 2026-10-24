"use client";
import { useClientReady } from "@/lib/use-client-ready";
import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
export function AuthForm({
  mode,
  next,
  pageNotReady = false,
}: {
  mode: "sign-in" | "sign-up";
  next: string;
  pageNotReady?: boolean;
}) {
  const ready = useClientReady();
  const [error, setError] = useState(
    pageNotReady
      ? "The page did not finish loading. Reload it and try again. If this continues, check the connection to ArzDesk."
      : "",
  );
  const [pending, setPending] = useState(false);
  const destination =
    next.startsWith("/invite/") && /^\/invite\/[a-f0-9]{64}$/.test(next)
      ? next
      : "/cloud";
  const isSignUp = mode === "sign-up";
  return (
    <div className="auth-card">
      <span className="eyebrow">CLIENTS · PROJECTS · TASKS</span>
      <h1 style={{ marginTop: 12 }}>
        {isSignUp ? "Create your account" : "Welcome to ArzDesk"}
      </h1>
      <p>
        {isSignUp
          ? "Organize your clients, projects and tasks with your team."
          : "Sign in to open your workspace and continue your work."}
      </p>
      <form
        method="post"
        action="/auth/page-not-ready"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError("");
          const data = new FormData(e.currentTarget);
          const email = String(data.get("email")).trim();
          const password = String(data.get("password"));
          try {
            const result = isSignUp
              ? await authClient.signUp.email({
                  email,
                  password,
                  name: String(data.get("name")).trim(),
                })
              : await authClient.signIn.email({ email, password });
            if (result.error) {
              setError(result.error.message ?? "Authentication failed.");
              setPending(false);
              return;
            }
            window.location.assign(destination);
          } catch {
            setError("Could not connect. Please try again.");
            setPending(false);
          }
        }}
      >
        {isSignUp && (
          <label className="field">
            Your name
            <input
              name="name"
              autoComplete="name"
              required
              maxLength={120}
              placeholder="Your full name"
            />
          </label>
        )}
        <label className="field">
          Email address
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="you@company.com"
          />
        </label>
        <label className="field">
          Password
          <input
            type="password"
            name="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
            minLength={isSignUp ? 12 : 1}
            maxLength={128}
            placeholder={isSignUp ? "At least 12 characters" : "Your password"}
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <Button disabled={!ready || pending} type="submit">
          {!ready
            ? "Loading…"
            : pending
              ? "Please wait…"
              : isSignUp
                ? "Create account"
                : "Sign in"}
        </Button>
      </form>
      {!isSignUp && (
        <Link className="forgot-link" href="/forgot-password">
          Forgot password?
        </Link>
      )}
      <div className="auth-switch">
        {isSignUp ? "Already have an account?" : "New to ArzDesk?"}{" "}
        <Link
          href={`/${isSignUp ? "sign-in" : "sign-up"}?next=${encodeURIComponent(destination)}`}
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </div>
    </div>
  );
}
