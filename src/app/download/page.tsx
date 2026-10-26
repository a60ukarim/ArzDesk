import "./download.css";
import Link from "next/link";
import {
  ArrowLeft,
  Apple,
  Download,
  HardDrive,
  Laptop,
  MonitorDown,
  ShieldCheck,
  Smartphone,
  WifiOff,
} from "lucide-react";
import { Brand } from "@/components/brand";

export const metadata = {
  title: "Download ArzDesk for Windows, Mac, Android and iPhone",
  description:
    "Get ArzDesk on Windows, macOS, Android, iPhone or iPad. Local work can run offline after initial setup.",
};

export const dynamic = "force-dynamic";

function secureDownload(name: string): string | null {
  const raw = process.env[name];
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    // Standalone installers live on a trusted public download host,
    // not on personal GitHub release pages.
    if (/^(www\.)?github\.com$/i.test(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export default function DownloadPage() {
  const windows = secureDownload("ARZDESK_WINDOWS_DOWNLOAD_URL");
  const macArm = secureDownload("ARZDESK_MAC_ARM64_DOWNLOAD_URL");
  const macIntel = secureDownload("ARZDESK_MAC_INTEL_DOWNLOAD_URL");
  const android = secureDownload("ARZDESK_ANDROID_DOWNLOAD_URL");

  return (
    <main className="download-page">
      <div className="download-container">
        <header className="download-header">
          <Brand />
          <Link href="/about">
            <ArrowLeft size={15} aria-hidden="true" />
            About ArzDesk
          </Link>
        </header>

        <section className="download-hero">
          <span className="download-eyebrow">ARZDESK · ALL YOUR DEVICES</span>
          <h1>Your workspace. Wherever you are.</h1>
          <p>
            Choose your device to get started. Keep local work on your device,
            even when the internet is unavailable after setup.
          </p>
        </section>

        <section className="download-platform-grid" aria-label="Get ArzDesk">
          <article className="download-platform">
            <div className="download-platform-top">
              <Laptop size={25} aria-hidden="true" />
              <span>Windows 10 &amp; 11 · 64-bit</span>
            </div>
            <h2>Windows</h2>
            <p>
              A dedicated desktop application with local, offline workspaces.
            </p>
            {windows ? (
              <a className="download-platform-primary" href={windows}>
                <Download size={18} aria-hidden="true" />
                Download .exe
              </a>
            ) : (
              <div className="download-platform-pending" role="status">
                <MonitorDown size={17} aria-hidden="true" />
                Windows installer in testing
              </div>
            )}
          </article>

          <article className="download-platform">
            <div className="download-platform-top">
              <Apple size={25} aria-hidden="true" />
              <span>macOS · Apple Silicon / Intel</span>
            </div>
            <h2>MacBook &amp; Mac</h2>
            <p>
              A desktop version for both modern Apple Silicon and Intel Macs.
            </p>
            {macArm || macIntel ? (
              <div className="download-platform-options">
                {macArm && (
                  <a className="download-platform-primary" href={macArm}>
                    <Download size={17} aria-hidden="true" />
                    Apple Silicon .dmg
                  </a>
                )}
                {macIntel && (
                  <a className="download-platform-secondary" href={macIntel}>
                    <Download size={17} aria-hidden="true" />
                    Intel .dmg
                  </a>
                )}
              </div>
            ) : (
              <div className="download-platform-pending" role="status">
                <MonitorDown size={17} aria-hidden="true" />
                Mac installer in development
              </div>
            )}
          </article>

          <article className="download-platform">
            <div className="download-platform-top">
              <Smartphone size={25} aria-hidden="true" />
              <span>Android · Phones &amp; tablets</span>
            </div>
            <h2>Android</h2>
            <p>
              Install the web app on your home screen now. Native APK support is
              planned.
            </p>
            <Link
              className="download-platform-primary"
              href="/install#installation-steps"
            >
              <Download size={17} aria-hidden="true" />
              Install on Android (PWA)
            </Link>
            {android && (
              <a className="download-platform-secondary" href={android}>
                <Download size={17} aria-hidden="true" />
                Download Android APK
              </a>
            )}
          </article>

          <article className="download-platform">
            <div className="download-platform-top">
              <Apple size={25} aria-hidden="true" />
              <span>iOS · iPhone &amp; iPad</span>
            </div>
            <h2>iPhone &amp; iPad</h2>
            <p>
              Use Safari’s Add to Home Screen option. A native App Store release
              is not available yet.
            </p>
            <Link
              className="download-platform-primary"
              href="/install#installation-steps"
            >
              <Download size={17} aria-hidden="true" />
              Install on iPhone (PWA)
            </Link>
          </article>
        </section>

        <section className="download-details" aria-label="Before you install">
          <div>
            <WifiOff size={22} aria-hidden="true" />
            <h2>Works offline</h2>
            <p>
              Desktop bundles will include local app files. Phone PWAs need one
              online visit to prepare offline access.
            </p>
          </div>
          <div>
            <HardDrive size={22} aria-hidden="true" />
            <h2>Stored on each device</h2>
            <p>
              Phone, browser and desktop workspaces are separate. Export and
              import a backup to move local work.
            </p>
          </div>
          <div>
            <ShieldCheck size={22} aria-hidden="true" />
            <h2>Direct downloads</h2>
            <p>
              When installer builds are verified, they will be hosted directly,
              without sending users to a personal GitHub page.
            </p>
          </div>
        </section>

        <p className="download-note">
          Windows and macOS installers are undergoing testing. On iPhone and
          Android, the installable PWA is available now. Desktop installers may
          require publisher signing before wide distribution.
        </p>
        <footer>ArzDesk — Built by ArzCore Technologies</footer>
      </div>
    </main>
  );
}
