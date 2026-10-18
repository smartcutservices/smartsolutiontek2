import { execFile, spawn } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";

const baseUrl = process.env.SST_PREVIEW_URL ?? "http://localhost:3010";
const captureDir = process.env.SST_QA_CAPTURE_DIR;
const feedCaptureDir = process.env.SST_QA_FEED_CAPTURE_DIR;
const runFile = promisify(execFile);
const chromeCandidates = [
  path.join(process.env.PROGRAMFILES ?? "C:\\Program Files", "Google/Chrome/Application/chrome.exe"),
  path.join(process.env["PROGRAMFILES(X86)"] ?? "C:\\Program Files (x86)", "Microsoft/Edge/Application/msedge.exe"),
];
let browserPath;
for (const candidate of chromeCandidates) {
  try { await access(candidate); browserPath = candidate; break; } catch { /* Try the next installed browser. */ }
}
if (!browserPath) throw new Error("Install Chrome or Edge to run local responsive QA.");

const registry = await readFile(new URL("../apps/public-web/features/sectors/registry.ts", import.meta.url), "utf8");
const sectorIds = [...registry.matchAll(/^[ \t]*\["([a-z0-9-]+)",/gm)].map((match) => match[1]);
const quickSector = process.env.SST_QA_QUICK_SECTOR;
const quickSectors = process.env.SST_QA_QUICK_SECTORS?.split(",").map((sector) => sector.trim()).filter(Boolean) ?? (quickSector ? [quickSector] : null);
for (const sector of quickSectors ?? []) if (!sectorIds.includes(sector)) throw new Error(`Unknown sector ${sector}.`);
const mobileSectorIds = quickSectors ?? sectorIds;
if (sectorIds.length !== 69 || new Set(sectorIds).size !== sectorIds.length) throw new Error(`Expected 69 unique sector IDs; found ${sectorIds.length}.`);

const directory = await mkdtemp(path.join(os.tmpdir(), "sst-browser-qa-"));
const browser = spawn(browserPath, [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-background-networking",
  "--remote-debugging-port=0", "--window-size=1280,900", `--user-data-dir=${directory}`,
  `${baseUrl}/`,
], { stdio: "ignore", windowsHide: true });

let socket;
try {
  let port;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const activePort = (await readFile(path.join(directory, "DevToolsActivePort"), "utf8")).split(/\r?\n/)[0];
      if (activePort) { port = activePort; break; }
    } catch { /* Chrome has not created its DevTools endpoint yet. */ }
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
  const pageErrors = [];
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") pageErrors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
    if (message.method === "Log.entryAdded" && message.params.entry.level === "error") pageErrors.push(message.params.entry.text);
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
  const setViewport = (width, height) => send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.result.exceptionDetails) throw new Error(result.result.exceptionDetails.text);
    return result.result.result.value;
  };
  const waitFor = async (expression, attempts = 40) => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      if (await evaluate(expression)) return true;
      await delay(100);
    }
    return false;
  };
  await send("Runtime.enable");
  await send("Log.enable");
  const clickSelector = async (selector) => {
    const point = await evaluate(`(() => { const rect = document.querySelector(${JSON.stringify(selector)})?.getBoundingClientRect(); return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null; })()`);
    if (!point) return false;
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 });
    await delay(60);
    return true;
  };
  const navigate = async (url) => {
    await send("Page.navigate", { url });
    for (let attempt = 0; attempt < 300; attempt += 1) {
      await delay(50);
      const ready = await evaluate("document.readyState === 'complete' && Boolean(document.body?.children.length)");
      if (ready) break;
      if (attempt === 299) throw new Error(`Timed out loading ${url}.`);
    }
    await delay(125);
  };
  const directEditorInteractionsVerified = new Set();
  const inspect = async (url, width, height, enableEditor) => {
    await setViewport(width, height);
    await navigate(url);
    if (enableEditor) {
      await delay(500);
      const opened = await evaluate("(() => { const button=document.querySelector(\x27.direct-editor-toolbar button\x27); if(!button)return false;button.click();return true; })()");
      if (!opened) throw new Error(`Direct editor button is missing on ${url}.`);
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const ready = await evaluate('Boolean(document.querySelector(".direct-editor-canvas.is-editing [contenteditable=true]"))');
        if (ready) break;
        await delay(100);
      }
      const sectorId = url.split("/").at(-1);
      if (!directEditorInteractionsVerified.has(sectorId)) {
      const accentChanged = await evaluate(`(() => { const input=document.querySelector('.direct-editor-toolbar input[type="color"]');if(!input)return {missing:true,toolbar:document.querySelector('.direct-editor-toolbar')?.innerText,editing:document.querySelector('.direct-editor-canvas')?.className,editable:document.querySelector('.direct-editor-canvas [contenteditable]')?.getAttribute('contenteditable')};input.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'#123456');input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));input.blur();return {saved:localStorage.getItem('sst:direct-template:${sectorId}:accent:v1'),applied:document.querySelector('.mock-site')?.style.getPropertyValue('--direct-editor-accent'),value:input.value}; })()`);
      if (accentChanged?.saved !== '#123456' || accentChanged?.applied !== '#123456') throw new Error(`Direct accent color was not applied and saved on ${url}: ${JSON.stringify(accentChanged)}; browser errors: ${JSON.stringify(pageErrors)}.`);
      const accentUndoRedo = await evaluate(`(async()=>{const site=document.querySelector('.mock-site');const buttons=[...document.querySelectorAll('.direct-editor-toolbar button')];if(!site||buttons[1]?.disabled)return null;buttons[1].click();for(let i=0;i<40&&buttons[2].disabled;i++)await new Promise(resolve=>setTimeout(resolve,100));const afterUndo={saved:localStorage.getItem('sst:direct-template:${sectorId}:accent:v1'),applied:site.style.getPropertyValue('--direct-editor-accent')};buttons[2].click();for(let i=0;i<40&&buttons[1].disabled;i++)await new Promise(resolve=>setTimeout(resolve,100));return {afterUndo,afterRedo:{saved:localStorage.getItem('sst:direct-template:${sectorId}:accent:v1'),applied:site.style.getPropertyValue('--direct-editor-accent')}};})()`);
      if (!accentUndoRedo || accentUndoRedo.afterUndo.saved !== null || accentUndoRedo.afterUndo.applied || accentUndoRedo.afterRedo.saved !== '#123456' || accentUndoRedo.afterRedo.applied !== '#123456') throw new Error(`Accent undo/redo failed on ${url}: ${JSON.stringify(accentUndoRedo)}.`);
      const editedText = JSON.parse(await evaluate(`JSON.stringify((() => { const element=[...document.querySelectorAll('.direct-editor-canvas [data-editor-text-key][contenteditable="true"]')].find((item)=>!item.closest('[data-editor-logo="true"]')); if(!element)return null; const key=element.dataset.editorTextKey; const before=element.textContent||''; element.click(); element.focus(); element.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,inputType:'insertText',data:' QA'})); element.textContent=before+' QA'; element.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:' QA'})); element.blur(); const saved=JSON.parse(localStorage.getItem('sst:direct-template:${url.split("/").at(-1)}:text:v1')||'{}'); return {key,before,after:element.textContent,saved:saved[key]===element.textContent}; })())`));
      if (!editedText?.saved) throw new Error(`Direct text editing was not saved locally on ${url}.`);
      const textUndoRedo = await evaluate(`(async()=>{const target=[...document.querySelectorAll('.direct-editor-canvas [data-editor-text-key]')].find((item)=>item.dataset.editorTextKey===${JSON.stringify(editedText.key)});const buttons=[...document.querySelectorAll('.direct-editor-toolbar button')];if(!target||buttons.length<3||buttons[1].disabled)return {available:false,buttons:buttons.map((button)=>({text:button.textContent,disabled:button.disabled}))};buttons[1].click();await new Promise(resolve=>setTimeout(resolve,50));const afterUndo=target.textContent;buttons[2].click();await new Promise(resolve=>setTimeout(resolve,50));return {available:true,before:${JSON.stringify(editedText.before)},after:${JSON.stringify(editedText.after)},afterUndo,afterRedo:target.textContent};})()`);
      if (!textUndoRedo?.available || textUndoRedo.afterUndo !== textUndoRedo.before || textUndoRedo.afterRedo !== textUndoRedo.after) throw new Error(`Text undo/redo did not restore both values on ${url}: ${JSON.stringify(textUndoRedo)}.`);
      let fieldEdit = null;
      if (sectorId === "multi-product") {
        fieldEdit = await evaluate(`(async()=>{const picker=document.querySelector('#direct-field-${sectorId}');if(!picker||picker.options.length<2)return null;picker.value=picker.options[1].value;picker.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(resolve=>setTimeout(resolve,40));const key=picker.value;const target=[...document.querySelectorAll('[data-editor-field-key]')].find((item)=>item.dataset.editorFieldKey===key);const input=document.querySelector('#direct-field-placeholder-${sectorId}');if(!target||!input)return null;const before=target.placeholder;input.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Adresse e-mail pour les nouveautÃ©s');input.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:'Adresse e-mail pour les nouveautÃ©s'}));input.dispatchEvent(new Event('change',{bubbles:true}));input.blur();await new Promise(resolve=>setTimeout(resolve,50));const afterInput=target.placeholder;const buttons=[...document.querySelectorAll('.direct-editor-toolbar button')];if(buttons[1].disabled)return {key,before,afterInput,afterUndo:null,afterRedo:target.placeholder};buttons[1].click();await new Promise(resolve=>setTimeout(resolve,75));const afterUndo=target.placeholder;buttons[2].click();await new Promise(resolve=>setTimeout(resolve,75));return {key,before,afterInput,afterUndo,afterRedo:target.placeholder};})()`);
        if (!fieldEdit || fieldEdit.afterUndo !== fieldEdit.before || fieldEdit.afterRedo !== "Adresse e-mail pour les nouveautÃ©s") throw new Error(`Form field undo/redo failed on ${url}: ${JSON.stringify(fieldEdit)}.`);
      }
      const imageSelected = await evaluate(`(() => { const image=[...document.querySelectorAll('.mock-site [data-editor-image-key]')].find((item)=>item.dataset.editorLogo!=='true')||[...document.querySelectorAll('.mock-site [data-editor-image-key]')].find((item)=>item.dataset.editorLogo==='true'); if(!image||image.tabIndex!==0)return null;const key=image.dataset.editorImageKey;const original=image instanceof HTMLImageElement?image.getAttribute('src'):image.dataset.editorLogo==='true'?image.querySelector('img.direct-editor-logo-image')?.getAttribute('src')||null:image.style.backgroundImage;image.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));return document.querySelector('.direct-editor-upload')?.dataset.targetKey===key?{key,original}:null; })()`);
      if (!imageSelected) throw new Error(`Replaceable image target is missing on ${url}.`);
      const { result: { root: imageDocument } } = await send("DOM.getDocument", { depth: -1 });
      const { result: { nodeId: imageInputNode } } = await send("DOM.querySelector", { nodeId: imageDocument.nodeId, selector: ".direct-editor-upload" });
      const qaImagePath = path.resolve("apps/public-web/public/media/references/school-enrollment-details-v1.webp");
      await send("DOM.setFileInputFiles", { nodeId: imageInputNode, files: [qaImagePath] });
      await evaluate("document.querySelector('.direct-editor-upload')?.dispatchEvent(new Event('change',{bubbles:true}))");
      for (let attempt = 0; attempt < 30; attempt += 1) {
        if (await evaluate('Boolean(document.querySelector("[data-editor-image-key][style*=\\"data:image\\"]")) || Boolean(document.querySelector("[data-editor-image-key].direct-editor-logo-image"))')) break;
        await delay(100);
      }
      const imageApplied = await evaluate('Boolean([...document.querySelectorAll("[data-editor-image-key]")].find((item)=>item.style.backgroundImage.includes("data:image")||item.src?.startsWith("data:image")))');
      if (!imageApplied) throw new Error(`Image replacement did not reach the preview on ${url}.`);
      const imageUndoRedo = await evaluate(`(async()=>{const key=${JSON.stringify(imageSelected.key)};const target=[...document.querySelectorAll('[data-editor-image-key]')].find(item=>item.dataset.editorImageKey===key);const buttons=[...document.querySelectorAll('.direct-editor-toolbar button')];if(!target||buttons[1]?.disabled)return null;const state=()=>target instanceof HTMLImageElement?target.getAttribute('src'):target.dataset.editorLogo==='true'?target.querySelector('img.direct-editor-logo-image')?.getAttribute('src')||null:target.style.backgroundImage;buttons[1].click();for(let i=0;i<40&&buttons[2].disabled;i++)await new Promise(resolve=>setTimeout(resolve,100));const afterUndo=state();buttons[2].click();for(let i=0;i<40&&!state()?.includes('data:image');i++)await new Promise(resolve=>setTimeout(resolve,100));return {afterUndo,afterRedo:state()};})()`);
      const undoneImageMatches = imageSelected.original === null ? imageUndoRedo?.afterUndo === null : imageUndoRedo?.afterUndo === imageSelected.original;
      if (!imageUndoRedo || !undoneImageMatches || !imageUndoRedo.afterRedo?.includes('data:image')) throw new Error(`Image replacement undo/redo failed on ${url}: ${JSON.stringify(imageUndoRedo)}.`);
      await evaluate(`new Promise((resolve,reject)=>{const request=indexedDB.open('sst-direct-template-editor');request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result;const transaction=db.transaction('drafts','readonly');transaction.objectStore('drafts').get('${sectorId}');transaction.oncomplete=()=>{db.close();resolve()};transaction.onerror=()=>{db.close();reject(transaction.error)}}})`);
      const imageAltUndoRedo = await evaluate(`(async()=>{const key=document.querySelector('.direct-editor-upload')?.dataset.targetKey;const image=[...document.querySelectorAll('[data-editor-image-key]')].find((item)=>item.dataset.editorImageKey===key);const input=document.querySelector('#direct-image-alt-${sectorId}');const buttons=[...document.querySelectorAll('.direct-editor-toolbar button')];if(!image||!input||buttons[1]?.disabled)return null;const getAlt=()=>image instanceof HTMLImageElement?image.alt:image.getAttribute('aria-label')||'';const before=getAlt();input.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Image de test accessible');input.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:'Image de test accessible'}));input.blur();await new Promise(resolve=>setTimeout(resolve,50));buttons[1].click();await new Promise(resolve=>setTimeout(resolve,75));const afterUndo=getAlt();buttons[2].click();await new Promise(resolve=>setTimeout(resolve,75));return {key,before,afterUndo,afterRedo:getAlt()};})()`);
      if (!imageAltUndoRedo || imageAltUndoRedo.afterUndo !== imageAltUndoRedo.before || imageAltUndoRedo.afterRedo !== 'Image de test accessible') throw new Error(`Image alternative text undo/redo failed on ${url}: ${JSON.stringify(imageAltUndoRedo)}.`);
      for (let attempt = 0; attempt < 30; attempt += 1) {
        if (await evaluate('document.querySelector(".direct-editor-status")?.textContent.includes("Image")')) break;
        await delay(100);
      }
      const logoSelected = await evaluate(`(() => { const logo=document.querySelector('.mock-site [data-editor-logo="true"][data-editor-image-key]'); if(!logo)return false;logo.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));return true; })()`);
      if (!logoSelected) throw new Error(`Replaceable logo target is missing on ${url}.`);
      await send("DOM.setFileInputFiles", { nodeId: imageInputNode, files: [qaImagePath] });
      await evaluate("document.querySelector('.direct-editor-upload')?.dispatchEvent(new Event('change',{bubbles:true}))");
      for (let attempt = 0; attempt < 30; attempt += 1) {
        if (await evaluate('Boolean(document.querySelector(".mock-site .direct-editor-logo-image"))')) break;
        await delay(100);
      }
      if (!(await evaluate('Boolean(document.querySelector(".mock-site .direct-editor-logo-image"))'))) throw new Error(`Logo replacement did not reach the preview on ${url}.`);
      if (sectorId !== "education") {
      const sectionAdded = await evaluate(`(() => { const button=document.querySelector('.direct-editor-section-panel button'); if(!button)return false;button.click();return true; })()`);
      if (!sectionAdded) throw new Error(`Add-section control is missing on ${url}.`);
      let newSectionEditable = false;
      for (let attempt = 0; attempt < 30; attempt += 1) {
        newSectionEditable = await evaluate('Boolean(document.querySelector(".direct-editor-added-section [contenteditable=true]"))');
        if (newSectionEditable) break;
        await delay(100);
      }
      if (!newSectionEditable) throw new Error(`New section is not directly editable on ${url}.`);
      const savedAddedSections = await evaluate(`(async()=>{const db=await new Promise((resolve,reject)=>{const request=indexedDB.open('sst-direct-template-editor');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});const value=await new Promise((resolve,reject)=>{const request=db.transaction('drafts','readonly').objectStore('drafts').get('${sectorId}');request.onsuccess=()=>resolve(request.result?.addedSections||[]);request.onerror=()=>reject(request.error)});db.close();return value;})()`);
      const sectionUndoRedo = await evaluate(`(async()=>{const buttons=[...document.querySelectorAll('.direct-editor-toolbar button')];if(buttons[1]?.disabled)return null;buttons[1].click();for(let i=0;i<40&&buttons[2].disabled;i++)await new Promise(resolve=>setTimeout(resolve,100));const afterUndo=Boolean(document.querySelector('.direct-editor-added-section'));const redoEnabled=!buttons[2].disabled;buttons[2].click();for(let i=0;i<40&&!document.querySelector('.direct-editor-added-section');i++)await new Promise(resolve=>setTimeout(resolve,100));return {afterUndo,redoEnabled,afterRedo:Boolean(document.querySelector('.direct-editor-added-section')),buttons:buttons.map(b=>({text:b.textContent,disabled:b.disabled})),sections:[...document.querySelectorAll('.mock-site [data-editor-section-key]')].map(s=>s.dataset.editorSectionKey),errors:document.querySelector('.direct-editor-status')?.textContent};})()`);
      const redoneAddedSections = await evaluate(`(async()=>{const db=await new Promise((resolve,reject)=>{const request=indexedDB.open('sst-direct-template-editor');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});const value=await new Promise((resolve,reject)=>{const request=db.transaction('drafts','readonly').objectStore('drafts').get('${sectorId}');request.onsuccess=()=>resolve(request.result?.addedSections||[]);request.onerror=()=>reject(request.error)});db.close();return value;})()`);
      if (!sectionUndoRedo || sectionUndoRedo.afterUndo || !sectionUndoRedo.afterRedo) throw new Error(`Section creation undo/redo failed on ${url}: ${JSON.stringify({savedAddedSections,redoneAddedSections,sectionUndoRedo})}.`);
      const selectedBeforeMove = await evaluate('document.querySelector(".direct-editor-added-section")?.classList.contains("is-selected")');
      if (!selectedBeforeMove) {
        const selectedState = await evaluate("JSON.stringify({selected:document.querySelector('.direct-editor-canvas')?.dataset.editorSelectedSection,added:document.querySelector('.direct-editor-added-section')?.dataset.editorSectionKey,sectionKeys:[...document.querySelectorAll('.direct-editor-canvas [data-editor-section-key]')].map((item)=>item.dataset.editorSectionKey),buttons:[...document.querySelectorAll('.direct-editor-section-panel button')].map((item)=>item.textContent)})");
        throw new Error(`New section is not selected for direct editing on ${url}: ${selectedState}.`);
      }
      await evaluate("document.querySelectorAll('.direct-editor-section-panel button')[1]?.click()");
      await delay(100);
      const sectionMoved = await evaluate(`(() => { const site=document.querySelector('.mock-site'); const added=site?.querySelector('[data-editor-added-section]'); return Boolean(site&&added&&added!==site.lastElementChild); })()`);
      if (!sectionMoved) throw new Error(`Section reordering did not update the preview on ${url}.`);
      const selectedAfterMove = await evaluate('document.querySelector(".direct-editor-added-section")?.classList.contains("is-selected")');
      if (!selectedAfterMove) throw new Error(`The selected section lost its selection after moving on ${url}.`);
      await evaluate(`(() => document.querySelector('.mock-site [data-editor-section-key] h2, .mock-site [data-editor-section-key] h3')?.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})))()`);
      await delay(100);
      await evaluate(`(() => [...document.querySelectorAll('.direct-editor-section-panel button')].find((button)=>button.textContent?.includes('Masquer la section'))?.click())()`);
      await delay(100);
      const sectionHidden = await evaluate('Boolean(document.querySelector(".mock-site [data-editor-section-key][hidden]"))');
      if (!sectionHidden) throw new Error(`Template section could not be hidden on ${url}.`);
      const restoreChoice = await evaluate(`(() => { const select=document.querySelector('.direct-editor-section-panel select'); if(!select||!select.options[1])return false;select.value=select.options[1].value;select.dispatchEvent(new Event('change',{bubbles:true}));return true; })()`);
      if (!restoreChoice) throw new Error(`Section restore controls are missing on ${url}.`);
      await delay(100);
      await evaluate("document.querySelector('.direct-editor-section-panel button:last-of-type')?.click()");
      await delay(100);
      if (await evaluate('Boolean(document.querySelector(".direct-editor-added-section")?.hidden)')) throw new Error(`Section could not be restored on ${url}.`);
      await evaluate("document.querySelector('.preview-controls button:nth-child(2)')?.click()");
      await delay(100);
      if (!(await evaluate('Boolean(document.querySelector(".direct-editor-added-section"))'))) throw new Error(`New section disappeared when the preview changed size on ${url}.`);
      await navigate(url);
      for (let attempt = 0; attempt < 30; attempt += 1) {
        if (await evaluate('Boolean(document.querySelector(".direct-editor-added-section"))&&Boolean(document.querySelector(".mock-site .direct-editor-logo-image"))')) break;
        await delay(100);
      }
      if (!(await evaluate('Boolean(document.querySelector(".direct-editor-added-section"))'))) throw new Error(`New section was not restored from the local draft on ${url}.`);
      if (!(await evaluate('Boolean(document.querySelector(".mock-site .direct-editor-logo-image"))'))) throw new Error(`Replacement logo was not restored from the local draft on ${url}.`);
      const imageAltRestored = await evaluate(`(() => {const key=${JSON.stringify(imageAltUndoRedo.key)};const image=[...document.querySelectorAll('[data-editor-image-key]')].find((item)=>item.dataset.editorImageKey===key);return image instanceof HTMLImageElement?image.alt==='Image de test accessible':image?.getAttribute('aria-label')==='Image de test accessible';})()`);
      if (!imageAltRestored) throw new Error(`Image alternative text was not restored from the local draft on ${url}.`);
      if (fieldEdit) {
        const fieldRestored = await evaluate(`(() => [...document.querySelectorAll('[data-editor-field-key]')].find((item)=>item.dataset.editorFieldKey===${JSON.stringify(fieldEdit.key)})?.placeholder==='Adresse e-mail pour les nouveautÃ©s')()`);
        if (!fieldRestored) throw new Error(`Form field draft was not restored on ${url}.`);
      }
      const accentRestored = await evaluate('document.querySelector(".mock-site")?.style.getPropertyValue("--direct-editor-accent")==="#123456"');
      if (!accentRestored) throw new Error(`Accent color was not restored from the local draft on ${url}.`);
      const editedTextRestored = await evaluate(`(() => { const element=[...document.querySelectorAll('.direct-editor-canvas [data-editor-text-key]')].find((item)=>item.dataset.editorTextKey===${JSON.stringify(editedText.key)}); const saved=JSON.parse(localStorage.getItem('sst:direct-template:${url.split("/").at(-1)}:text:v1')||'{}'); return Boolean(element)&&element.textContent===saved[${JSON.stringify(editedText.key)}]; })()`);
      if (!editedTextRestored) {
        const textState = await evaluate(`JSON.stringify({actual:[...document.querySelectorAll('.direct-editor-canvas [data-editor-text-key]')].find((item)=>item.dataset.editorTextKey===${JSON.stringify(editedText.key)})?.textContent,saved:JSON.parse(localStorage.getItem('sst:direct-template:${url.split("/").at(-1)}:text:v1')||'{}')[${JSON.stringify(editedText.key)}]})`);
        throw new Error(`Edited text was not restored after reload on ${url}: ${textState}.`);
      }
      await evaluate("document.querySelector('.direct-editor-toolbar button')?.click()");
      await delay(100);
      const linkPanelOpened = await evaluate(`(() => { const link=[...document.querySelectorAll('.mock-site a[data-editor-link-key]')].find((item)=>item.dataset.editorLogo!=='true'); if(!link)return false;link.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));return true; })()`);
      if (!linkPanelOpened) throw new Error(`Editable link is missing on ${url}.`);
      await delay(100);
      if (!(await evaluate('Boolean(document.querySelector(".direct-editor-link-panel input"))'))) throw new Error(`Link destination editor did not open on ${url}.`);
      const linkSaved = await evaluate(`(() => { const input=document.querySelector('.direct-editor-link-panel input'); if(!input)return null; const link=[...document.querySelectorAll('.mock-site a[data-editor-link-key]')].find((item)=>item.dataset.editorLogo!=='true'); if(!link)return null; const key=link.dataset.editorLinkKey;const before=link.getAttribute('href')||'';input.focus();Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'#qa-destination');input.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:'#qa-destination'}));input.blur();return {key,before,href:link.getAttribute('href')}; })()`);
      if (!linkSaved || linkSaved.href !== '#qa-destination') throw new Error(`Link destination was not saved locally on ${url}: ${JSON.stringify(linkSaved)}.`);
      const linkUndoRedo = await evaluate(`(async()=>{const key=${JSON.stringify(linkSaved.key)};const target=[...document.querySelectorAll('.mock-site a[data-editor-link-key]')].find(item=>item.dataset.editorLinkKey===key);const buttons=[...document.querySelectorAll('.direct-editor-toolbar button')];if(!target||buttons[1]?.disabled)return null;buttons[1].click();for(let i=0;i<40&&buttons[2].disabled;i++)await new Promise(resolve=>setTimeout(resolve,100));const afterUndo=target.getAttribute('href')||'';buttons[2].click();for(let i=0;i<40&&((JSON.parse(localStorage.getItem('sst:direct-template:${url.split("/").at(-1)}:links:v1')||'{}'))[key]||'')!=='#qa-destination';i++)await new Promise(resolve=>setTimeout(resolve,100));return {afterUndo,afterRedo:target.getAttribute('href')||''};})()`);
      if (!linkUndoRedo || linkUndoRedo.afterUndo !== linkSaved.before || linkUndoRedo.afterRedo !== '#qa-destination') throw new Error(`Link undo/redo failed on ${url}: ${JSON.stringify(linkUndoRedo)}.`);
      await evaluate(`document.querySelector('.direct-editor-added-section h2')?.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}))`);
      await delay(100);
      await evaluate(`(() => [...document.querySelectorAll('.direct-editor-section-panel button')].find((button)=>button.textContent?.includes('Supprimer cette section'))?.click())()`);
      await delay(100);
      if (!(await evaluate('!document.querySelector(".direct-editor-added-section")'))) throw new Error(`Added section could not be deleted on ${url}.`);
      await navigate(url);
      if (!(await evaluate('!document.querySelector(".direct-editor-added-section")'))) throw new Error(`Deleted section returned after reloading ${url}.`);
      await evaluate(`localStorage.removeItem('sst:direct-template:${url.split("/").at(-1)}:text:v1');localStorage.removeItem('sst:direct-template:${url.split("/").at(-1)}:links:v1');localStorage.removeItem('sst:direct-template:${sectorId}:accent:v1')`);
      await evaluate('new Promise((resolve)=>{const request=indexedDB.deleteDatabase("sst-direct-template-editor");request.onsuccess=request.onerror=request.onblocked=()=>resolve();})');
      await navigate(url);
      await evaluate("document.querySelector('.direct-editor-toolbar button')?.click()");
      await delay(100);
      }
        directEditorInteractionsVerified.add(sectorId);
      }
    }
    const state = JSON.parse(await evaluate(`JSON.stringify({width:innerWidth,pageWidth:document.documentElement.scrollWidth,title:document.title,profile:Boolean(document.querySelector('.sector-page')),editor:Boolean(document.querySelector('.direct-editor-canvas.is-editing')),editableText:document.querySelectorAll('.direct-editor-canvas.is-editing [contenteditable="true"]').length,diagnostic:document.querySelector('.sector-side')?.innerText.slice(0,500)})`));
    if (state.width !== width) throw new Error(`${url} expected viewport ${width}px, got ${state.width}px.`);
    if (state.pageWidth > state.width + 1) throw new Error(`${url} overflows horizontally at ${width}px (${state.pageWidth}px document).`);
    if (!url.endsWith("/") && (!state.profile || (enableEditor && (!state.editor || state.editableText < 1)))) throw new Error(`${url} did not render an active direct editor at ${width}px: ${JSON.stringify(state)}.`);
    if (captureDir && !url.endsWith("/")) {
      const { result: { root } } = await send("DOM.getDocument", { depth: -1 });
      const { result: { nodeId } } = await send("DOM.querySelector", { nodeId: root.nodeId, selector: ".mock-site" });
      const { result: { model } } = await send("DOM.getBoxModel", { nodeId });
      const points = model.border;
      const x = Math.min(points[0], points[2], points[4], points[6]);
      const y = Math.min(points[1], points[3], points[5], points[7]);
      const boxWidth = Math.max(points[0], points[2], points[4], points[6]) - x;
      const boxHeight = Math.max(points[1], points[3], points[5], points[7]) - y;
      const { result: { data } } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x, y, width: boxWidth, height: boxHeight, scale: 1 } });
      await mkdir(captureDir, { recursive: true });
      const sectorId = url.split("/").at(-1);
      await writeFile(path.join(captureDir, `${sectorId}-${width}px.png`), Buffer.from(data, "base64"));
    }
  };

  await send("Page.enable");
  await send("Runtime.enable");
  const mobileHeight = 844;
  let inspected = 0;
  for (const sectorId of mobileSectorIds) {
    await inspect(`${baseUrl}/templates/${sectorId}`, 390, mobileHeight, true);
    inspected += 1;
    if (!quickSector && inspected % 10 === 0) console.log(`Mobile direct-editor checks: ${inspected}/${sectorIds.length}`);
  }
  await inspect(`${baseUrl}/`, 320, 568, false);
  await delay(750);
  const feedState = await evaluate(`(() => {
    const slide = document.querySelector(".image-feed-slide");
    const rail = document.querySelector(".image-feed-actions");
    const actions = [...(rail?.querySelectorAll("button, a") ?? [])].map((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return { label: element.getAttribute("aria-label"), visible: style.display !== "none" && rect.width > 0 && rect.height > 0, left: Math.round(rect.left), right: Math.round(rect.right) };
    });
    return { slides: document.querySelectorAll(".image-feed-slide").length, title: slide?.getAttribute("aria-label"), hasOldHeader: Boolean(document.querySelector(".feed-header")), hasOldFooter: Boolean(document.querySelector(".feed-footer")), actions, viewportWidth: innerWidth, pageWidth: document.documentElement.scrollWidth };
  })()`);
  if (!feedState.slides || feedState.hasOldHeader || feedState.hasOldFooter || feedState.actions.length !== 4 || feedState.actions.some((action) => !action.visible || action.left < 0 || action.right > feedState.viewportWidth) || feedState.pageWidth > feedState.viewportWidth) {
    throw new Error(`Image-feed home check failed: ${JSON.stringify(feedState)}`);
  }
  const likeSelector = '.image-feed-action[aria-label="Jâ€™aime"]';
  const likeBefore = await evaluate(`document.querySelector(${JSON.stringify(likeSelector)})?.getAttribute("aria-pressed")`);
  await clickSelector(likeSelector);
  const likeActive = await evaluate(`document.querySelector('.image-feed-action.is-liked')?.getAttribute("aria-pressed") === "true"`);
  await clickSelector('.image-feed-action[aria-label="Retirer Jâ€™aime"]');
  const likeReset = await evaluate(`document.querySelector(${JSON.stringify(likeSelector)})?.getAttribute("aria-pressed") === "false"`);
  if (likeBefore !== "false" || !likeActive || !likeReset) throw new Error("The image-feed like button did not toggle locally.");
  await clickSelector('.image-feed-action[aria-label="Commenter"]');
  const commentInputReady = await evaluate('Boolean(document.querySelector(".image-feed-comments input"))');
  if (!commentInputReady) throw new Error("The image-feed comment panel did not open.");
  await send("Input.insertText", { text: "Commentaire local QA" });
  await clickSelector('.image-feed-comments form button[type="submit"]');
  const commentState = await evaluate(`(() => {
    const accepted = [...document.querySelectorAll(".image-feed-comments li")].some((item) => item.textContent === "Commentaire local QA");
    const disclosed = document.querySelector(".image-feed-comment-note")?.textContent.includes("ne sont pas publiÃ©s");
    return accepted && disclosed;
  })()`);
  if (!commentState) throw new Error("The local comment flow did not submit transparently.");
  await clickSelector(".image-feed-dialog-close");
  console.log(`Image-feed home check passed at 320px: ${feedState.slides} slides and four visible actions on the current slide.`);
  if (feedCaptureDir) {
    for (const width of [390, 1440]) {
      const height = width < 600 ? 844 : 900;
      await setViewport(width, height);
      await navigate(`${baseUrl}/`);
      await delay(350);
      const { result: { data } } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      await mkdir(feedCaptureDir, { recursive: true });
      await writeFile(path.join(feedCaptureDir, `home-feed-${width}px.png`), Buffer.from(data, "base64"));
    }
  }
  const representativeIds = quickSectors ?? ["education", "single-product", "multi-product", "service-booking", "restaurant"];
  for (const width of [320, 390, 768, 1440]) {
    const height = width === 320 ? 700 : width < 600 ? 844 : width < 1000 ? 1024 : 1000;
    for (const sectorId of representativeIds) {
      await inspect(`${baseUrl}/templates/${sectorId}`, width, height, true);
      inspected += 1;
    }
  }
  console.log(quickSectors ? `Responsive browser QA passed for ${quickSectors.join(", ")} direct editors and feed; text/form/image-alt/link/photo/accent/section undo/redo, logo replacement, persistence, and responsive overflow checks verified.` : `Responsive browser QA passed: feed at 320px, direct editor for all ${sectorIds.length} profiles at 390px, and five representative editors at 320px, 768px, and 1440px; no horizontal overflow.`);
} finally {
  if (socket?.readyState === WebSocket.OPEN) {
    try { await Promise.race([new Promise((resolve) => { socket.addEventListener("close", resolve, { once: true }); socket.send(JSON.stringify({ id: 999999, method: "Browser.close" })); }), delay(500)]); } catch { /* The browser may already have closed. */ }
  }
  if (browser.exitCode === null) {
    await Promise.race([new Promise((resolve) => browser.once("exit", resolve)), delay(1500)]);
  }
  if (browser.exitCode === null) {
    try { await runFile("taskkill", ["/PID", String(browser.pid), "/T", "/F"], { windowsHide: true }); } catch { /* It may have exited between the check and taskkill. */ }
  }
  if (socket && socket.readyState !== WebSocket.CLOSED) socket.close();
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { await rm(directory, { recursive: true, force: true }); break; }
    catch (error) { if (attempt === 49) console.warn(`Could not remove temporary browser profile ${directory}: ${error.message}`); else await delay(300); }
  }
}

