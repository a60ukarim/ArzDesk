// Synthetic account pages: no production accounts, credentials or workspaces.
module.exports = async function onlineSmoke(device, online, externalTargets) {
  const { WEB } = require("./navigation.cjs");
  const execute = (window, code) =>
    window.webContents.executeJavaScript(code, true);
  async function wait(check) {
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      if (await check()) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw Error("Online-window QA timed out");
  }
  await wait(() =>
    execute(device, "Boolean(document.querySelector('.local-home input'))"),
  );
  const originalURL = device.webContents.getURL();
  const snapshot = `new Promise((resolve,reject)=>{const q=indexedDB.open('arzdesk-device-v1',1);q.onerror=()=>reject(q.error);q.onsuccess=()=>{const db=q.result;const tx=db.transaction('data','readonly');const r=tx.objectStore('data').get('state');r.onsuccess=()=>resolve(JSON.stringify(r.result));tx.oncomplete=()=>db.close();}})`;
  const before = await execute(device, snapshot);
  const requests = [];
  const unexpected = [];
  online.session.webRequest.onBeforeRequest((details, reply) => {
    if (new URL(details.url).origin !== WEB) unexpected.push(details.url);
    reply({ cancel: new URL(details.url).origin !== WEB });
  });
  await online.session.protocol.handle("https", (request) => {
    requests.push(request.url);
    if (new URL(request.url).origin !== WEB) throw Error("Unexpected QA host");
    return new Response(
      `<!doctype html><html><head><meta charset="utf-8"><title>ArzDesk account QA</title></head><body>
      <main id="account"></main>
      <script>
        const signedIn = document.cookie.includes('arzdesk_qa_session=present');
        document.getElementById('account').innerHTML = signedIn
          ? '<h1>QA account workspace</h1><a id="profile" target="_blank" href="/profile">Profile</a><button id="logout">Log out</button><a id="device" href="/offline">Device workspaces</a>'
          : '<h1>Sign in</h1><form><label>Email<input type="email" required></label><label>Password<input type="password" required></label><button>Sign in</button></form>';
        document.querySelector('form')?.addEventListener('submit', e => {e.preventDefault();document.cookie='arzdesk_qa_session=present; Path=/; Max-Age=3600; Secure; SameSite=Lax';location.href='/workspaces';});
        document.getElementById('logout')?.addEventListener('click', () => {document.cookie='arzdesk_qa_session=; Path=/; Max-Age=0; Secure; SameSite=Lax';location.href='/sign-in';});
      </script></body></html>`,
      {
        headers: {
          "content-type": "text/html",
          "content-security-policy":
            "default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none'; frame-src 'none'",
        },
      },
    );
  });
  try {
    // Exercise the actual local /cloud link, rather than invoking an OS browser.
    await execute(device, `document.querySelector('a[href="/cloud"]').click()`);
    await wait(() => Boolean(online.window()));
    let account = online.window();
    await wait(() =>
      execute(account, "Boolean(document.querySelector('form'))"),
    );
    const settings = account.webContents.getLastWebPreferences();
    if (
      settings.nodeIntegration ||
      !settings.sandbox ||
      !settings.contextIsolation ||
      !settings.webSecurity ||
      settings.preload
    )
      throw Error("Online renderer has excessive privileges");
    if (
      account.webContents.session === device.webContents.session ||
      !online.session.isPersistent()
    )
      throw Error("Account session is not separately persistent");
    await execute(
      account,
      `document.querySelector('[type=email]').value='qa@example.test';document.querySelector('[type=password]').value='synthetic-password';document.querySelector('form').requestSubmit();`,
    );
    await wait(() =>
      execute(
        account,
        "document.body.textContent.includes('QA account workspace')",
      ),
    );
    await online.session.cookies.flushStore();
    account.close();
    await wait(() => !online.window());
    account = await online.open();
    await wait(() =>
      execute(
        account,
        "document.body.textContent.includes('QA account workspace')",
      ),
    );
    await execute(account, "document.getElementById('profile').click()");
    await wait(() => account.webContents.getURL() === WEB + "/profile");
    if (online.window() !== account)
      throw Error("Trusted popup created another account window");
    await execute(account, "document.getElementById('logout').click()");
    await wait(
      async () =>
        (await online.session.cookies.get({ name: "arzdesk_qa_session" }))
          .length === 0,
    );
    account.close();
    await wait(() => !online.window());
    account = await online.open();
    await wait(() =>
      execute(account, "Boolean(document.querySelector('form'))"),
    );
    await online.session.cookies.set({
      url: WEB,
      name: "arzdesk_qa_session",
      value: "present",
      secure: true,
      expirationDate: Date.now() / 1000 + 3600,
    });
    account = await online.open(WEB + "/workspaces");
    await execute(account, "document.getElementById('device').click()");
    await wait(() => !online.window());
    if (
      device.webContents.getURL() !== originalURL ||
      (await execute(device, snapshot)) !== before
    )
      throw Error("Opening online account changed device workspace state");
    if (externalTargets.length || unexpected.length)
      throw Error("Account flow escaped the application");
    if (!requests.some((url) => url.endsWith("/profile")))
      throw Error("Missing profile navigation");
    console.log(
      "ARZDESK_ONLINE_WINDOW_QA_OK synthetic login, persistent cookies, logout, device return; no production writes",
    );
  } finally {
    online.returnToDevice();
    await online.session.cookies.remove(WEB, "arzdesk_qa_session");
    online.session.protocol.unhandle("https");
  }
};
