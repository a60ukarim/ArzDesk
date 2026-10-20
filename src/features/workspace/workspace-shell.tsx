"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ListTodo,
  Settings2,
  Building2,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { AccountMenu } from "@/components/account-menu";
import { Brand } from "@/components/brand";
import { ThemeSwitcher } from "@/components/theme-switcher";
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
  const router = useRouter();
  const shell = useRef<HTMLDivElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const section = pathname.split("/")[3] || "overview";
  const base = `/w/${organization.id}`;
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (sidebar.current)
        shell.current?.style.setProperty(
          "--mobile-nav-height",
          `${sidebar.current.getBoundingClientRect().height}px`,
        );
    });
    if (sidebar.current) observer.observe(sidebar.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="app-shell" ref={shell}>
      <a href="#main-content" className="sr-only focus:not-sr-only">
        Skip to content
      </a>
      <aside className="sidebar" ref={sidebar}>
        <Brand />
        <div>
          <p className="eyebrow">WORKSPACE</p>
          <nav className="nav" aria-label="Workspace navigation">
            {sections.map((s) => (
              <Link
                key={s.id}
                href={`${base}/${s.id}`}
                aria-label={s.label}
                aria-current={section === s.id ? "page" : undefined}
                className={section === s.id ? "active" : ""}
                prefetch={false}
                onMouseEnter={() => router.prefetch(`${base}/${s.id}`)}
                onFocus={() => router.prefetch(`${base}/${s.id}`)}
              >
                <s.icon size={17} />
                <span className="nav-copy">
                  <strong>{s.label}</strong>
                  <small>{s.detail}</small>
                </span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="sidebar-workspace">
          <span className="eyebrow">CURRENT WORKSPACE</span>
          <strong>{organization.name}</strong>
          <Link href="/workspaces">
            Switch workspace <ArrowRight size={14} />
          </Link>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
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
                    ? "/workspaces"
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
            <AccountMenu person={person} />
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
