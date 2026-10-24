"use client";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Download, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { useClientReady } from "@/lib/use-client-ready";
import {
  getInstallPrompt,
  subscribeInstallPrompt,
  clearInstallPrompt,
} from "@/lib/app-install-state";
function installed() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    !!(navigator as Navigator & { standalone?: boolean }).standalone
  );
}
function subscribe(notify: () => void) {
  const query = window.matchMedia("(display-mode: standalone)");
  query.addEventListener("change", notify);
  window.addEventListener("appinstalled", notify);
  return () => {
    query.removeEventListener("change", notify);
    window.removeEventListener("appinstalled", notify);
  };
}
export function AppInstall() {
  const ready = useClientReady();
  const isInstalled = useSyncExternalStore(subscribe, installed, () => false);
  const prompt = useSyncExternalStore(
    subscribeInstallPrompt,
    getInstallPrompt,
    () => null,
  );
  const [message, setMessage] = useState("");
  return (
    <>
      {isInstalled ? (
        <p className="install-success">
          <CheckCircle2 size={19} />
          ArzDesk is installed on this device.
        </p>
      ) : prompt ? (
        <Button
          onClick={async () => {
            try {
              await prompt.prompt();
              const choice = await prompt.userChoice;
              setMessage(
                choice.outcome === "accepted"
                  ? "Follow your browser’s steps to finish installing ArzDesk."
                  : "You can install ArzDesk later from this page.",
              );
            } catch {
              setMessage("Use the installation steps below to continue.");
            } finally {
              clearInstallPrompt();
            }
          }}
        >
          <Download size={18} />
          Install ArzDesk
        </Button>
      ) : (
        <a className="btn btn-outline" href="#installation-steps">
          <Download size={18} />
          How to install
        </a>
      )}
      {ready && !window.isSecureContext && (
        <p className="notice">
          Installation needs a secure HTTPS address. You can keep using ArzDesk
          in this browser.
        </p>
      )}
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <Button asChild variant="outline">
        <Link href="/offline">
          Open workspace
          <ArrowRight size={16} />
        </Link>
      </Button>
    </>
  );
}
