"use client";
import { WorkspaceLink as Link } from "./runtime";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ListTodo,
  Settings2,
  Building2,
  ChevronRight,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import { AccountMenu } from "@/components/account-menu";
import { NotificationBell } from "@/components/notification-bell";
import { Brand } from "@/components/brand";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useWorkspaceRuntime } from "./runtime";
import { QuickGuide } from "./quick-guide";
const sections = [
  {
    id: "overview",
    label: "Overview",
    detail: "Your daily overview",
    icon: LayoutDashboard,
  },
  { id: "clients", label: "Clients", detail: "Who you work for", icon: Users },
  {
    id: "projects",
    label: "Projects",
    detail: "Jobs to deliver",
    icon: FolderKanban,
  },
  { id: "tasks", label: "Tasks", detail: "Steps to finish", icon: ListTodo },
  { id: "team", label: "Team", detail: "People with access", icon: Users },
  {
    id: "settings",
    label: "Settings",
    detail: "Workspace preferences",
    icon: Settings2,
  },
];
export function WorkspaceShell({
  children,
  organization,
  organizations,
  person,
}: {
  children: React.ReactNode;
  organization: { id: string; name: string; role: string };
  organizations: { id: string; name: string }[];
  person: { name: string; email: string };
}) {
  const pathname = usePathname();
  const { router, local } = useWorkspaceRuntime();
  const drawer = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const section = local?.section ?? (pathname.split("/")[3] || "overview");
  const base = local?.base ?? `/w/${organization.id}`;
  function closeMenu() {
    drawer.current?.close();
  }
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1101px)");
    const closeOnDesktop = () => {
      if (desktop.matches) drawer.current?.close();
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  const navigation = sections
    .filter((s) => !local || s.id !== "team")
    .map((s) => (
      <Link
        key={s.id}
        href={`${base}/${s.id}`}
        aria-label={s.label}
        aria-current={section === s.id ? "page" : undefined}
        className={section === s.id ? "active" : ""}
        prefetch={false}
        onMouseEnter={() => router.prefetch(`${base}/${s.id}`)}
        onFocus={() => router.prefetch(`${base}/${s.id}`)}
        onClick={closeMenu}
      >
        <s.icon size={17} />
        <span className="nav-copy">
          <strong>{s.label}</strong>
          <small>{s.detail}</small>
        </span>
      </Link>
    ));
  return (
    <div className="app-shell">
      <a href="#main-content" className="sr-only focus:not-sr-only">
        Skip to content
      </a>
      <aside className="sidebar">
        <Brand />
        <div>
          <p className="eyebrow">WORKSPACE</p>
          <nav className="nav" aria-label="Workspace navigation">
            {navigation}
          </nav>
        </div>
        <div className="sidebar-workspace">
          <span className="eyebrow">CURRENT WORKSPACE</span>
          <strong>{organization.name}</strong>
          <Link href={local ? "/offline#" : "/workspaces"}>
            Switch workspace <ArrowRight size={14} />
          </Link>
        </div>
      </aside>
      <dialog
        id={menuId}
        ref={drawer}
        className="workspace-drawer"
        aria-label="Workspace menu"
        onClose={() => setMenuOpen(false)}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            closeMenu();
        }}
      >
        <div className="workspace-drawer-heading">
          <Brand />
          <button
            type="button"
            className="drawer-close"
            aria-label="Close workspace menu"
            onClick={closeMenu}
          >
            <X size={22} />
          </button>
        </div>
        <p className="eyebrow">WORKSPACE</p>
        <nav className="nav" aria-label="Mobile workspace navigation">
          {navigation}
        </nav>
        <div className="sidebar-workspace">
          <span className="eyebrow">CURRENT WORKSPACE</span>
          <strong dir="auto">{organization.name}</strong>
          <Link href={local ? "/offline#" : "/workspaces"} onClick={closeMenu}>
            Switch workspace <ArrowRight size={14} />
          </Link>
        </div>
      </dialog>
      <div className="app-main">
        <header className="topbar">
          <div className="mobile-workspace-heading">
            <button
              type="button"
              className="workspace-menu-trigger"
              aria-label="Open workspace menu"
              aria-haspopup="dialog"
              aria-controls={menuId}
              aria-expanded={menuOpen}
              onClick={() => {
                drawer.current?.showModal();
                setMenuOpen(true);
              }}
            >
              <Menu size={21} />
              <span>Menu</span>
            </button>
            <Brand />
          </div>
          <div className="breadcrumb">
            <Building2 size={15} />
            <span>{organization.name}</span>
            <ChevronRight size={12} />
            <b>{sections.find((s) => s.id === section)?.label}</b>
          </div>
          <div className="top-right">
            <ThemeSwitcher />
            <QuickGuide base={base} />
            <label className="sr-only" htmlFor="workspace-switcher">
              Switch workspace
            </label>
            <select
              id="workspace-switcher"
              className="workspace-select"
              value={organization.id}
              onChange={(e) =>
                router.push(
                  e.target.value === "all-workspaces"
                    ? local
                      ? "/offline#"
                      : "/workspaces"
                    : local
                      ? `/offline#${e.target.value}/overview`
                      : `/w/${e.target.value}/overview`,
                )
              }
            >
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
              <option value="all-workspaces">All workspaces…</option>
            </select>
            {local ? (
              <span className="local-device-badge">On this device</span>
            ) : (
              <>
                <NotificationBell />
                <AccountMenu person={person} />
              </>
            )}
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
