const WEB = "https://arzdesk-sage.vercel.app";
const HOME = "arzdesk://local/offline";

function destination(value) {
  try {
    const url = new URL(value);
    if (url.username || url.password) return { kind: "blocked" };
    if (url.protocol === "arzdesk:" && url.hostname === "local" && !url.port) {
      if (url.pathname === "/offline")
        return { kind: "device", url: HOME + url.search + url.hash };
      return destination(WEB + url.pathname + url.search + url.hash);
    }
    if (url.origin === WEB) {
      if (["/", "/start", "/offline"].includes(url.pathname))
        return { kind: "device", url: HOME + url.hash };
      return { kind: "online", url: url.href };
    }
    if (url.protocol === "https:" || url.protocol === "mailto:")
      return { kind: "external", url: url.href };
  } catch {
    // Invalid addresses never enter an account window.
  }
  return { kind: "blocked" };
}

module.exports = { WEB, HOME, destination };
