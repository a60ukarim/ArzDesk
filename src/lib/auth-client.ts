"use client";

import { createAuthClient } from "better-auth/react";

// The Electron device-only desktop shell uses a secure custom URL scheme.
// Better Auth accepts only http(s) base URLs, even though auth isn't used for
// local work. Providing a valid public HTTPS URL only in Electron prevents
// initialization errors while keeping the web app's same-origin auth behavior.
const desktopOrigin =
  typeof window !== "undefined" && window.location.protocol === "arzdesk:"
    ? "https://arzdesk-sage.vercel.app"
    : undefined;

export const authClient = createAuthClient({
  baseURL: desktopOrigin,
});
