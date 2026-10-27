const { app, BrowserWindow, protocol, shell } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");
const { HOME, destination } = require("./navigation.cjs");

const SCHEME = "arzdesk";

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);
app.setName("ArzDesk");
const smokeMode = process.argv.includes("--smoke-test");
if (smokeMode) {
  if (
    process.env.ARZDESK_EXPECTED_ARCH &&
    process.arch !== process.env.ARZDESK_EXPECTED_ARCH
  )
    throw Error("Wrong packaged architecture");
  const profile = process.env.ARZDESK_SMOKE_PROFILE;
  if (
    !profile ||
    !path.isAbsolute(profile) ||
    !path.basename(profile).startsWith("arzdesk-qa-")
  )
    throw Error("Desktop smoke tests require an isolated arzdesk-qa-* profile");
  require("node:fs").mkdirSync(profile, { recursive: true });
  app.setPath("userData", profile);
}

if (process.platform === "win32") app.setAppUserModelId("com.arzcore.arzdesk");

const folder = app.isPackaged
  ? path.join(process.resourcesPath, "app-bundle")
  : path.join(__dirname, "bundle");

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".json": "application/json",
};

function asset(request) {
  const address = new URL(request.url);
  if (address.hostname !== "local" || request.method !== "GET") return null;
  let name;
  try {
    name = decodeURIComponent(address.pathname);
  } catch {
    return null;
  }
  if (name === "/" || name === "/offline") name = "/offline/index.html";
  // Next/Image optimizes branding assets on the web. Offline desktop serves the original local images.
  if (name === "/_next/image") {
    const image = address.searchParams.get("url");
    if (!image || !image.startsWith("/") || image.startsWith("//")) return null;
    name = image;
  }
  const file = path.resolve(folder, "." + name);
  const relative = path.relative(folder, file);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return file;
}

async function external(href) {
  try {
    const target = new URL(href);
    if (target.protocol === "https:" || target.protocol === "mailto:") {
      await shell.openExternal(target.href);
    }
  } catch {
    // Ignore unsupported URLs.
  }
}

async function boot() {
  const window = new BrowserWindow({
    width: 1180,
    height: 810,
    minWidth: 390,
    minHeight: 500,
    backgroundColor: "#e1e6ed",
    icon: path.join(folder, "arzdesk-logo-v1.png"),
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      devTools: !app.isPackaged,
    },
  });
  const outbound = [];
  const externalTargets = [];
  const openExternal = smokeMode
    ? async (url) => {
        externalTargets.push(url);
      }
    : external;
  const online = require("./online-account.cjs")({
    deviceWindow: window,
    external: openExternal,
  });
  function follow(target) {
    const next = destination(target);
    if (next.kind === "online") void online.open(next.url);
    else if (next.kind === "external") void openExternal(next.url);
    else if (next.kind === "device") online.returnToDevice();
  }
  window.once("closed", () => online.dispose());
  window.webContents.session.setPermissionRequestHandler(
    (_webContents, _permission, callback) => callback(false),
  );
  window.webContents.session.setPermissionCheckHandler(() => false);
  if (smokeMode)
    window.webContents.session.webRequest.onBeforeRequest(
      { urls: ["https://*/*", "http://*/*"] },
      (details, callback) => {
        outbound.push(details.url);
        callback({ cancel: true });
      },
    );
  window.once("ready-to-show", () => window.show());
  window.webContents.setWindowOpenHandler(({ url }) => {
    follow(url);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, target) => {
    if (destination(target).kind === "device" && target.startsWith(HOME))
      return;
    event.preventDefault();
    follow(target);
  });
  window.webContents.on("console-message", (event) =>
    console.log("DESKTOP_CONSOLE", event.message),
  );
  window.webContents.on("did-fail-load", (_event, code, desc, target) =>
    console.error("DESKTOP_LOAD_FAILED", code, desc, target),
  );
  await window.loadURL(HOME);
  if (smokeMode) {
    try {
      if (process.env.ARZDESK_SMOKE_PHASE === "online")
        await require("./online-smoke.cjs")(window, online, externalTargets);
      else
        await require("./smoke.cjs")(window, process.env.ARZDESK_SMOKE_PROFILE);
      if (outbound.length)
        throw Error(
          "Desktop attempted network requests: " + outbound.join(", "),
        );
      app.exit(0);
    } catch (error) {
      console.error(error);
      app.exit(1);
    }
  }
}

app.whenReady().then(async () => {
  protocol.handle(SCHEME, async (request) => {
    const file = asset(request);
    if (!file) return new Response("Forbidden", { status: 403 });
    try {
      const data = await fs.readFile(file);
      return new Response(new Uint8Array(data), {
        headers: {
          "content-type":
            types[path.extname(file).toLowerCase()] ||
            "application/octet-stream",
          "x-content-type-options": "nosniff",
          "content-security-policy":
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'self'; form-action 'self'",
        },
      });
    } catch (error) {
      console.error("Desktop resource error:", file, error);
      return new Response("Resource unavailable", { status: 404 });
    }
  });
  await boot();
});
app.on("window-all-closed", () => app.quit());
