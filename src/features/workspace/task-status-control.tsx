"use client";
import { useId, useState, useTransition } from "react";
import { useWorkspaceRuntime } from "./runtime";
import { useFeedback } from "@/components/feedback-provider";
type TaskStatus = "todo" | "in_progress" | "done";
type ProjectStatus = "planned" | "active" | "completed";
function StatusControl({
  orgId,
  id,
  title,
  status,
  entity,
}: {
  orgId: string;
  id: string;
  title: string;
  status: string;
  entity: "task" | "project";
}) {
  const selectId = useId();
  const { router, mutate } = useWorkspaceRuntime();
  const { notify } = useFeedback();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const options =
    entity === "task"
      ? [
          { value: "todo", label: "To do" },
          { value: "in_progress", label: "In progress" },
          { value: "done", label: "Done" },
        ]
      : [
          { value: "planned", label: "Planned" },
          { value: "active", label: "Active" },
          { value: "completed", label: "Completed" },
        ];
  return (
    <div className="task-status-control">
      <label htmlFor={selectId} className="sr-only">
        Change status for {title}
      </label>
      <select
        id={selectId}
        className={`status-select status-${status}`}
        value={status}
        disabled={pending}
        aria-describedby={error ? `${selectId}-error` : undefined}
        onChange={(e) => {
          const next = e.target.value;
          setError("");
          startTransition(async () => {
            try {
              const result = await mutate(`${entity}.status`, orgId, {
                id,
                status: next,
              });
              if (!result.ok) {
                setError(result.error);
                return;
              }
              notify(
                entity === "task" && next === "done"
                  ? "Task completed. Great work!"
                  : `${entity === "task" ? "Task" : "Project"} status updated.`,
              );
              router.refresh();
            } catch {
              setError("Could not change the status. Please try again.");
            }
          });
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {pending && <small role="status">Saving…</small>}
      {error && (
        <small id={`${selectId}-error`} className="inline-error" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
export function TaskStatusControl(props: {
  orgId: string;
  id: string;
  title: string;
  status: TaskStatus;
}) {
  return <StatusControl {...props} entity="task" />;
}
export function ProjectStatusControl(props: {
  orgId: string;
  id: string;
  title: string;
  status: ProjectStatus;
}) {
  return <StatusControl {...props} entity="project" />;
}
