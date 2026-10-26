"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspaceRuntime } from "./runtime";

export function WorkspaceDangerZone({
  orgId,
  name,
}: {
  orgId: string;
  name: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { mutate, router, local } = useWorkspaceRuntime();

  return (
    <section className="panel settings-card workspace-danger" aria-labelledby="workspace-danger-title">
      <div className="settings-card-heading">
        <span className="entity-icon"><AlertTriangle size={19} /></span>
        <div>
          <h2 id="workspace-danger-title">Delete workspace</h2>
          <p>Remove this workspace and everything inside it.</p>
        </div>
      </div>
      <p className="settings-description">
        This permanently deletes the workspace, its clients, projects and tasks.
        {local ? " Only this device's copy is affected." :
          " All team members will lose access. This cannot be undone."}
      </p>
      {!expanded ? (
        <Button type="button" variant="destructive" onClick={() => setExpanded(true)}>
          <Trash2 size={15} /> Delete workspace…
        </Button>
      ) : (
        <form className="workspace-delete-form" onSubmit={async (e) => {
          e.preventDefault();
          if (confirmation !== name || busy) return;
          setBusy(true);
          setError("");
          try {
            const result = await mutate("organization.delete", orgId, { confirmation });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.push(local ? "/offline#" : "/workspaces");
            if (!local) router.refresh();
          } catch {
            setError("Could not delete this workspace. No changes were made.");
          } finally {
            setBusy(false);
          }
        }}>
          <p className="workspace-danger-warning">
            This action cannot be undone. Export a backup first if you need
            these records later.
          </p>
          <label className="field">
            Type <strong dir="auto">{name}</strong> to confirm
            <input
              aria-label="Confirm workspace name"
              autoComplete="off"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              required
            />
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          <div className="workspace-danger-actions">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setExpanded(false);
                setConfirmation("");
                setError("");
              }}
            >Cancel</Button>
            <Button type="submit" variant="destructive" disabled={busy || confirmation !== name}>
              <Trash2 size={15} /> {busy ? "Deleting…" : "Delete permanently"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
