type ReturnContext = "account" | "install";
const key = (context: ReturnContext) => `arzdesk-${context}-return`;

export function safeWorkspaceReturn(value: string | null) {
  if (!value?.startsWith("/") || value.startsWith("//")) return null;
  try {
    const url = new URL(value, "https://arzdesk.invalid");
    if (url.origin !== "https://arzdesk.invalid") return null;
    if (
      !["/cloud", "/workspaces"].includes(url.pathname) &&
      !/^\/w\/[a-zA-Z0-9-]+(?:\/(?:overview|clients|projects|tasks|team|settings))?\/?$/.test(
        url.pathname,
      )
    )
      return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

export function getWorkspaceReturn(context: ReturnContext, fallback: string) {
  try {
    return (
      safeWorkspaceReturn(sessionStorage.getItem(key(context))) || fallback
    );
  } catch {
    return fallback;
  }
}

export function rememberWorkspaceReturn(context: ReturnContext) {
  // Profile/install detours retain the workspace selected before entering settings.
  const target =
    safeWorkspaceReturn(
      window.location.pathname + window.location.search + window.location.hash,
    ) || getWorkspaceReturn("account", "/cloud");
  try {
    sessionStorage.setItem(key(context), target);
  } catch {}
}
