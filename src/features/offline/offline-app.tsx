"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { z } from "zod";
import {
  Plus,
  Download,
  Upload,
  HardDrive,
  Cloud,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { WorkspaceShell } from "../workspace/workspace-shell";
import { WorkspaceUI, type Section } from "../workspace/workspace-ui";
import { WorkspaceRuntime } from "../workspace/runtime";
import {
  applyLocalAction,
  importLocalBackup,
  localSnapshot,
  localStateSchema,
  type LocalState,
} from "./model";
import { deviceTransaction } from "./storage";
const sections = new Set([
  "overview",
  "clients",
  "projects",
  "tasks",
  "settings",
]);
function subscribeHash(notify: () => void) {
  window.addEventListener("hashchange", notify);
  return () => window.removeEventListener("hashchange", notify);
}
export function OfflineApp() {
  const [state, setState] = useState<LocalState | null>(null);
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash.slice(1),
    () => "",
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const channel = useRef<BroadcastChannel | null>(null);
  async function reload() {
    try {
      setState(await deviceTransaction());
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not open device storage.",
      );
    }
  }
  useEffect(() => {
    void deviceTransaction().then(setState, (error) =>
      setError(
        error instanceof Error
          ? error.message
          : "Could not open device storage.",
      ),
    );
    const onFocus = () => {
      void reload();
    };
    window.addEventListener("focus", onFocus);
    if ("BroadcastChannel" in window) {
      channel.current = new BroadcastChannel("arzdesk-local-changes");
      channel.current.onmessage = onFocus;
    }
    let active = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    if (
      "serviceWorker" in navigator &&
      "caches" in window &&
      process.env.NODE_ENV === "production"
    ) {
      const check = async () => {
        try {
          const cached =
            navigator.serviceWorker.controller &&
            (await caches.match("/offline-ready"));
          if (active && cached) {
            setReady(true);
            if (timer) clearInterval(timer);
          }
        } catch {
          /* Storage support is optional; saved records remain available while open. */
        }
      };
      void check();
      timer = setInterval(() => void check(), 2000);
    }
    return () => {
      active = false;
      if (timer) clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      channel.current?.close();
    };
  }, []);
  function saved(next: LocalState) {
    setState(next);
    channel.current?.postMessage("saved");
  }
  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
    } catch (e) {
      setError(
        e instanceof z.ZodError
          ? (e.issues[0]?.message ?? "Check the file.")
          : e instanceof Error
            ? e.message
            : "Could not finish. Your saved data has not been replaced.",
      );
    } finally {
      setBusy(false);
    }
  }
  const [location, query = ""] = hash.split("?");
  const [orgId, sectionValue = "overview"] = location.split("/");
  const section = (
    sections.has(sectionValue) ? sectionValue : "overview"
  ) as Section;
  const org = state?.organizations.find((o) => o.id === orgId);
  const params = new URLSearchParams(query);
  const backupPanel = (
    <section
      className="panel settings-card local-backup"
      aria-labelledby="local-backup-title"
    >
      <div className="local-backup-intro">
        <span className="entity-icon" aria-hidden="true">
          <HardDrive size={20} />
        </span>
        <div>
          <span className="local-section-eyebrow">DATA & BACKUPS</span>
          <h2 id="local-backup-title">Your device, your data</h2>
          <p>
            Your work stays in this browser. No sign-in needed, but anyone using
            the same browser profile can access it.
          </p>
        </div>
      </div>
      <div className="local-backup-main">
        <p className="local-backup-caution">
          Back up regularly. Clearing browser data or losing this device can
          erase local work.
        </p>
        <div className="local-actions">
          <Button
            disabled={busy || !state?.organizations.length}
            onClick={() =>
              void run(async () => {
                const latest = await deviceTransaction();
                const url = URL.createObjectURL(
                  new Blob([JSON.stringify(latest, null, 2)], {
                    type: "application/json",
                  }),
                );
                const a = document.createElement("a");
                a.href = url;
                a.download = `ArzDesk-backup-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 10000);
                setNotice(
                  "Backup downloaded. Keep it somewhere safe; it contains your workspace data.",
                );
              })
            }
          >
            <Download size={16} />
            Export backup
          </Button>
          <label className={`btn btn-outline ${busy ? "local-disabled" : ""}`}>
            <Upload size={16} />
            Import backup
            <input
              className="sr-only"
              type="file"
              accept="application/json,.json"
              disabled={busy}
              aria-label="Import backup"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                void run(async () => {
                  if (file.size > 20 * 1024 * 1024)
                    throw new Error(
                      "Choose an ArzDesk backup smaller than 20 MB.",
                    );
                  let incoming: unknown;
                  try {
                    incoming = JSON.parse(await file.text());
                    localStateSchema.parse(incoming);
                  } catch {
                    throw new Error(
                      "This file is not a supported ArzDesk backup. Your existing work was kept.",
                    );
                  }
                  const next = await deviceTransaction((current) =>
                    importLocalBackup(current, incoming),
                  );
                  saved(next);
                  setNotice(
                    "Backup imported as additional workspaces. Existing work was kept.",
                  );
                });
              }}
            />
          </label>
        </div>
        <details className="local-advanced">
          <summary>
            More storage options <ChevronDown size={16} aria-hidden="true" />
          </summary>
          <div className="local-extra-actions">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const granted = await navigator.storage?.persist?.();
                  setNotice(
                    granted
                      ? "Persistent device storage enabled. Keep making backups too."
                      : "Your browser did not grant persistent storage. Keep exporting backups regularly.",
                  );
                })
              }
            >
              <ShieldCheck size={16} />
              Protect device storage
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const response = await fetch("/api/offline-export", {
                    cache: "no-store",
                  });
                  if (response.status === 401)
                    throw new Error(
                      "Sign in to your online account first, then return here to copy its workspaces.",
                    );
                  if (!response.ok)
                    throw new Error(
                      "Online workspaces could not be copied. Connect to the internet and try again.",
                    );
                  const incoming = await response.json();
                  saved(
                    await deviceTransaction((current) =>
                      importLocalBackup(current, incoming),
                    ),
                  );
                  setNotice(
                    "Online workspaces copied to this device. Future changes are separate; automatic sync is not enabled.",
                  );
                })
              }
            >
              <Cloud size={16} />
              Copy online workspaces
            </Button>
          </div>
        </details>
        <p className="local-backup-footnote">
          Imports add copies without replacing existing work. Team invitations
          and passwords are not included.
        </p>
        <a href="/cloud" className="local-online-link">
          Open online account <ArrowRight size={15} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
  const status = (
    <div className="local-status" aria-live="polite">
      <span className="local-status-state">
        <HardDrive size={16} aria-hidden="true" />
        {ready ? "Ready for offline use" : "Preparing offline access…"}
      </span>
      <span className="local-status-caption">Saved on this device</span>
      {!!state?.organizations.length && (
        <a href="/offline#">
          Your workspaces <ArrowRight size={14} aria-hidden="true" />
        </a>
      )}
    </div>
  );
  const messages = (
    <>
      {error && (
        <p className="error local-message" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="notice local-message" role="status">
          {notice}
        </p>
      )}
    </>
  );
  if (!state)
    return (
      <main className="workspaces-page">
        <Brand />
        {messages}
        <p>Opening device storage…</p>
        {error && <Button onClick={() => void reload()}>Try again</Button>}
      </main>
    );
  const createForm = (
<form
  className="panel local-create"
  onSubmit={(e) => {
    e.preventDefault();
    void run(async () => {
      let id = "";
      saved(
        await deviceTransaction((current) => {
          const result = applyLocalAction(
            current,
            "organization.create",
            "",
            { name },
          );
          id = result.id;
          return result.state;
        }),
      );
      setName("");
      window.location.hash = `${id}/overview`;
    });
  }}
>
  <div className="local-form-heading">
    <span className="local-form-icon" aria-hidden="true">
      <Plus size={19} />
    </span>
    <div>
      <span className="local-section-eyebrow">GET STARTED</span>
      <h2>
        {state.organizations.length
          ? "Create another workspace"
          : "Create your first workspace"}
      </h2>
    </div>
  </div>
  <label className="field">
    Workspace name
    <input
      required
      maxLength={120}
      placeholder="Your business or project"
      value={name}
      onChange={(e) => setName(e.target.value)}
    />
  </label>
  <Button disabled={busy} type="submit">
    <Plus size={16} />
    Create workspace
  </Button>
</form>
  );
  if (org) {
    const data = localSnapshot(state, org.id);
    return (
      <WorkspaceRuntime.Provider
        value={{
          section,
          base: `/offline#${org.id}`,
          settings: backupPanel,
          refresh: () => {},
          mutate: async (action, id, input) => {
            try {
              let resultId: string | undefined;
              const next = await deviceTransaction((current) => {
                const result = applyLocalAction(current, action, id, input);
                resultId = result.id;
                return result.state;
              });
              saved(next);
              return { ok: true, id: resultId };
            } catch (e) {
              return {
                ok: false,
                error:
                  e instanceof z.ZodError
                    ? (e.issues[0]?.message ?? "Check your input.")
                    : e instanceof Error
                      ? e.message
                      : "Could not save on this device.",
              };
            }
          },
        }}
      >
        <WorkspaceShell
          organization={{ ...org, role: "owner" }}
          organizations={state.organizations}
          person={{ name: "On this device", email: "" }}
        >
          <div className="local-workspace-content">
            {status}
            {messages}
            <WorkspaceUI
              key={`${org.id}/${section}/${query}`}
              section={section}
              data={data}
              context={{
                clientId:
                  section === "projects"
                    ? (params.get("client") ?? undefined)
                    : undefined,
                projectId:
                  section === "tasks"
                    ? (params.get("project") ?? undefined)
                    : undefined,
              }}
            />
          </div>
        </WorkspaceShell>
      </WorkspaceRuntime.Provider>
    );
  }
  return (
    <main className="workspaces-page local-home">
      <header className="workspaces-head">
        <Brand />
        <ThemeSwitcher />
      </header>
      {status}
      {messages}
      {state.organizations.length ? (
        <div className="local-populated">
          <div className="workspace-welcome">
            <span className="eyebrow">YOUR SPACE · ON THIS DEVICE</span>
            <h1>Your workspaces.</h1>
            <p>
              Everything in one place, saved locally. Pick a workspace below to
              continue, even without an internet connection.
            </p>
          </div>
          <section className="local-workspaces" aria-label="Saved workspaces">
            <div className="local-workspaces-heading">
              <h2>Saved workspaces</h2>
              <span>{state.organizations.length} on this device</span>
            </div>
            <div className="org-grid">
              {state.organizations.map((o) => (
                <a className="org-card" key={o.id} href={`#${o.id}/overview`}>
                  <span className="workspace-monogram" aria-hidden="true">
                    {o.name[0]}
                  </span>
                  <div className="local-org-card-content">
                    <span className="role-caption">Local workspace</span>
                    <h3>{o.name}</h3>
                    <p>Open workspace <ArrowRight size={14} aria-hidden="true" /></p>
                  </div>
                </a>
              ))}
            </div>
          </section>
          <details className="local-add-workspace">
            <summary>
              <span><Plus size={17} aria-hidden="true" /> Create another workspace</span>
              <ChevronDown size={16} aria-hidden="true" />
            </summary>
            <div className="local-add-workspace-body">{createForm}</div>
          </details>
        </div>
      ) : (
        <div className="local-home-layout local-home-empty">
          <div className="workspace-welcome">
            <span className="eyebrow">WORKSPACE · ON THIS DEVICE</span>
            <h1>Your work. Even offline.</h1>
            <p>
              Organize clients, projects and tasks in one place. Your changes
              stay on this device — no account needed.
            </p>
          </div>
          {createForm}
        </div>
      )}
      {backupPanel}
    </main>
  );
}
