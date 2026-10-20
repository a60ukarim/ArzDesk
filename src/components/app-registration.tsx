"use client";
import { useEffect } from "react";
import {
  captureInstallPrompt,
  clearInstallPrompt,
} from "@/lib/app-install-state";
export function AppRegistration() {
  useEffect(() => {
    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", clearInstallPrompt);
    if (
      process.env.NODE_ENV === "production" &&
      window.isSecureContext &&
      "serviceWorker" in navigator
    )
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          // Web use remains available when a browser blocks installation support.
        });
    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", clearInstallPrompt);
    };
  }, []);
  return null;
}
