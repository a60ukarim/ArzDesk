// Exercises the shipped renderer against an explicitly isolated QA profile only.
module.exports = async function smoke(window, profile) {
  const fs = require("node:fs/promises");
  const path = require("node:path");
  const phase = process.env.ARZDESK_SMOKE_PHASE || "write";
  const execute = (code) => window.webContents.executeJavaScript(code, true);
  async function wait(code) {
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      if (await execute(code)) return;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error(`Desktop QA timed out: ${code.slice(0, 100)}`);
  }
  const read = `new Promise((resolve,reject)=>{const r=indexedDB.open('arzdesk-device-v1',1);r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result;const tx=db.transaction('data','readonly');const q=tx.objectStore('data').get('state');q.onsuccess=()=>resolve(q.result);tx.oncomplete=()=>db.close();};})`;
  await wait(`Boolean(document.querySelector('.local-home input'))`);
  await execute(`window.__qa={
    input(selector,value){const el=document.querySelector(selector);if(!el)throw Error('Missing '+selector);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));},
    click(text){const el=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===text);if(!el)throw Error('Missing button '+text);el.click();}
  };void 0`);
  if (phase === "write") {
    if ((await execute(read))?.organizations?.length)
      throw Error("Write QA profile must be empty");
    await execute(`__qa.input('.local-create input','ArzDesk installer QA')`);
    await new Promise((r) => setTimeout(r, 100));
    await execute(`__qa.click('Create workspace')`);
    await wait(`Boolean(document.querySelector('.app-shell'))`);
    await execute(`__qa.click('Add client')`);
    await wait(
      `Boolean(document.querySelector('dialog[open] input[name=name]'))`,
    );
    await execute(`__qa.input('dialog[open] input[name=name]','QA client')`);
    await new Promise((r) => setTimeout(r, 100));
    await execute(
      `document.querySelector('dialog[open] button[type=submit]').click()`,
    );
    await wait(`!document.querySelector('dialog[open]')`);
    const state = await execute(read);
    const org = state.organizations[0].id;
    await execute(`location.hash=${JSON.stringify(org + "/projects")}`);
    await wait(
      `Boolean([...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='New project'))`,
    );
    await execute(`__qa.click('New project')`);
    await wait(
      `Boolean(document.querySelector('dialog[open] input[name=name]'))`,
    );
    await execute(`__qa.input('dialog[open] input[name=name]','QA project')`);
    await new Promise((r) => setTimeout(r, 100));
    await execute(
      `document.querySelector('dialog[open] button[type=submit]').click()`,
    );
    await wait(`!document.querySelector('dialog[open]')`);
    await execute(`location.hash=${JSON.stringify(org + "/tasks")}`);
    await wait(
      `Boolean([...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Add task'))`,
    );
    await execute(`__qa.click('Add task')`);
    await wait(
      `Boolean(document.querySelector('dialog[open] input[name=title]'))`,
    );
    await execute(
      `__qa.input('dialog[open] input[name=title]','QA persists offline')`,
    );
    await new Promise((r) => setTimeout(r, 100));
    await execute(
      `document.querySelector('dialog[open] button[type=submit]').click()`,
    );
    await wait(`!document.querySelector('dialog[open]')`);
    await execute(
      `const select=document.querySelector('.status-select');select.value='done';select.dispatchEvent(new Event('change',{bubbles:true}));`,
    );
    await wait(
      `(async()=>{const s=await (${read});return s?.tasks?.[0]?.status==='done';})()`,
    );
    await execute(`location.hash=${JSON.stringify(org + "/settings")}`);
    await wait(
      `Boolean([...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Export backup'))`,
    );
    const backupPath = path.join(profile, "backup.json");
    const downloaded = new Promise((resolve, reject) => {
      window.webContents.session.once("will-download", (_event, item) => {
        item.setSavePath(backupPath);
        item.once("done", (_e, status) =>
          status === "completed"
            ? resolve()
            : reject(Error("Backup download " + status)),
        );
      });
    });
    await execute(`__qa.click('Export backup')`);
    await Promise.race([
      downloaded,
      new Promise((_resolve, reject) =>
        setTimeout(() => reject(Error("Backup export timed out")), 15000),
      ),
    ]);
    const backup = JSON.parse(await fs.readFile(backupPath, "utf8"));
    if (backup.format !== "arzdesk-local" || backup.tasks[0]?.status !== "done")
      throw Error("Backup contents invalid");
    await execute(
      `(()=>{const input=document.querySelector('input[type=file]');const dt=new DataTransfer();dt.items.add(new File([${JSON.stringify(JSON.stringify(backup))}],'backup.json',{type:'application/json'}));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`,
    );
    await wait(
      `(async()=>{const s=await (${read});return s?.organizations?.length===2 && s?.tasks?.length===2;})()`,
    );
  } else if (phase === "read") {
    const state = await execute(read);
    if (
      state.organizations.length !== 2 ||
      state.clients.length !== 2 ||
      state.projects.length !== 2 ||
      state.tasks.length !== 2 ||
      state.tasks.some((task) => task.status !== "done")
    )
      throw Error("Installed app lost persisted work after restart");
  } else throw Error("Unknown smoke phase");
  console.log(
    "ARZDESK_DESKTOP_SMOKE_OK",
    JSON.stringify({ phase, persistence: true, offline: true }),
  );
};
