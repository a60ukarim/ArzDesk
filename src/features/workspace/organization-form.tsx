"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { mutate } from "./actions";
export function OrganizationForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <section className="org-create">
      <h2>Create a workspace</h2>
      <p className="muted">
        Use your business or team name. You can rename it later in Settings.
      </p>
      <form
        className="inline-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const name = String(new FormData(e.currentTarget).get("name"));
          try {
            const result = await mutate("organization.create", "", { name });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.push(`/w/${result.id}`);
          } catch {
            setError("Could not create your workspace. Try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="field">
          Workspace name
          <input
            name="name"
            required
            maxLength={120}
            placeholder="Your business or team"
          />
        </label>
        <Button type="submit" disabled={busy}>
          {busy ? "Creating…" : "Create workspace"}
        </Button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
