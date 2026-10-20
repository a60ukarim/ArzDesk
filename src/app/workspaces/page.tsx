import Link from "next/link";
import { ArrowRight, Plus, Layers, Check } from "lucide-react";
import { DeveloperCredits } from "@/components/developer-credits";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Brand } from "@/components/brand";
import { AccountMenu } from "@/components/account-menu";
import { requireUser } from "@/lib/session";
import { workspace } from "@/features/workspace";
import { OrganizationForm } from "@/features/workspace/organization-form";
export default async function Page() {
  const user = await requireUser();
  const orgs = await workspace.listOrganizations(user.id);
  return (
    <main className="workspaces-page">
      <header className="workspaces-head">
        <Brand />
        <div className="workspace-account">
          <ThemeSwitcher />
          <AccountMenu person={{ name: user.name, email: user.email }} />
        </div>
      </header>
      {orgs.length ? (
        <>
          <div className="workspace-welcome">
            <span className="eyebrow">READY WHEN YOU ARE</span>
            <h1>Your workspaces</h1>
            <p>Choose your team’s workspace and pick up where you left off.</p>
          </div>
          <div className="org-grid">
            {orgs.map((org) => (
              <Link
                className="org-card"
                key={org.id}
                href={`/w/${org.id}/overview`}
              >
                <span className="workspace-monogram">
                  {org.name.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <span className="role-caption">
                    {org.role.charAt(0).toUpperCase() + org.role.slice(1)}
                  </span>
                  <h2>{org.name}</h2>
                  <p>
                    Open workspace
                    <ArrowRight size={14} />
                  </p>
                </div>
                <ArrowRight className="org-open-icon" size={20} />
              </Link>
            ))}
          </div>
          <details className="create-workspace-details">
            <summary>
              <Plus size={17} />
              Create another workspace
            </summary>
            <OrganizationForm />
          </details>
        </>
      ) : (
        <div className="first-workspace">
          <section className="workspace-welcome">
            <span className="eyebrow">YOUR FIRST STEP</span>
            <h1>
              Give your work
              <br />a place of its own.
            </h1>
            <p>
              Create one workspace for your business or team. Keep customers,
              projects and daily tasks together inside it.
            </p>
            <ul>
              <li>
                <Check size={16} />
                Add the people you work for
              </li>
              <li>
                <Check size={16} />
                Organize their projects
              </li>
              <li>
                <Check size={16} />
                Know what to work on next
              </li>
            </ul>
            <span className="workspace-private">
              <Layers size={16} />
              You can invite your team after setup.
            </span>
          </section>
          <OrganizationForm />
        </div>
      )}
      <footer className="footer">
        <DeveloperCredits />
        <span>ArzDesk · Your work, organized</span>
      </footer>
    </main>
  );
}
