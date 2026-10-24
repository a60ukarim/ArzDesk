"use client";
import { useState } from "react";
import { useWorkspaceRuntime } from "./runtime";
import Link from "next/link";
import { Building2, Users, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeedback } from "@/components/feedback-provider";
import type { Role } from "./policy";
export function WorkspaceSettings({
  orgId,
  name,
  role,
}: {
  orgId: string;
  name: string;
  role: Role;
}) {
  const [value, setValue] = useState(name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { notify } = useFeedback();
  const { router, mutate, local } = useWorkspaceRuntime();
  return (
    <div className="settings-grid">
      <section className="panel settings-card">
        <div className="settings-card-heading">
          <span className="entity-icon">
            <Building2 size={19} />
          </span>
          <div>
            <h2>Workspace details</h2>
            <p>The name your team sees throughout ArzDesk.</p>
          </div>
        </div>
        {role === "owner" ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                const result = await mutate("organization.rename", orgId, {
                  name: value,
                });
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                notify("Workspace name updated.");
                router.refresh();
              } catch {
                setError("Could not update the workspace. Please try again.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="field">
              Workspace name
              <input
                required
                maxLength={120}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Your business or team"
              />
            </label>
            <p className="field-hint">
              Renaming keeps all your clients, projects, tasks and team members.
            </p>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={busy || value.trim() === name || !value.trim()}
            >
              {busy ? (
                "Saving…"
              ) : (
                <>
                  <Check size={15} />
                  Save workspace name
                </>
              )}
            </Button>
          </form>
        ) : (
          <>
            <p className="settings-name">{name}</p>
            <p className="notice">
              Only the workspace owner can change its name.
            </p>
          </>
        )}
      </section>
      {local ? (
        local.settings
      ) : (
        <section className="panel settings-card">
          <div className="settings-card-heading">
            <span className="entity-icon">
              <Users size={19} />
            </span>
            <div>
              <h2>Team access</h2>
              <p>Choose who can work in this workspace.</p>
            </div>
          </div>
          <p className="settings-description">
            Invite colleagues and manage their roles from the Team page.
          </p>
          <Button asChild variant="outline">
            <Link href={`/w/${orgId}/team`}>
              Open team
              <ArrowRight size={15} />
            </Link>
          </Button>
        </section>
      )}
    </div>
  );
}
