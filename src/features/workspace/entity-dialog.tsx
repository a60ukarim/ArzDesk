"use client";
import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mutate } from "./actions";
import { useFeedback } from "@/components/feedback-provider";
export type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "date" | "textarea" | "select";
  required?: boolean;
  maxLength?: number;
  options?: { value: string; label: string }[];
  defaultValue?: string;
  full?: boolean;
  placeholder?: string;
  hint?: string;
  advanced?: boolean;
};
export function EntityDialog({
  orgId,
  action,
  title,
  fields = [],
  values = {},
  kind = "create",
  label,
  description,
  compact = false,
}: {
  orgId: string;
  action: string;
  title: string;
  fields?: Field[];
  values?: Record<string, string>;
  kind?: "create" | "edit" | "delete";
  label?: string;
  description?: string;
  compact?: boolean;
}) {
  const { notify } = useFeedback();
  const formId = useId();
  const entity = action.split(".")[0];
  const entityName =
    entity === "invite"
      ? "Invitation"
      : entity === "member"
        ? "Member"
        : entity.charAt(0).toUpperCase() + entity.slice(1);
  const submitLabel =
    kind === "delete"
      ? entity === "invite"
        ? "Revoke invitation"
        : entity === "member"
          ? "Remove member"
          : `Delete ${entity}`
      : kind === "edit"
        ? "Save changes"
        : entity === "project"
          ? "Create project"
          : entity === "invite"
            ? "Create invitation"
            : title;
  const basicFields = fields.filter((f) => !f.advanced);
  const extraFields = fields.filter((f) => f.advanced);
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);
  function open() {
    setError("");
    setToken("");
    setCopied(false);
    dialog.current?.querySelector("form")?.reset();
    const details = dialog.current?.querySelector("details");
    if (details) details.open = kind === "edit";
    dialog.current?.showModal();
  }
  function renderField(f: Field) {
    return (
      <div key={f.name} className={`field ${f.full ? "full" : ""}`}>
        <label htmlFor={`${formId}-${f.name}`}>
          {f.label}{" "}
          <span className="field-requirement" aria-hidden="true">
            {f.required ? "Required" : "Optional"}
          </span>
        </label>
        {f.type === "textarea" ? (
          <textarea
            id={`${formId}-${f.name}`}
            aria-label={f.label}
            aria-describedby={f.hint ? `${formId}-${f.name}-hint` : undefined}
            name={f.name}
            defaultValue={values[f.name] ?? f.defaultValue ?? ""}
            placeholder={f.placeholder}
            maxLength={f.maxLength ?? 2000}
          />
        ) : f.type === "select" ? (
          <select
            id={`${formId}-${f.name}`}
            aria-label={f.label}
            aria-describedby={f.hint ? `${formId}-${f.name}-hint` : undefined}
            name={f.name}
            required={f.required}
            defaultValue={values[f.name] ?? f.defaultValue ?? ""}
          >
            {!f.defaultValue && <option value="">Select…</option>}
            {f.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={`${formId}-${f.name}`}
            aria-label={f.label}
            aria-describedby={f.hint ? `${formId}-${f.name}-hint` : undefined}
            name={f.name}
            type={f.type ?? "text"}
            required={f.required}
            defaultValue={values[f.name] ?? f.defaultValue ?? ""}
            placeholder={f.placeholder}
            maxLength={f.maxLength ?? 120}
          />
        )}
        {f.hint && (
          <small className="field-hint" id={`${formId}-${f.name}-hint`}>
            {f.hint}
          </small>
        )}
      </div>
    );
  }
  return (
    <>
      <Button
        variant={
          kind === "create"
            ? compact
              ? "outline"
              : "default"
            : kind === "delete"
              ? "destructive"
              : "outline"
        }
        size={kind === "create" && !compact ? "default" : "sm"}
        title={label ?? title}
        onClick={open}
        aria-label={label ?? title}
      >
        {kind === "create" ? (
          <>
            <Plus size={15} />
            {compact ? title : (label ?? title)}
          </>
        ) : kind === "edit" ? (
          <>
            <Pencil size={14} />
            <span>Edit</span>
          </>
        ) : (
          <>
            <Trash2 size={14} />
            <span>
              {entity === "invite"
                ? "Revoke"
                : entity === "member"
                  ? "Remove"
                  : "Delete"}
            </span>
          </>
        )}
      </Button>
      <dialog
        ref={dialog}
        className="modal"
        aria-label={title}
        onCancel={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            <p className="dialog-caption">
              {kind === "delete"
                ? "Review this action before continuing."
                : kind === "edit"
                  ? "Update the details below."
                  : entity === "task"
                    ? "Name the task and choose its project. Everything else can wait."
                    : entity === "project"
                      ? "Name the project and choose who it is for."
                      : entity === "client"
                        ? "Add the person or business you are working for."
                        : "Choose the email and access level for this person."}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close dialog"
            disabled={busy}
            onClick={() => dialog.current?.close()}
          >
            <X size={18} />
          </Button>
        </div>
        <div className="modal-body">
          {token ? (
            <>
              <p style={{ marginBottom: 14 }}>
                Invitation ready. Copy this link and share it privately with the
                invited person. It expires in 7 days.
              </p>
              <p className="invite-result">{`${window.location.origin}/invite/${token}`}</p>
              <div className="modal-actions">
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        `${window.location.origin}/invite/${token}`,
                      );
                      setCopied(true);
                    } catch {
                      setError("Select and copy the link above.");
                    }
                  }}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}{" "}
                  {copied ? "Copied" : "Copy link"}
                </Button>
                <Button onClick={() => dialog.current?.close()}>Done</Button>
              </div>
            </>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError("");
                const data = {
                  ...values,
                  ...Object.fromEntries(
                    new FormData(e.currentTarget).entries(),
                  ),
                } as Record<string, string>;
                try {
                  const result = await mutate(action, orgId, data);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  router.refresh();
                  if (result.token) {
                    setToken(result.token);
                    return;
                  }
                  notify(
                    `${entityName} ${kind === "delete" ? "removed" : kind === "edit" ? "updated" : "added"} successfully.`,
                  );
                  dialog.current?.close();
                } catch {
                  setError("Could not save your changes. Please try again.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {description && (
                <p style={{ marginBottom: 20 }} className="muted">
                  {description}
                </p>
              )}
              <div className="form-grid">{basicFields.map(renderField)}</div>
              {extraFields.length > 0 && (
                <details
                  className="optional-details"
                  open={kind === "edit" || undefined}
                >
                  <summary>
                    More details <span>Optional</span>
                  </summary>
                  <div className="form-grid">
                    {extraFields.map(renderField)}
                  </div>
                </details>
              )}
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
              <div className="modal-actions">
                <Button
                  variant="outline"
                  type="button"
                  disabled={busy}
                  onClick={() => dialog.current?.close()}
                >
                  Cancel
                </Button>
                <Button
                  variant={kind === "delete" ? "destructive" : "default"}
                  disabled={busy}
                  type="submit"
                >
                  {busy ? "Please wait…" : submitLabel}
                </Button>
              </div>
            </form>
          )}
          {token && error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </div>
      </dialog>
    </>
  );
}
