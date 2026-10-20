import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Brand } from "@/components/brand";
import { ShieldCheck } from "lucide-react";
import { AuthIllustration } from "./auth-illustration";
export type AuthView =
  "sign-in" | "sign-up" | "forgot-password" | "reset-password";
const content = {
  "sign-in": {
    eyebrow: "WELCOME BACK",
    title: "Right where you left off.",
    description: "Your team, projects and next steps are waiting. Come on in.",
    caption: "YOUR WORKSPACE. READY WHEN YOU ARE.",
  },
  "sign-up": {
    eyebrow: "SOMETHING GOOD STARTS HERE",
    title: "Build your next chapter.",
    description:
      "Give your team a shared home for clients, projects and everyday progress.",
    caption: "START SMALL. MAKE ROOM TO GROW.",
  },
  "forgot-password": {
    eyebrow: "LET’S GET YOU BACK IN",
    title: "A way back to your work.",
    description:
      "Forgot your password? We’ll send a private recovery link to your email.",
    caption: "ONE LINK. A FRESH WAY IN.",
  },
  "reset-password": {
    eyebrow: "A FRESH START",
    title: "New password. Peace of mind.",
    description:
      "Choose a strong password to secure your account and return to your workspace.",
    caption: "YOUR NEXT STEP STARTS WITH SECURITY.",
  },
};
export function AuthShell({
  children,
  view,
}: {
  children: React.ReactNode;
  view: AuthView;
}) {
  const copy = content[view];
  return (
    <main className={`auth-page auth-view-${view}`}>
      <header className="auth-header">
        <Brand />
        <ThemeSwitcher />
      </header>
      <noscript>
        <p className="notice">
          JavaScript is required to sign in. Enable it in your browser and
          reload this page.
        </p>
      </noscript>
      <div className="auth-layout">
        <aside className="auth-intro">
          <span className="eyebrow">{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
          <div className="auth-art" aria-hidden="true">
            <AuthIllustration view={view} />
            <span className="art-caption">{copy.caption}</span>
          </div>
          <p className="auth-assurance">
            <ShieldCheck size={16} />A private space for your team.
          </p>
        </aside>
        <section className="auth-container">{children}</section>
      </div>
      <footer className="auth-footer">
        <span>ArzDesk · Built by ArzCore Technologies</span>
        <Link href="/install">Install ArzDesk</Link>
      </footer>
    </main>
  );
}
