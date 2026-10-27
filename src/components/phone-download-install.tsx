"use client";

import { useState, useSyncExternalStore } from "react";
import { Download } from "lucide-react";
import { useClientReady } from "@/lib/use-client-ready";
import {
  clearInstallPrompt,
  getInstallPrompt,
  subscribeInstallPrompt,
} from "@/lib/app-install-state";

function installed() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    !!(navigator as Navigator & { standalone?: boolean }).standalone
  );
}
function subscribeInstalled(notify: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", notify);
  window.addEventListener("appinstalled", notify);
  return () => {
    media.removeEventListener("change", notify);
    window.removeEventListener("appinstalled", notify);
  };
}

export function PhoneDownloadInstall({
  platform,
}: {
  platform: "android" | "ios";
}) {
  const ready = useClientReady();
  const isInstalled = useSyncExternalStore(
    subscribeInstalled,
    installed,
    () => false,
  );
  const prompt = useSyncExternalStore(
    subscribeInstallPrompt,
    getInstallPrompt,
    () => null,
  );
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const android = ready && /Android/i.test(navigator.userAgent);
  const ios =
    ready &&
    (/iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
  const matchingDevice = platform === "android" ? android : ios;
  const label = platform === "android" ? "Android" : "iPhone & iPad";
  const stepsId = `install-${platform}-steps`;

  if (matchingDevice && isInstalled)
    return (
      <div className="download-phone-install">
        <p role="status">ArzDesk is installed on this device.</p>
        <a className="download-platform-primary" href="/offline">
          Open ArzDesk
        </a>
      </div>
    );

  return (
    <div className="download-phone-install">
      <button
        className="download-platform-primary"
        type="button"
        disabled={busy}
        aria-expanded={expanded}
        aria-controls={stepsId}
        onClick={async () => {
          setExpanded(true);
          if (platform !== "android" || !android || !prompt || busy) return;
          setBusy(true);
          // An install invitation can only be used once, including after dismissal.
          clearInstallPrompt();
          try {
            await prompt.prompt();
            const choice = await prompt.userChoice;
            setMessage(
              choice.outcome === "accepted"
                ? "Installation accepted. When it finishes, open ArzDesk from your home screen."
                : "Installation was cancelled. To install now, follow the steps below.",
            );
          } catch {
            setMessage("To install ArzDesk, follow the steps below.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Download size={17} aria-hidden="true" />
        {busy ? "Installing…" : `Install on ${label}`}
      </button>
      <div id={stepsId} hidden={!expanded} className="download-phone-steps">
        {message && <p role="status">{message}</p>}
        {platform === "android" ? (
          <p>
            On your Android phone, open this page in Chrome. Tap{" "}
            <strong>⋮</strong>, choose <strong>Install app</strong> or{" "}
            <strong>Add to Home screen</strong>, then confirm.
          </p>
        ) : (
          <p>
            On your iPhone or iPad, open this page in Safari. Tap{" "}
            <strong>Share</strong>, choose <strong>Add to Home Screen</strong>,
            then tap <strong>Add</strong>.
          </p>
        )}
        <p>
          Open ArzDesk using its icon on your home screen. No app store account
          is needed.
        </p>
      </div>
    </div>
  );
}
