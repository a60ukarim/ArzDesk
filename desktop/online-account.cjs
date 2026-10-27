const { WebContentsView, Menu, dialog, session } = require("electron");
const { WEB, destination } = require("./navigation.cjs");

module.exports = function onlineAccount({ deviceWindow, external }) {
  // Retain the existing online cookie partition and local IndexedDB profile.
  const accountSession = session.fromPartition("persist:arzdesk-online");
  accountSession.setPermissionRequestHandler((_contents, _permission, reply) =>
    reply(false),
  );
  accountSession.setPermissionCheckHandler(() => false);
  let accountView;
  let visible = false;
  let errorVisible = false;

  function fit() {
    if (!visible || !accountView || deviceWindow.isDestroyed()) return;
    const { width, height } = deviceWindow.getContentBounds();
    accountView.setBounds({ x: 0, y: 0, width, height });
  }
  deviceWindow.on("resize", fit);

  function returnToDevice() {
    if (deviceWindow.isDestroyed()) return;
    if (visible && accountView)
      deviceWindow.contentView.removeChildView(accountView);
    visible = false;
    deviceWindow.setTitle(deviceWindow.webContents.getTitle() || "ArzDesk");
    deviceWindow.show();
    if (deviceWindow.isMinimized()) deviceWindow.restore();
    deviceWindow.focus();
    deviceWindow.webContents.focus();
  }

  function close() {
    returnToDevice();
    const view = accountView;
    accountView = undefined;
    visible = false;
    if (view && !view.webContents.isDestroyed()) view.webContents.close();
  }

  function route(target, allowExternal = true) {
    const next = destination(target);
    if (next.kind === "device") returnToDevice();
    else if (next.kind === "online") void open(next.url);
    else if (next.kind === "external" && allowExternal) void external(next.url);
  }

  async function loadError(contents) {
    if (deviceWindow.isDestroyed() || contents.isDestroyed() || errorVisible)
      return;
    errorVisible = true;
    try {
      const { response } = await dialog.showMessageBox(deviceWindow, {
        type: "info",
        title: "Online account unavailable",
        message: "Your online account needs an internet connection.",
        detail:
          "Check your connection and try again. Your device workspaces are still available offline.",
        buttons: ["Back to device workspaces", "Try again"],
        defaultId: 0,
        cancelId: 0,
      });
      if (!contents.isDestroyed() && !deviceWindow.isDestroyed()) {
        if (response === 1) contents.reload();
        else returnToDevice();
      }
    } finally {
      errorVisible = false;
    }
  }

  async function open(target = WEB + "/cloud") {
    const next = destination(target);
    if (next.kind !== "online") throw Error("Untrusted account address");
    if (deviceWindow.isDestroyed()) return;
    if (!accountView || accountView.webContents.isDestroyed()) {
      const view = new WebContentsView({
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
      accountView = view;
      const contents = view.webContents;
      contents.setWindowOpenHandler(({ url }) => {
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
      contents.on("will-navigate", (event, url) => navigate(event, url));
      contents.on("will-redirect", (event, url) => navigate(event, url, true));
      contents.on("did-navigate-in-page", (_event, url, mainFrame) => {
        if (mainFrame && destination(url).kind === "device") returnToDevice();
      });
      contents.on("page-title-updated", (_event, title) => {
        if (visible && !deviceWindow.isDestroyed())
          deviceWindow.setTitle(title);
      });
      contents.on(
        "did-fail-load",
        (_event, code, _description, _url, mainFrame) => {
          if (mainFrame && code !== -3) void loadError(contents);
        },
      );
    }
    const view = accountView;
    if (!visible) deviceWindow.contentView.addChildView(view);
    visible = true;
    fit();
    deviceWindow.show();
    if (deviceWindow.isMinimized()) deviceWindow.restore();
    deviceWindow.focus();
    view.webContents.focus();
    // Switching back online resumes the existing page, including unsaved form state.
    const current = view.webContents.getURL();
    if (target === WEB + "/cloud" && destination(current).kind === "online") {
      deviceWindow.setTitle(
        view.webContents.getTitle() || "ArzDesk · Online account",
      );
      return view;
    }
    try {
      await view.webContents.loadURL(next.url);
    } catch {
      // did-fail-load provides a retry / local-workspaces choice in this window.
    }
    return view;
  }

  deviceWindow.setMenu(
    Menu.buildFromTemplate([
      {
        label: "ArzDesk",
        submenu: [
          { label: "Online account", click: () => void open() },
          { label: "Device workspaces (offline)", click: returnToDevice },
          { type: "separator" },
          {
            label: "Back",
            accelerator: "Alt+Left",
            click: () => {
              const contents =
                visible && accountView
                  ? accountView.webContents
                  : deviceWindow.webContents;
              const history = contents.navigationHistory;
              if (history.canGoBack()) history.goBack();
            },
          },
          { role: "reload" },
          { type: "separator" },
          { role: "close" },
        ],
      },
      { role: "editMenu" },
    ]),
  );
  deviceWindow.setAutoHideMenuBar(false);
  deviceWindow.setMenuBarVisibility(true);

  return {
    open,
    close,
    returnToDevice,
    dispose: () => {
      deviceWindow.removeListener("resize", fit);
      close();
    },
    session: accountSession,
    view: () => accountView,
    isVisible: () => visible,
  };
};
