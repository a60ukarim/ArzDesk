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
          Get the standalone application for Windows or Mac, or add ArzDesk to
          your phone’s home screen.
        </p>
        <div className="install-actions">
          <AppInstall />
        </div>
        <small>
          Phone installations need one online visit to prepare offline access.
          Device work stays local; team accounts need internet.
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
            Choose the Windows installer (.exe) or the Mac disk image (.dmg)
            from our download page. On Windows, run the installer. On Mac, open
            the disk image and drag ArzDesk to Applications. Then open ArzDesk
            from the Start menu or Applications folder.
          </p>
          <Link className="btn btn-outline" href="/download">
            Desktop downloads
          </Link>
        </article>
        <article>
          <Smartphone />
          <h2>Android</h2>
          <p>
            Open this page in Chrome on your Android device. Tap the three-dot
            menu (⋮), then choose <strong>Install app</strong> or{" "}
            <strong>Add to Home screen</strong> and confirm. Then open ArzDesk
            from its home screen icon.
          </p>
        </article>
        <article>
          <Smartphone />
          <h2>iPhone &amp; iPad</h2>
          <p>
            Open this page in Safari on your iPhone or iPad. Tap{" "}
            <strong>Share</strong>, then choose{" "}
            <strong>Add to Home Screen</strong> and tap <strong>Add</strong>.
            Then open ArzDesk from its home screen icon.
          </p>
        </article>
      </section>
      <footer className="install-footer">
        <Link href="/about">
          <ArrowLeft size={15} />
          About ArzDesk
        </Link>
        <span>ArzDesk · by ArzCore</span>
      </footer>
    </main>
  );
}
