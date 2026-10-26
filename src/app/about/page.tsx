import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./about.css";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Cloud,
  Download,
  HardDrive,
  Layers3,
  LockKeyhole,
} from "lucide-react";

export const metadata: Metadata = {
  title: "ArzDesk — Organize your work, online or offline",
  description:
    "Meet ArzDesk by ArzCore: a free, open-source workspace for clients, projects and tasks. Work locally without internet after setup or collaborate through online accounts.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "ArzDesk — Your work. One clear place.",
    description:
      "A free, open-source workspace for clients, projects and tasks. Device work runs offline after setup.",
    type: "website",
  },
};

const features = [
  {
    icon: HardDrive,
    title: "Work without internet",
    description:
      "Create workspaces, clients, projects and tasks on this device. Once the app is prepared, local work doesn't require an account or connection.",
  },
  {
    icon: Layers3,
    title: "Less switching. More doing.",
    description:
      "Keep clients, projects and tasks connected in separate workspaces. Track progress, priorities and deadlines in one place.",
  },
  {
    icon: Cloud,
    title: "Bring your team online",
    description:
      "Online accounts offer shared workspaces, invitations and permissions. This mode needs a connection and is separate from device work.",
  },
];

export default function AboutPage() {
  return (
    <main className="about-page min-h-screen bg-[#f7f7f5] text-[#181818]">
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link
          href="/about"
          className="flex items-center gap-3"
          aria-label="ArzDesk home"
        >
          <Image
            src="/arzdesk-logo-v1.png"
            width={46}
            height={46}
            alt="ArzDesk logo"
            className="h-11 w-11 object-contain"
            priority
          />
          <span className="flex flex-col leading-tight">
            <strong className="text-[20px] font-black tracking-tight">
              ArzDesk
            </strong>
            <span className="text-[11px] font-medium text-neutral-500">
              by ArzCore Technologies
            </span>
          </span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="flex flex-wrap items-center gap-2 sm:gap-5"
        >
          <a
            className="rounded-lg px-3 py-2 text-xs font-bold hover:bg-neutral-200"
            href="https://github.com/a60ukarim/ArzDesk"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open source <ArrowUpRight size={13} className="inline-block" />
          </a>
          <Link
            href="/install"
            className="launch-cta launch-cta--dark rounded-lg bg-[#181818] px-4 py-3 text-xs font-bold text-white hover:bg-neutral-700"
          >
            Install ArzDesk
          </Link>
        </nav>
      </header>

      <section className="mx-auto w-full max-w-6xl px-5 pb-6 sm:px-8">
        <div className="relative overflow-hidden rounded-[28px] bg-[#151515] px-6 py-14 text-white sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(#888 1px, transparent 1px), linear-gradient(90deg, #888 1px, transparent 1px)",
              backgroundSize: "46px 46px",
              maskImage: "linear-gradient(90deg, transparent 24%, black 100%)",
            }}
          />
          <div className="relative grid items-center gap-12 md:grid-cols-[1.2fr_0.8fr]">
            <div className="max-w-2xl">
              <span className="inline-block rounded-full border border-white/30 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.17em] text-neutral-200">
                Free · Open source · Installable web app
              </span>
              <h1 className="mt-7 text-[clamp(38px,6.5vw,76px)] font-black leading-[1.04] tracking-[-0.045em]">
                Make room for what matters.
              </h1>
              <p className="mt-6 max-w-lg text-[15px] font-medium leading-7 text-neutral-300">
                Your clients. Your projects. Your next move. ArzDesk puts
                everyday work in one clear place — including a device mode that
                works offline after setup.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/offline"
                  className="launch-cta launch-cta--light inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-extrabold text-black hover:bg-neutral-200"
                >
                  Start free <ArrowRight size={16} />
                </Link>
                <Link
                  href="/install"
                  className="launch-cta launch-cta--hero-outline inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/35 px-5 py-3 text-xs font-extrabold text-white hover:bg-white/10"
                >
                  <Download size={16} /> Install on your device
                </Link>
              </div>
              <p className="mt-5 text-[11px] font-medium text-neutral-400">
                No sign-up needed for device work. Shared team accounts need
                internet.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/25 bg-white/[0.06] p-5 shadow-[0_32px_90px_rgba(0,0,0,.3)] backdrop-blur-sm sm:p-7">
              <div className="flex items-center justify-between border-b border-white/15 pb-5">
                <strong className="text-sm font-extrabold">
                  A clearer way to work
                </strong>
                <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] text-neutral-300">
                  ONE WORKSPACE
                </span>
              </div>
              {[
                ["01", "Clients", "Keep relationships organized"],
                ["02", "Projects", "Give every job a place"],
                ["03", "Tasks", "Know what comes next"],
              ].map(([number, label, subtext]) => (
                <div
                  key={number}
                  className="flex gap-4 border-b border-white/15 py-5 last:border-0"
                >
                  <span className="font-mono text-xs text-neutral-400">
                    {number}
                  </span>
                  <div>
                    <strong className="text-lg font-bold">{label}</strong>
                    <p className="mt-1 text-xs font-medium text-neutral-400">
                      {subtext}
                    </p>
                  </div>
                  <CheckCircle2
                    className="ml-auto mt-1 shrink-0 text-neutral-400"
                    size={18}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-20"
        aria-labelledby="features-title"
      >
        <div className="mb-8 max-w-xl">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-neutral-500">
            Made for the everyday
          </p>
          <h2
            id="features-title"
            className="mt-3 text-3xl font-black tracking-tight sm:text-4xl"
          >
            Everything has its place.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-[22px] border border-neutral-200 bg-white p-7"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100">
                <Icon size={21} aria-hidden="true" />
              </span>
              <h3 className="mt-6 text-xl font-extrabold tracking-tight">
                {title}
              </h3>
              <p className="mt-3 text-sm font-medium leading-7 text-neutral-600">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white" aria-labelledby="getting-started-title">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-[0.8fr_1.2fr] md:py-20">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-neutral-500">
              Three simple steps
            </p>
            <h2
              id="getting-started-title"
              className="mt-3 text-3xl font-black tracking-tight sm:text-4xl"
            >
              Get started in minutes.
            </h2>
          </div>
          <ol className="space-y-6">
            {[
              [
                "Open ArzDesk",
                "Choose Start free to open device mode. No account is needed.",
              ],
              [
                "Wait for offline readiness",
                "Connect once and look for “Ready for offline use” before going offline.",
              ],
              [
                "Make a backup",
                "Add your work and export a JSON backup to another safe location regularly.",
              ],
            ].map(([heading, description], index) => (
              <li
                key={heading}
                className="flex gap-5 border-b border-neutral-200 pb-6 last:border-0"
              >
                <span className="text-sm font-black text-neutral-400">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="text-base font-extrabold">{heading}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-neutral-600">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8"
        aria-labelledby="good-to-know-title"
      >
        <h2
          id="good-to-know-title"
          className="text-2xl font-black tracking-tight"
        >
          Good to know before you start
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-neutral-300 p-6">
            <HardDrive aria-hidden="true" size={20} />
            <h3 className="mt-3 text-base font-extrabold">
              Device data stays on your device
            </h3>
            <p className="mt-2 text-sm font-medium leading-6 text-neutral-600">
              Offline work is stored in this browser. Clearing its data or
              losing the device can erase your work. Export backups. Device work
              does not automatically sync with online accounts or other devices.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-300 p-6">
            <LockKeyhole aria-hidden="true" size={20} />
            <h3 className="mt-3 text-base font-extrabold">
              An installable web app, not an EXE
            </h3>
            <p className="mt-2 text-sm font-medium leading-6 text-neutral-600">
              Install with Chrome, Edge or Safari on supported devices. Online
              workspaces, sign-in and team sharing require a connection. Local
              device mode does not password-protect its records from others
              using the same browser profile.
            </p>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/install"
            className="launch-cta launch-cta--dark inline-flex items-center gap-2 rounded-xl bg-[#181818] px-6 py-4 text-xs font-extrabold text-white hover:bg-neutral-700"
          >
            See installation steps <ArrowRight size={16} />
          </Link>
          <a
            href="https://github.com/a60ukarim/ArzDesk"
            target="_blank"
            rel="noopener noreferrer"
            className="launch-cta launch-cta--outline inline-flex items-center gap-2 rounded-xl border border-neutral-300 px-6 py-4 text-xs font-extrabold hover:bg-neutral-200"
          >
            Explore the source <ArrowUpRight size={16} />
          </a>
        </div>
      </section>

      <footer className="border-t border-neutral-200 bg-white px-5 py-7 sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold">
            ArzDesk · Built by ArzCore Technologies
          </span>
          <span className="text-xs font-medium text-neutral-500">
            Open-source software · MIT License
          </span>
        </div>
      </footer>
    </main>
  );
}
