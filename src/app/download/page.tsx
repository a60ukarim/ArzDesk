import "./download.css";
import Link from "next/link";
import { ArrowLeft, Download, HardDrive, MonitorDown, ShieldCheck, WifiOff } from "lucide-react";
import { Brand } from "@/components/brand";

export const metadata = {
  title: "Download for Windows",
  description: "Install ArzDesk on Windows and work offline on your own device.",
};

export const dynamic = "force-dynamic";

export default function DownloadPage() {
  const installer = process.env.ARZDESK_WINDOWS_DOWNLOAD_URL;
  let downloadUrl: string | null = null;
  try {
    if (installer) {
      const parsed = new URL(installer);
      if (parsed.protocol === "https:") downloadUrl = parsed.toString();
    }
  } catch {
    // Never publish a broken or unverified download action.
  }

  return (
    <main className="download-page">
      <div className="download-container">
        <header className="download-header">
          <Brand />
          <Link href="/about"><ArrowLeft size={15} /> About ArzDesk</Link>
        </header>
        <section className="download-hero">
          <span className="download-eyebrow">WINDOWS DESKTOP APPLICATION</span>
          <h1>ArzDesk. Now on your desktop.</h1>
          <p>Keep clients, projects and tasks organized in a standalone Windows app — no browser tab or internet connection needed for local work.</p>
          <div className="download-cta">
            {downloadUrl ? (
              <a href={downloadUrl} className="download-windows-button">
                <Download size={21} /> Download for Windows (.exe)
              </a>
            ) : (
              <div className="download-unavailable" role="status">
                <MonitorDown size={20} /> Windows installer is in final testing
              </div>
            )}
            <span>Free and open source · Windows 10/11 · 64-bit</span>
          </div>
        </section>
        <section className="download-features" aria-label="Desktop features">
          <article><WifiOff size={22} /><h2>Truly offline</h2><p>The app interface is included with the installer, so it can launch and work without a connection.</p></article>
          <article><HardDrive size={22} /><h2>Stored on this PC</h2><p>Workspaces are saved in the app&apos;s local storage. Export backups regularly.</p></article>
          <article><ShieldCheck size={22} /><h2>Separate from the browser</h2><p>Already using our web app? Export your backup there, then import it into the desktop app.</p></article>
        </section>
        <p className="download-note">Important: Windows may warn when opening a new, unsigned app. Never bypass an unexpected warning without checking the publisher and download source.</p>
        <footer>ArzDesk — Built by ArzCore Technologies</footer>
      </div>
    </main>
  );
}
