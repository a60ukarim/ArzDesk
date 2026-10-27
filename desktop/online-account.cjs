const { BrowserWindow, Menu, dialog, session } = require("electron");
const { WEB, destination } = require("./navigation.cjs");

module.exports = function onlineAccount({ deviceWindow, icon, external }) {
  // Online cookies have their own persistent store. The existing device profile
  // and arzdesk://local IndexedDB stay in the unchanged default session.
  const accountSession = session.fromPartition("persist:arzdesk-online");
  accountSession.setPermissionRequestHandler((_contents, _permission, reply) =>
    reply(false),
  );
  accountSession.setPermissionCheckHandler(() => false);
  let accountWindow;
  let errorVisible = false;

  function returnToDevice() {
    if (!deviceWindow.isDestroyed()) {
      deviceWindow.show();
      if (deviceWindow.isMinimized()) deviceWindow.restore();
      deviceWindow.focus();
    }
    if (accountWindow && !accountWindow.isDestroyed()) accountWindow.close();
  }

  function route(target, allowExternal = true) {
    const next = destination(target);
    if (next.kind === "device") returnToDevice();
    else if (next.kind === "online") void open(next.url);
    else if (next.kind === "external" && allowExternal) void external(next.url);
  }

  async function loadError(window) {
    if (window.isDestroyed() || errorVisible) return;
    errorVisible = true;
    try {
      const { response } = await dialog.showMessageBox(window, {
        type: "info",
        title: "Online account unavailable",
        message: "Your online account needs an internet connection.",
        detail:
          "Check your connection and try again. Your device workspaces are still available offline.",
        buttons: ["Back to device workspaces", "Try again"],
        defaultId: 0,
        cancelId: 0,
      });
      if (!window.isDestroyed()) {
        if (response === 1) window.webContents.reload();
        else returnToDevice();
      }
    } finally {
      errorVisible = false;
    }
  }

  async function open(target = WEB + "/cloud") {
    const next = destination(target);
    if (next.kind !== "online") throw Error("Untrusted account address");
    if (!accountWindow || accountWindow.isDestroyed()) {
      const window = new BrowserWindow({
        width: 1180,
        height: 810,
        minWidth: 390,
        minHeight: 500,
        title: "ArzDesk · Online account",
        icon,
        show: false,
        webPreferences: {
          session: accountSession,
          sandbox: true,
          contextIsolation: true,
          nodeIntegration: false,
          webSecurity: true,
          webviewTag: false,
          allowRunningInsecureContent: false,
          devTools: false,
        },
      });
      accountWindow = window;
      window.setMenu(
        Menu.buildFromTemplate([
          {
            label: "ArzDesk",
            submenu: [
              { label: "Back to device workspaces", click: returnToDevice },
              {
                label: "Back",
                accelerator: "Alt+Left",
                click: () => {
                  const history = window.webContents.navigationHistory;
                  if (history.canGoBack()) history.goBack();
                },
              },
              { role: "reload" },
              { type: "separator" },
              { role: "close", label: "Close online account" },
            ],
          },
          { role: "editMenu" },
        ]),
      );
      window.once("ready-to-show", () => window.show());
      window.once("closed", () => {
        if (accountWindow === window) accountWindow = undefined;
        if (!deviceWindow.isDestroyed()) deviceWindow.focus();
      });
      window.webContents.setWindowOpenHandler(({ url }) => {
        route(url);
        return { action: "deny" };
      });
      function navigate(event, target, redirect = false) {
        const url = event.url || target;
        if (destination(url).kind === "online") return;
        event.preventDefault();
        if (event.isMainFrame === false) return;
        route(url, !redirect);
      }
      window.webContents.on("will-navigate", (event, url) =>
        navigate(event, url),
      );
      window.webContents.on("will-redirect", (event, url) =>
        navigate(event, url, true),
      );
      window.webContents.on(
        "did-navigate-in-page",
        (_event, url, mainFrame) => {
          if (mainFrame && destination(url).kind === "device") returnToDevice();
        },
      );
      window.webContents.on(
        "did-fail-load",
        (_event, code, _description, _url, mainFrame) => {
          if (mainFrame && code !== -3) void loadError(window);
        },
      );
    }
    const window = accountWindow;
    window.show();
    if (window.isMinimized()) window.restore();
    window.focus();
    try {
      await window.loadURL(next.url);
    } catch {
      // did-fail-load provides a native retry / device-workspaces choice.
    }
    return window;
  }

  return {
    open,
    returnToDevice,
    session: accountSession,
    window: () => accountWindow,
  };
};
