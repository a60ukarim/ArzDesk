"use client";
import { workflowExample } from "./examples";
import { useRef } from "react";
import { WorkspaceLink as Link } from "./runtime";
import { CircleHelp, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
export function QuickGuide({ base }: { base: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => dialog.current?.showModal()}
        aria-label="Open quick guide"
      >
        <CircleHelp size={15} />
        Help
      </Button>
      <dialog
        ref={dialog}
        className="modal quick-guide"
        aria-labelledby="quick-guide-title"
      >
        <div className="modal-head">
          <div>
            <h2 id="quick-guide-title">How ArzDesk works</h2>
            <p className="dialog-caption">
              Keep your clients, projects and tasks in one workspace.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close quick guide"
            onClick={() => dialog.current?.close()}
          >
            <X size={18} />
          </Button>
        </div>
        <div className="modal-body">
          <ol className="guide-examples">
            {[
              {
                section: "clients",
                name: "Add a client",
                description: "The person or business you work for.",
                example: workflowExample.client,
              },
              {
                section: "projects",
                name: "Create their project",
                description: "The job you are delivering for that client.",
                example: workflowExample.project,
              },
              {
                section: "tasks",
                name: "Add the next task",
                description:
                  "One action you need to finish inside the project.",
                example: workflowExample.task,
              },
            ].map((step, i) => (
              <li key={step.section}>
                <span>{i + 1}</span>
                <div>
                  <Link
                    href={`${base}/${step.section}`}
                    onClick={() => dialog.current?.close()}
                  >
                    {step.name}
                    <ArrowRight size={14} />
                  </Link>
                  <p>{step.description}</p>
                  <small>Example: {step.example}</small>
                </div>
              </li>
            ))}
          </ol>
          <div className="guide-team">
            <strong>What happens next?</strong>
            <p>
              Open Tasks and set the next task to In progress. Do the actual
              work in your usual tools, then mark the task Done here. Overview
              shows the remaining work and your saved progress.
            </p>
          </div>
          <div className="guide-team">
            <strong>Working with someone?</strong>
            <p>
              Open Team to invite them. Clients are saved records; team members
              are the people who can sign in and work with you.
            </p>
          </div>
          <Button
            className="guide-done"
            onClick={() => dialog.current?.close()}
          >
            Got it
          </Button>
        </div>
      </dialog>
    </>
  );
}
