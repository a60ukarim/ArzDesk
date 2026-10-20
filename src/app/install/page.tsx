import Link from "next/link";
import Image from "next/image";
import { Monitor, Smartphone, ArrowLeft } from "lucide-react";
import { Brand } from "@/components/brand";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AppInstall } from "@/components/app-install";
export const metadata = { title: "Install ArzDesk" };
export default function Page() {
  return (
    <main className="install-page">
      <header className="auth-header">
        <Brand />
        <ThemeSwitcher />
      </header>
      <section className="install-intro">
        <Image
          src="/arzdesk-logo-v1.png"
          width={80}
          height={80}
          alt="ArzDesk logo"
        />
        <span className="eyebrow">YOUR WORK. ONE TAP AWAY.</span>
        <h1>ArzDesk, on your device.</h1>
        <p>
          Keep ArzDesk on your desktop or home screen. Sign in to the same
          account to access your workspaces on any device.
        </p>
        <div className="install-actions">
          <AppInstall />
        </div>
        <small>
          An internet connection is needed to work with your account and data.
        </small>
      </section>
      <section
        id="installation-steps"
        className="installation-steps"
        aria-label="Installation steps"
      >
        <article>
          <Monitor />
          <h2>Windows &amp; Mac</h2>
          <p>
            Open this address in Chrome or Edge. Use the install icon in the
            address bar, or select <strong>Install ArzDesk</strong> from the
            browser menu.
          </p>
        </article>
        <article>
          <Smartphone />
          <h2>Android</h2>
          <p>
            Open this address in Chrome. Tap the browser menu, then{" "}
            <strong>Install app</strong> or <strong>Add to Home screen</strong>.
          </p>
        </article>
        <article>
          <Smartphone />
          <h2>iPhone &amp; iPad</h2>
          <p>
            Open this address in Safari. Tap <strong>Share</strong>, then{" "}
            <strong>Add to Home Screen</strong> and confirm.
          </p>
        </article>
      </section>
      <footer className="install-footer">
        <Link href="/sign-in">
          <ArrowLeft size={15} />
          Back to sign in
        </Link>
        <span>ArzDesk · by ArzCore</span>
      </footer>
    </main>
  );
}
