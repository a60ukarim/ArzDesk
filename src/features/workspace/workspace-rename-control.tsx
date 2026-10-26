"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, X } from "lucide-react";
import { mutate, type ActionResult } from "@/features/workspace/actions";
import { useFeedback } from "@/components/feedback-provider";

type Props = {
  orgId: string;
  name: string;
  onRename?: (newName: string) => Promise<ActionResult>;
};

export function WorkspaceRenameControl({ orgId, name, onRename }: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const panelId = useId();
  const router = useRouter();
  const { notify } = useFeedback();

  function close() {
    setOpen(false);
    setValue(name);
    setError("");
  }

  return (
    <div className="workspace-rename">
      <button
        type="button"
        className="workspace-rename-trigger"
        aria-label={`Edit name for ${name}`}
        aria-expanded={open}
        aria-controls={panelId}
        disabled={busy}
        onClick={() => {
          if (open) close();
          else {
            setValue(name);
            setError("");
            setOpen(true);
          }
        }}
      >
        <Pencil size={14} aria-hidden="true" />
        Edit name
      </button>
      {open && (
        <form
          id={panelId}
          className="workspace-rename-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const trimmed = value.trim();
            if (!trimmed || trimmed === name || busy) return;
            setBusy(true);
            setError("");
            try {
              const result = onRename
                ? await onRename(trimmed)
                : await mutate("organization.rename", orgId, { name: trimmed });
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setOpen(false);
              notify("Workspace name updated.");
              if (!onRename) router.refresh();
            } catch {
              setError("Could not rename this workspace. Try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="field">
            New workspace name
            <input
              autoFocus
              aria-label={`New name for ${name}`}
              required
              maxLength={120}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  close();
                }
              }}
            />
          </label>
          <p className="workspace-rename-hint">
            Projects, clients, tasks and workspace links stay unchanged.
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="workspace-rename-actions">
            <button type="button" disabled={busy} onClick={close}>
              <X size={13} aria-hidden="true" /> Cancel
            </button>
            <button
              type="submit"
              className="workspace-rename-save"
              disabled={busy || !value.trim() || value.trim() === name}
            >
              <Check size={13} aria-hidden="true" />
              {busy ? "Saving…" : "Save name"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
