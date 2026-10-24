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
    <section className="panel settings-card local-backup">
      <span className="entity-icon">
        <HardDrive size={22} />
      </span>
      <h2>Your device, your data</h2>
      <p>
        Changes stay in this browser on this device. No account or password is
        needed. Other people using this browser can open them too.
      </p>
      <p>
        Export backups regularly. Clearing site data, removing the browser
        profile or losing this device can erase local work.
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
      <p>
        Importing adds copies and never replaces existing work. Team invitations
        and passwords are not included.
      </p>
      <a href="/cloud" className="local-online-link">
        Open online account →
      </a>
    </section>
  );
  const status = (
    <div className="local-status" aria-live="polite">
      <HardDrive size={15} />
      <span>
        {ready
          ? "Ready for offline use · Saved on this device"
          : "Saved on this device · Preparing offline access…"}
      </span>
      <a href="/offline#">Your workspaces</a>
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
      <div className="workspace-welcome">
        <span className="eyebrow">ON THIS DEVICE</span>
        <h1>Your work. Even offline.</h1>
        <p>
          Create a workspace and start organizing. Everything is saved here,
          without an account or internet connection.
        </p>
      </div>
      <div className="org-grid">
        {state.organizations.map((o) => (
          <a className="org-card" key={o.id} href={`#${o.id}/overview`}>
            <span className="workspace-monogram">{o.name[0]}</span>
            <div>
              <span className="role-caption">On this device</span>
              <h2>{o.name}</h2>
              <p>Open workspace →</p>
            </div>
          </a>
        ))}
      </div>
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
        <h2>
          {state.organizations.length
            ? "Create another workspace"
            : "Create your first workspace"}
        </h2>
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
      {backupPanel}
    </main>
  );
}
