import { spawn } from "node:child_process";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const baseUrl = process.env.SST_PREVIEW_URL ?? "http://localhost:3010";
const chromeCandidates = [
  path.join(process.env.PROGRAMFILES ?? "C:\\Program Files", "Google/Chrome/Application/chrome.exe"),
  path.join(process.env["PROGRAMFILES(X86)"] ?? "C:\\Program Files (x86)", "Microsoft/Edge/Application/msedge.exe"),
];
let browserPath;
for (const candidate of chromeCandidates) {
  try { await access(candidate); browserPath = candidate; break; } catch { /* Try the next installed browser. */ }
}
if (!browserPath) throw new Error("Install Chrome or Edge to run the account draft browser check.");

const directory = await mkdtemp(path.join(os.tmpdir(), "sst-account-draft-"));
const browser = spawn(browserPath, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-background-networking", "--disable-breakpad", "--disable-crash-reporter",
  "--remote-debugging-port=0", `--user-data-dir=${directory}`, `${baseUrl}/account?returnTo=%2Ftemplates%2Feducation`,
], { stdio: "ignore", windowsHide: true });
let socket;

try {
  let port;
  for (let attempt = 0; attempt < 200; attempt += 1) {
    try {
      const activePort = (await readFile(path.join(directory, "DevToolsActivePort"), "utf8")).split(/\r?\n/)[0];
      if (activePort) { port = activePort; break; }
    } catch { /* Chrome has not created DevToolsActivePort yet. */ }
    if (browser.exitCode !== null) throw new Error(`Browser exited with code ${browser.exitCode}.`);
    await delay(100);
  }
  if (!port) throw new Error("Timed out waiting for Chrome DevTools.");
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const page = targets.find((target) => target.type === "page");
  if (!page?.webSocketDebuggerUrl) throw new Error("Chrome did not expose a page target.");
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let nextId = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
    if (message.method === "Log.entryAdded" && message.params.entry.level === "error") errors.push(message.params.entry.text);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, (message) => message.error ? reject(new Error(message.error.message)) : resolve(message));
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.result.exceptionDetails) throw new Error(result.result.exceptionDetails.text);
    return result.result.result.value;
  };
  const waitFor = async (expression, attempts = 100) => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      if (await evaluate(expression)) return true;
      await delay(100);
    }
    return false;
  };
  const click = async (selector) => {
    const clicked = await evaluate(`(()=>{const element=document.querySelector(${JSON.stringify(selector)});if(!element)return false;element.click();return true})()`);
    if (!clicked) throw new Error(`Missing control ${selector}.`);
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Log.enable");
  if (!(await waitFor("Boolean(document.querySelector('#account-email'))"))) throw new Error("Local account form did not load; confirm Auth Emulator is running.");
  await click('.account-tabs button[aria-pressed="false"]');
  const email = `qa-${Date.now()}@example.test`;
  const password = `Local-${Date.now()}-Q4!`;
  await evaluate(`(()=>{const set=(selector,value)=>{const input=document.querySelector(selector);const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))};set('#account-email',${JSON.stringify(email)});set('#account-password',${JSON.stringify(password)});document.querySelector('form')?.requestSubmit()})()`);
  if (!(await waitFor("location.pathname === '/templates/education'"))) throw new Error(`Local sign-up did not return to the template. Browser errors: ${JSON.stringify(errors)}`);
  if (!(await waitFor("Boolean(document.querySelector('.direct-editor-account-link')) || Boolean(document.querySelector('.direct-editor-toolbar button'))"))) throw new Error("Template editor did not load after sign-up.");
  await delay(800);
  await click('.direct-editor-toolbar button');
  if (!(await waitFor(`Boolean(document.querySelector('.direct-editor-canvas.is-editing [contenteditable="true"]'))`))) throw new Error(`Editor did not enter edit mode: ${JSON.stringify(await evaluate("({url:location.href,toolbar:document.querySelector('.direct-editor-toolbar')?.innerText,canvas:document.querySelector('.direct-editor-canvas')?.className,ready:document.querySelector('.direct-editor-status')?.textContent})"))}`);

  const editedText = await evaluate(`(()=>{const element=[...document.querySelectorAll('.direct-editor-canvas [data-editor-text-key][contenteditable="true"]')].find(item=>!item.closest('[data-editor-logo="true"]'));if(!element)return null;const key=element.dataset.editorTextKey;const value=(element.textContent||'')+' â€” brouillon de compte QA';element.focus();element.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,inputType:'insertText',data:' â€” brouillon de compte QA'}));element.textContent=value;element.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:' â€” brouillon de compte QA'}));element.blur();return {key,value}})()`);
  if (!editedText) throw new Error("No editable text target was found.");

  const image = await evaluate(`(()=>{const element=[...document.querySelectorAll('.mock-site [data-editor-image-key]')].find(item=>item.dataset.editorLogo!=='true');if(!element)return null;element.click();return element.dataset.editorImageKey})()`);
  if (!image) throw new Error("No replaceable image was found.");
  const { result: { root } } = await send("DOM.getDocument", { depth: -1 });
  const { result: { nodeId } } = await send("DOM.querySelector", { nodeId: root.nodeId, selector: ".direct-editor-upload" });
  const imagePath = path.resolve("apps/public-web/public/media/references/school-enrollment-details-v1.webp");
  await send("DOM.setFileInputFiles", { nodeId, files: [imagePath] });
  await evaluate("document.querySelector('.direct-editor-upload')?.dispatchEvent(new Event('change',{bubbles:true}))");
  if (!(await waitFor(`(()=>{const item=[...document.querySelectorAll('[data-editor-image-key]')].find(target=>target.dataset.editorImageKey===${JSON.stringify(image)});return item&&(item instanceof HTMLImageElement?item.src.startsWith('data:image'):item.style.backgroundImage.includes('data:image'))})()`))) {
    throw new Error("Replacement image did not reach the preview.");
  }

  if (!(await waitFor("Boolean([...document.querySelectorAll('.direct-editor-toolbar button')].find(button=>button.textContent.includes('Enregistrer dans mon compte')))"))) throw new Error("Account save action did not appear.");
  await click('.direct-editor-toolbar button:nth-of-type(2)');
  if (!(await waitFor("document.querySelector('.direct-editor-status')?.textContent.includes('Brouillon enregistr')", 300))) {
    throw new Error(`Account save failed: ${await evaluate("document.querySelector('.direct-editor-status')?.textContent")}; browser errors: ${JSON.stringify(errors)}`);
  }
  await click('.direct-editor-toolbar button:nth-of-type(2)');
  if (!(await waitFor("document.querySelector('.direct-editor-status')?.textContent.includes('Sauvegarde du brouillon')", 50))) throw new Error("The repeat save did not start.");
  if (!(await waitFor("document.querySelector('.direct-editor-status')?.textContent.includes('Brouillon enregistr')", 300))) {
    throw new Error(`Existing-project save failed: ${await evaluate("document.querySelector('.direct-editor-status')?.textContent")}; browser errors: ${JSON.stringify(errors)}`);
  }

  await evaluate(`(()=>{localStorage.removeItem('sst:direct-template:education:text:v1');localStorage.removeItem('sst:direct-template:education:links:v1');localStorage.removeItem('sst:direct-template:education:accent:v1')})()`);
  await evaluate(`new Promise((resolve,reject)=>{const request=indexedDB.open('sst-direct-template-editor');request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result;const transaction=db.transaction('drafts','readwrite');transaction.objectStore('drafts').delete('education');transaction.oncomplete=()=>{db.close();resolve()};transaction.onerror=()=>{db.close();reject(transaction.error)}}})`);
  await send("Page.reload", { ignoreCache: true });
  if (!(await waitFor("Boolean([...document.querySelectorAll('.direct-editor-toolbar button')].find(button=>button.textContent.includes('Charger mon brouillon')))"))) throw new Error("Saved account draft was not discovered after refresh.");
  await click('.direct-editor-toolbar button:nth-of-type(3)');
  if (!(await waitFor(`(()=>{const text=[...document.querySelectorAll('[data-editor-text-key]')].find(item=>item.dataset.editorTextKey===${JSON.stringify(editedText.key)});const item=[...document.querySelectorAll('[data-editor-image-key]')].find(target=>target.dataset.editorImageKey===${JSON.stringify(image)});const restored=item&&(item instanceof HTMLImageElement?item.src.startsWith('data:image'):item.style.backgroundImage.includes('data:image'));return text?.textContent===${JSON.stringify(editedText.value)}&&restored})()`))) {
    throw new Error(`Cloud draft did not restore text and image. Status: ${await evaluate("document.querySelector('.direct-editor-status')?.textContent")}; browser errors: ${JSON.stringify(errors)}`);
  }
  await evaluate("window.confirm=()=>true");
  await click(".direct-editor-cloud-project-delete");
  if (!(await waitFor("document.querySelector('.direct-editor-status')?.textContent.includes('appartenance')", 300))) {
    throw new Error(`Cloud project deletion failed: ${await evaluate("document.querySelector('.direct-editor-status')?.textContent")}; browser errors: ${JSON.stringify(errors)}`);
  }
  if (await evaluate("Boolean(document.querySelector('.direct-editor-cloud-delete'))")) throw new Error("Deleted cloud draft is still offered as available.");
  if (await evaluate("Boolean(document.querySelector('.direct-editor-cloud-project-delete'))")) throw new Error("Deleted cloud project is still offered as available.");
  // Recreate the saved project so account deletion must remove Firestore and Storage data itself.
  await click(".direct-editor-toolbar button:nth-of-type(2)");
  if (!(await waitFor("document.querySelector('.direct-editor-status')?.textContent.includes('Brouillon enregistr')", 300))) throw new Error(`Could not prepare account-owned project for deletion: ${await evaluate("document.querySelector('.direct-editor-status')?.textContent")}`);  await send("Page.navigate", { url: `${baseUrl}/account` });
  if (!(await waitFor("Boolean(document.querySelector('.account-delete-panel button'))"))) throw new Error("Account deletion control did not load.");
  const testUid = await evaluate("document.querySelector('.account-signed-in')?.dataset.accountUid");
  if (!testUid) throw new Error("Signed-in account UID was not available to the local E2E.");
  const storagePrefix = `sstTenants/${testUid}/`;
  const storageUrl = `http://127.0.0.1:9199/v0/b/demo-smartsolutiontek.appspot.com/o?prefix=${encodeURIComponent(storagePrefix)}`;
  const objectsBeforeDeletion = await (await fetch(storageUrl, { headers: { Authorization: "Bearer owner" } })).json();
  if (!objectsBeforeDeletion.items?.length) throw new Error("Test account had no Storage objects before account deletion.");
  const projectUrl = `http://127.0.0.1:8080/v1/projects/demo-smartsolutiontek/databases/(default)/documents/sstTenants/${testUid}/projects/education`;
  const projectBeforeDeletion = await fetch(projectUrl, { headers: { Authorization: "Bearer owner" } });
  if (!projectBeforeDeletion.ok) throw new Error("Test account project was not present before account deletion.");
  if (!(await waitFor("Boolean(document.querySelector('.account-delete-panel button'))"))) throw new Error("Account deletion control did not load.");
  await click(".account-delete-panel button");
  await evaluate(`(()=>{const set=(selector,value)=>{const input=document.querySelector(selector);const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))};set('#account-delete-password',${JSON.stringify(password)});set('#account-delete-confirmation','SUPPRIMER MON COMPTE');document.querySelector('.account-delete-panel form')?.requestSubmit()})()`);
  if (!(await waitFor("Boolean(document.querySelector('#account-email'))", 200))) throw new Error(`Account deletion did not return to sign-in: ${JSON.stringify(errors)}`);
  if (!(await waitFor("document.querySelector('.account-status')?.textContent.includes('1 projet')"))) throw new Error("Account deletion did not report cleanup of its project.");
  const objectsAfterDeletion = await (await fetch(storageUrl, { headers: { Authorization: "Bearer owner" } })).json();
  if (objectsAfterDeletion.items?.length) throw new Error("Account Storage objects remain after account deletion.");
  const projectAfterDeletion = await fetch(projectUrl, { headers: { Authorization: "Bearer owner" } });
  if (projectAfterDeletion.status !== 404) throw new Error(`Account project remains after deletion: HTTP ${projectAfterDeletion.status}.`);
  await evaluate(`(()=>{const set=(selector,value)=>{const input=document.querySelector(selector);const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))};set('#account-email',${JSON.stringify(email)});set('#account-password',${JSON.stringify(password)});document.querySelector('form')?.requestSubmit()})()`);
  if (!(await waitFor("Boolean(document.querySelector('.account-error')) || Boolean(document.querySelector('.account-signed-in'))", 200))) throw new Error("Could not verify that deleted credentials are rejected.");
  if (!(await evaluate("Boolean(document.querySelector('.account-error'))&&!document.querySelector('.account-signed-in')"))) throw new Error("Deleted account credentials still open an Auth session.");

  console.log("Account draft browser check passed: local sign-up, text/image edits, repeated Firestore/Storage save, refresh, restore, project cleanup, account deletion with a newly saved project and media, and rejection of sign-in with deleted credentials.");
  console.log("A disposable local Emulator account was created for this check.");
} finally {
  try { socket?.close(); } catch { /* Browser process cleanup follows. */ }
  const browserClosed = browser.exitCode === null
    ? new Promise((resolve) => browser.once("close", resolve))
    : Promise.resolve();
  browser.kill();
  await Promise.race([browserClosed, delay(3000)]);
  try {
    await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 });
  } catch (error) {
    if (error?.code !== "EBUSY" && error?.code !== "EPERM") throw error;
    console.warn("Chrome kept its temporary profile locked; operating-system cleanup will remove it later.");
  }
}







