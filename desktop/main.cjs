const { app, BrowserWindow, protocol, shell } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");

const SCHEME = "arzdesk";
const HOME = "arzdesk://local/offline";
const WEB = "https://arzdesk-sage.vercel.app";

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
  window.once("ready-to-show", () => window.show());
  window.webContents.setWindowOpenHandler(({ url }) => {
    void external(url);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, target) => {
    const url = new URL(target);
    if (
      url.protocol === "arzdesk:" &&
      url.hostname === "local" &&
      url.pathname === "/offline"
    )
      return;
    event.preventDefault();
    if (url.protocol === "arzdesk:" && url.hostname === "local") {
      void external(WEB + url.pathname + url.search);
    } else {
      void external(target);
    }
  });
  window.webContents.on("console-message", (event) =>
    console.log("DESKTOP_CONSOLE", event.message),
  );
  window.webContents.on("did-fail-load", (_event, code, desc, target) =>
    console.error("DESKTOP_LOAD_FAILED", code, desc, target),
  );
  await window.loadURL(HOME);
  if (process.argv.includes("--smoke-test")) {
    try {
      let ok = false;
      const deadline = Date.now() + 25000;
      while (!ok && Date.now() < deadline) {
        ok = await window.webContents.executeJavaScript(
          'Boolean(document.querySelector(".local-home") && document.querySelector("input") && window.indexedDB)',
          true,
        );
        if (!ok) await new Promise((resolve) => setTimeout(resolve, 300));
      }
      if (!ok) {
        const diagnostic = await window.webContents.executeJavaScript(
          '({url:location.href,html:document.body.innerText.slice(0,400),hasPage:!!document.querySelector(".local-home"),inputCount:document.querySelectorAll("input").length})',
        );
        console.log("ARZDESK_DESKTOP_DOM", JSON.stringify(diagnostic));
      }
      console.log(
        ok ? "ARZDESK_DESKTOP_SMOKE_OK" : "ARZDESK_DESKTOP_SMOKE_FAILED",
      );
      app.exit(ok ? 0 : 1);
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
