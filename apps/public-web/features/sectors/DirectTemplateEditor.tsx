"use client";

import type { ChangeEvent, FocusEvent, FormEvent, KeyboardEvent, MouseEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { deleteDoc, doc, getDoc, runTransaction, serverTimestamp, writeBatch } from "firebase/firestore";
import { deleteObject, getBytes, getMetadata, listAll, ref as storageRef, uploadBytes, type FirebaseStorage } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { getLocalFirebaseAuth, getLocalFirebaseFirestore, getLocalFirebaseFunctions, getLocalFirebaseStorage } from "../auth/firebase-client";

type AddedSection = { id: string; title: string; body: string };
type FieldValue = { placeholder: string; value: string };
type EditorDraft = { images: Record<string, string>; altTexts: Record<string, string>; fields: Record<string, FieldValue>; sectionOrder: string[]; hiddenSections: string[]; addedSections: AddedSection[] };
type CloudEditorConfiguration = {
  text: Record<string, string>;
  links: Record<string, string>;
  accent: string;
  images: Record<string, string>;
  altTexts: Record<string, string>;
  fields: Record<string, FieldValue>;
  sectionOrder: string[];
  hiddenSections: string[];
  addedSections: AddedSection[];
};
type StructureSnapshot = Pick<EditorDraft, "sectionOrder" | "hiddenSections" | "addedSections">;
type EditHistory =
  | { kind: "text" | "link" | "accent"; key: string; before: string; after: string }
  | { kind: "alt"; key: string; before: string; after: string }
  | { kind: "field"; key: string; before: FieldValue; after: FieldValue }
  | { kind: "image"; key: string; before: string | null; after: string }
  | { kind: "structure"; before: StructureSnapshot; after: StructureSnapshot };

const emptyDraft = (): EditorDraft => ({ images: {}, altTexts: {}, fields: {}, sectionOrder: [], hiddenSections: [], addedSections: [] });

function dataUrlToBlob(value: string) {
  const match = /^data:(image\/(?:png|jpeg|webp|avif));base64,([A-Za-z0-9+/=]+)$/.exec(value);
  if (!match) throw new Error("Une image du brouillon n’a pas un format pris en charge.");
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  if (bytes.byteLength > 8 * 1024 * 1024) throw new Error("Une image dépasse la limite de 8 Mo.");
  return new Blob([bytes], { type: match[1] });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Lecture de l’image impossible."));
    reader.onerror = () => reject(new Error("Téléchargement de l’image impossible."));
    reader.readAsDataURL(blob);
  });
}

function readLocalObject(key: string): Record<string, string> {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, string> : {};
  } catch {
    return {};
  }
}

function imageStoragePath(userId: string, sectorId: string, key: string, mimeType: string) {
  const extension = ({ "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/avif": "avif" } as Record<string, string>)[mimeType];
  if (!extension) throw new Error("Format d’image non pris en charge.");
  return `sstTenants/${userId}/projects/${sectorId}/drafts/quarantine/${encodeURIComponent(key)}.${crypto.randomUUID()}.${extension}`;
}

async function deleteStorageTree(storage: FirebaseStorage, path: string) {
  const listing = await listAll(storageRef(storage, path));
  await Promise.all(listing.items.map((item) => deleteObject(item)));
  await Promise.all(listing.prefixes.map((prefix) => deleteStorageTree(storage, prefix.fullPath)));
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)
    && Object.values(value).every((entry) => typeof entry === "string"));
}

function isCloudConfiguration(value: unknown): value is CloudEditorConfiguration {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const config = value as Record<string, unknown>;
  return isStringRecord(config.text)
    && isStringRecord(config.links)
    && typeof config.accent === "string"
    && isStringRecord(config.images)
    && isStringRecord(config.altTexts)
    && Boolean(config.fields && typeof config.fields === "object" && !Array.isArray(config.fields)
      && Object.values(config.fields).every((field) => Boolean(field && typeof field === "object"
        && typeof (field as FieldValue).placeholder === "string"
        && typeof (field as FieldValue).value === "string")))
    && Array.isArray(config.sectionOrder)
    && config.sectionOrder.every((key) => typeof key === "string")
    && Array.isArray(config.hiddenSections)
    && config.hiddenSections.every((key) => typeof key === "string")
    && Array.isArray(config.addedSections)
    && config.addedSections.every((section) => Boolean(section && typeof section === "object"
      && typeof (section as AddedSection).id === "string"
      && typeof (section as AddedSection).title === "string"
      && typeof (section as AddedSection).body === "string"));
}

function readFieldValue(element: HTMLInputElement | HTMLTextAreaElement): FieldValue {
  return { placeholder: element.placeholder, value: element.value };
}

function applyFieldValue(root: HTMLElement, key: string, value: FieldValue) {
  const element = Array.from(root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-editor-field-key]"))
    .find((candidate) => candidate.dataset.editorFieldKey === key);
  if (!element) return;
  element.placeholder = value.placeholder;
  element.value = value.value;
}

function openDraftDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("sst-direct-template-editor", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readImageDraft(sectorId: string): Promise<EditorDraft> {
  const database = await openDraftDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction("drafts", "readonly").objectStore("drafts").get(sectorId);
    request.onsuccess = () => {
      const stored = request.result;
      if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
        resolve(emptyDraft());
      } else if ("images" in stored && typeof stored.images === "object" && stored.images !== null) {
        resolve({ ...emptyDraft(), ...stored, images: stored.images as Record<string, string> } as EditorDraft);
      } else {
        // Migrate image-only drafts created by the first direct-editor prototype.
        const images = Object.fromEntries(Object.entries(stored).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
        resolve({ ...emptyDraft(), images });
      }
    };
    request.onerror = () => reject(request.error);
    request.transaction?.addEventListener("complete", () => database.close(), { once: true });
  });
}

async function writeImageDraft(sectorId: string, draft: EditorDraft | null) {
  const database = await openDraftDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction("drafts", "readwrite");
    const store = transaction.objectStore("drafts");
    if (draft) store.put(draft, sectorId);
    else store.delete(sectorId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  database.close();
}

function applyImage(root: HTMLElement, key: string, source: string) {
  const target = Array.from(root.querySelectorAll<HTMLElement>("[data-editor-image-key]"))
    .find((element) => element.dataset.editorImageKey === key);
  if (!target) return;
  if (target instanceof HTMLImageElement) {
    target.src = source;
    return;
  }
  if (target.dataset.editorLogo === "true") {
    const currentLogo = target.querySelector<HTMLImageElement>(":scope > img.direct-editor-logo-image");
    if (currentLogo?.src === source) return;
    const logo = document.createElement("img");
    logo.src = source;
    logo.alt = currentLogo?.alt || target.getAttribute("aria-label") || "Logo";
    logo.className = "direct-editor-logo-image";
    target.replaceChildren(logo);
    return;
  }
  target.style.backgroundImage = `url("${source}")`;
  target.style.backgroundPosition = "center";
  target.style.backgroundSize = "cover";
}

function getImageAlternative(target: HTMLElement) {
  if (target instanceof HTMLImageElement) return target.alt;
  if (target.dataset.editorLogo === "true") return target.querySelector<HTMLImageElement>(":scope > img.direct-editor-logo-image")?.alt || target.getAttribute("aria-label") || "";
  return target.getAttribute("aria-label") || "";
}

function applyImageAlternative(root: HTMLElement, key: string, value: string) {
  const target = Array.from(root.querySelectorAll<HTMLElement>("[data-editor-image-key]")).find((element) => element.dataset.editorImageKey === key);
  if (!target) return;
  if (target instanceof HTMLImageElement) target.alt = value;
  else if (target.dataset.editorLogo === "true") {
    const logo = target.querySelector<HTMLImageElement>(":scope > img.direct-editor-logo-image");
    if (logo) logo.alt = value;
    target.setAttribute("aria-label", value || "Logo");
  } else if (value) target.setAttribute("aria-label", value);
  else target.removeAttribute("aria-label");
}

function addSectionElement(root: HTMLElement, section: AddedSection) {
  const site = root.querySelector<HTMLElement>(".mock-site");
  if (!site || site.querySelector(`[data-editor-section-key="added-${section.id}"]`)) return;
  const element = document.createElement("section");
  element.className = "direct-editor-added-section";
  element.dataset.editorAddedSection = section.id;
  element.dataset.editorSectionKey = `added-${section.id}`;
  const image = document.createElement("div");
  image.className = "direct-editor-added-image";
  image.dataset.editorImageKey = `added-${section.id}`;
  image.setAttribute("role", "img");
  image.setAttribute("aria-label", "Image de la section, cliquer pour la choisir");
  const heading = document.createElement("h2");
  heading.dataset.editorTextKey = `added-${section.id}-title`;
  heading.textContent = section.title;
  const body = document.createElement("p");
  body.dataset.editorTextKey = `added-${section.id}-body`;
  body.textContent = section.body;
  element.append(image, heading, body);
  site.append(element);
}

function applyEditorStructure(root: HTMLElement, draft: EditorDraft) {
  const expectedAdded = new Set(draft.addedSections.map((section) => section.id));
  root.querySelectorAll<HTMLElement>("[data-editor-added-section]").forEach((element) => {
    if (!expectedAdded.has(element.dataset.editorAddedSection || "")) element.remove();
  });
  draft.addedSections.forEach((section) => addSectionElement(root, section));
  const site = root.querySelector<HTMLElement>(".mock-site");
  if (site && draft.sectionOrder.length) {
    const children = Array.from(site.children) as HTMLElement[];
    const byKey = new Map(children.map((element) => [element.dataset.editorSectionKey, element]));
    for (const key of draft.sectionOrder) {
      const element = byKey.get(key);
      if (element) site.append(element);
    }
  }
  const hidden = new Set(draft.hiddenSections);
  root.querySelectorAll<HTMLElement>("[data-editor-section-key]").forEach((element) => {
    element.hidden = hidden.has(element.dataset.editorSectionKey || "");
  });
  for (const [key, source] of Object.entries(draft.images)) applyImage(root, key, source);
  for (const [key, value] of Object.entries(draft.altTexts)) applyImageAlternative(root, key, value);
  for (const [key, value] of Object.entries(draft.fields)) applyFieldValue(root, key, value);
}

function captureStructure(root: HTMLElement): StructureSnapshot {
  const site = root.querySelector<HTMLElement>(".mock-site");
  return {
    sectionOrder: Array.from(site?.children ?? []).map((element) => (element as HTMLElement).dataset.editorSectionKey).filter((key): key is string => Boolean(key)),
    hiddenSections: Array.from(root.querySelectorAll<HTMLElement>("[data-editor-section-key]"))
      .filter((element) => element.hidden)
      .map((element) => element.dataset.editorSectionKey)
      .filter((key): key is string => Boolean(key)),
    addedSections: Array.from(root.querySelectorAll<HTMLElement>("[data-editor-added-section]"))
      .map((element) => ({ id: element.dataset.editorAddedSection || "", title: element.querySelector("h2")?.textContent || "", body: element.querySelector("p")?.textContent || "" }))
      .filter((section) => Boolean(section.id)),
  };
}

function getSectionLabels(root: HTMLElement): Record<string, string> {
  return Object.fromEntries(Array.from(root.querySelectorAll<HTMLElement>("[data-editor-section-key]")).map((element) => {
    const key = element.dataset.editorSectionKey || "";
    return [key, element.querySelector("h1,h2,h3,h4,h5,h6")?.textContent?.trim() || key || "Section"];
  }));
}

function applyAccent(root: HTMLElement, color: string) {
  const site = root.querySelector<HTMLElement>(".mock-site");
  if (!site) return;
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  const linear = [red, green, blue].map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  site.style.setProperty("--direct-editor-accent", color);
  site.style.setProperty("--direct-editor-accent-foreground", luminance > 0.179 ? "#101820" : "#ffffff");
  site.dataset.customAccent = "true";
}

/** Give the existing sector previews stable edit targets without changing their design markup. */
function decorateEditableContent(root: HTMLElement) {
  const site = root.querySelector<HTMLElement>(".mock-site");
  if (!site) return;
  const keyFor = (element: HTMLElement) => {
    const parts: string[] = [];
    let current: HTMLElement | null = element;
    while (current && current !== site) {
      const parent: HTMLElement | null = current.parentElement;
      const siblings = parent ? Array.from(parent.children).filter((child) => child.tagName === current?.tagName) : [];
      parts.unshift(`${current.tagName.toLowerCase()}-${siblings.indexOf(current)}`);
      current = parent;
    }
    return parts.join("-");
  };

  Array.from(site.children).forEach((section, index) => {
    const element = section as HTMLElement;
    if (!element.dataset.editorSectionKey) element.dataset.editorSectionKey = `section-${index}`;
  });
  site.querySelectorAll<HTMLElement>("*").forEach((element) => {
    const key = keyFor(element);
    const directText = Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim()));
    if (directText && !element.closest("[data-editor-text-key]")) element.dataset.editorTextKey ||= `text-${key}`;
    if (element instanceof HTMLAnchorElement) element.dataset.editorLinkKey ||= `link-${key}`;
    const imageLike = element instanceof HTMLImageElement
      || element.getAttribute("role") === "img"
      || element.dataset.editorLogo === "true"
      || (!element.children.length && /(?:photo|image|logo|hero|visual|cover)/i.test(element.className));
    if (imageLike) element.dataset.editorImageKey ||= `image-${key}`;
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) element.dataset.editorFieldKey ||= `field-${key}`;
    if (element.matches("a[class*='brand'], [class*='logo']")) element.dataset.editorLogo = "true";
  });
}

function applyTextDraft(root: HTMLElement, storageKey: string) {
  try {
    const savedText: unknown = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
    if (!savedText || typeof savedText !== "object" || Array.isArray(savedText)) return;
    root.querySelectorAll<HTMLElement>("[data-editor-text-key]").forEach((element) => {
      const value = (savedText as Record<string, unknown>)[element.dataset.editorTextKey || ""];
      if (typeof value === "string") element.textContent = value;
    });
  } catch {
    // Keep the starter text visible when a local draft cannot be parsed.
  }
}

export function DirectTemplateEditor({ sectorId, templateName, children }: { sectorId: string; templateName: string; children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const accentInputRef = useRef<HTMLInputElement>(null);
  const imageDraftRef = useRef<EditorDraft>(emptyDraft());
  const originalImagesRef = useRef(new Map<string, { src: string | null; backgroundImage: string; backgroundPosition: string; backgroundSize: string; logoChildren: Node[] }>());
  const undoHistoryRef = useRef<EditHistory[]>([]);
  const redoHistoryRef = useRef<EditHistory[]>([]);
  const textBeforeRef = useRef<Record<string, string>>({});
  const linkBeforeRef = useRef<Record<string, string>>({});
  const altBeforeRef = useRef<Record<string, string>>({});
  const fieldBeforeRef = useRef<Record<string, FieldValue>>({});
  const accentBeforeRef = useRef<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [ready, setReady] = useState(false);
  const [accountUser, setAccountUser] = useState<User | null>(null);
  const [accountReady, setAccountReady] = useState(false);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudDraftAvailable, setCloudDraftAvailable] = useState(false);
  const [message, setMessage] = useState("Les modifications restent dans ce navigateur.");
  const textStorageKey = `sst:direct-template:${sectorId}:text:v1`;
  const linkStorageKey = `sst:direct-template:${sectorId}:links:v1`;
  const accentStorageKey = `sst:direct-template:${sectorId}:accent:v1`;
  const [selectedLinkKey, setSelectedLinkKey] = useState<string | null>(null);
  const [selectedLinkHref, setSelectedLinkHref] = useState("");
  const [selectedImageKey, setSelectedImageKey] = useState<string | null>(null);
  const [selectedImageAlt, setSelectedImageAlt] = useState("");
  const [editableFields, setEditableFields] = useState<Array<{ key: string; label: string }>>([]);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [selectedFieldValue, setSelectedFieldValue] = useState<FieldValue>({ placeholder: "", value: "" });
  const [selectedSectionKey, setSelectedSectionKey] = useState<string | null>(null);
  const [hiddenSectionKeys, setHiddenSectionKeys] = useState<string[]>([]);
  const [sectionLabels, setSectionLabels] = useState<Record<string, string>>({});
  const [restoreSectionKey, setRestoreSectionKey] = useState("");
  const [sectionRefresh, setSectionRefresh] = useState(0);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const cloudProjectPath = `sstTenants/${accountUser?.uid || ""}/projects/${sectorId}`;
  const cloudDraftPath = `${cloudProjectPath}/drafts/${sectorId}`;

  function refreshHistoryState() {
    setHistoryState({ canUndo: undoHistoryRef.current.length > 0, canRedo: redoHistoryRef.current.length > 0 });
  }

  function pushHistory(change: EditHistory) {
    const previous = undoHistoryRef.current.at(-1);
    const canMergeText = (change.kind === "text" || change.kind === "link" || change.kind === "accent" || change.kind === "alt")
      && previous?.kind === change.kind
      && "key" in previous
      && "key" in change
      && previous.key === change.key;
    const canMergeField = change.kind === "field" && previous?.kind === "field" && previous.key === change.key;
    if (canMergeText) {
      undoHistoryRef.current[undoHistoryRef.current.length - 1] = { ...change, before: previous.before } as EditHistory;
    } else if (canMergeField) {
      undoHistoryRef.current[undoHistoryRef.current.length - 1] = { ...change, before: previous.before };
    } else {
      undoHistoryRef.current.push(change);
    }
    if (undoHistoryRef.current.length > 100) undoHistoryRef.current.shift();
    redoHistoryRef.current = [];
    refreshHistoryState();
  }

  function beginTextEdit(event: { target: EventTarget | null }) {
    const target = event.target;
    if (target instanceof HTMLElement && target.dataset.editorTextKey) textBeforeRef.current[target.dataset.editorTextKey] = target.textContent || "";
  }

  function commitTextEdit(event: FocusEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.dataset.editorTextKey) return;
    const key = target.dataset.editorTextKey;
    const before = textBeforeRef.current[key];
    const after = target.textContent || "";
    delete textBeforeRef.current[key];
    if (before !== undefined && before !== after) pushHistory({ kind: "text", key, before, after });
  }

  function beginAccentEdit() {
    accentBeforeRef.current = window.localStorage.getItem(accentStorageKey) || "";
  }

  function commitAccentEdit() {
    const before = accentBeforeRef.current;
    const after = window.localStorage.getItem(accentStorageKey) || "";
    accentBeforeRef.current = null;
    if (before !== null && before !== after) pushHistory({ kind: "accent", key: sectorId, before, after });
  }

  function commitSelectedLinkEdit() {
    if (selectedLinkKey === null) return;
    const before = linkBeforeRef.current[selectedLinkKey];
    const link = Array.from(rootRef.current?.querySelectorAll<HTMLAnchorElement>("[data-editor-link-key]") || [])
      .find((element) => element.dataset.editorLinkKey === selectedLinkKey);
    if (!link) return;
    const after = link.getAttribute("href") || "";
    delete linkBeforeRef.current[selectedLinkKey];
    if (before !== undefined && before !== after) pushHistory({ kind: "link", key: selectedLinkKey, before, after });
  }

  function commitSelectedImageAlt() {
    if (selectedImageKey === null) return;
    const before = altBeforeRef.current[selectedImageKey];
    const after = document.getElementById(`direct-image-alt-${sectorId}`) instanceof HTMLInputElement
      ? (document.getElementById(`direct-image-alt-${sectorId}`) as HTMLInputElement).value
      : selectedImageAlt;
    setSelectedImageAlt(after);
    delete altBeforeRef.current[selectedImageKey];
    if (before !== undefined && before !== after) pushHistory({ kind: "alt", key: selectedImageKey, before, after });
  }

  function commitSelectedField() {
    if (selectedFieldKey === null) return;
    const before = fieldBeforeRef.current[selectedFieldKey];
    const placeholder = document.getElementById(`direct-field-placeholder-${sectorId}`);
    const initialValue = document.getElementById(`direct-field-value-${sectorId}`);
    const after = {
      placeholder: placeholder instanceof HTMLInputElement ? placeholder.value : selectedFieldValue.placeholder,
      value: initialValue instanceof HTMLInputElement ? initialValue.value : selectedFieldValue.value,
    };
    setSelectedFieldValue(after);
    delete fieldBeforeRef.current[selectedFieldKey];
    if (before && (before.placeholder !== after.placeholder || before.value !== after.value)) {
      pushHistory({ kind: "field", key: selectedFieldKey, before, after });
    }
  }

  async function applyHistoryChange(change: EditHistory, side: "before" | "after") {
    const root = rootRef.current;
    if (!root) return;
    if (change.kind === "text") {
      const value = change[side];
      const target = Array.from(root.querySelectorAll<HTMLElement>("[data-editor-text-key]"))
        .find((element) => element.dataset.editorTextKey === change.key);
      if (!target) return;
      target.textContent = value;
      const values: Record<string, string> = {};
      root.querySelectorAll<HTMLElement>("[data-editor-text-key]").forEach((element) => {
        if (element.dataset.editorTextKey) values[element.dataset.editorTextKey] = element.textContent || "";
      });
      window.localStorage.setItem(textStorageKey, JSON.stringify(values));
      setSectionLabels(getSectionLabels(root));
      return;
    }
    if (change.kind === "link") {
      const value = change[side];
      const target = Array.from(root.querySelectorAll<HTMLAnchorElement>("[data-editor-link-key]"))
        .find((element) => element.dataset.editorLinkKey === change.key);
      if (!target) return;
      if (value && isSafeDestination(value)) target.setAttribute("href", value);
      else target.removeAttribute("href");
      const values: Record<string, string> = {};
      root.querySelectorAll<HTMLAnchorElement>("[data-editor-link-key]").forEach((element) => {
        if (element.dataset.editorLinkKey) values[element.dataset.editorLinkKey] = element.getAttribute("href") || "";
      });
      window.localStorage.setItem(linkStorageKey, JSON.stringify(values));
      return;
    }
    if (change.kind === "accent") {
      const value = change[side];
      const site = root.querySelector<HTMLElement>(".mock-site");
      if (value) {
        applyAccent(root, value);
        window.localStorage.setItem(accentStorageKey, value);
      } else {
        site?.style.removeProperty("--direct-editor-accent");
        site?.style.removeProperty("--direct-editor-accent-foreground");
        if (site) delete site.dataset.customAccent;
        window.localStorage.removeItem(accentStorageKey);
      }
      return;
    }
    if (change.kind === "alt") {
      const value = change[side];
      applyImageAlternative(root, change.key, value);
      const draft = { ...imageDraftRef.current, altTexts: { ...imageDraftRef.current.altTexts, [change.key]: value } };
      imageDraftRef.current = draft;
      altBeforeRef.current[change.key] = value;
      await writeImageDraft(sectorId, draft);
      if (selectedImageKey === change.key) setSelectedImageAlt(value);
      return;
    }
    if (change.kind === "field") {
      const value = change[side];
      applyFieldValue(root, change.key, value);
      const draft = { ...imageDraftRef.current, fields: { ...imageDraftRef.current.fields, [change.key]: value } };
      imageDraftRef.current = draft;
      fieldBeforeRef.current[change.key] = value;
      await writeImageDraft(sectorId, draft);
      if (selectedFieldKey === change.key) setSelectedFieldValue(value);
      return;
    }
    if (change.kind === "image") {
      const value = change[side];
      const images = { ...imageDraftRef.current.images };
      if (value === null) {
        delete images[change.key];
        const target = Array.from(root.querySelectorAll<HTMLElement>("[data-editor-image-key]"))
          .find((element) => element.dataset.editorImageKey === change.key);
        const original = originalImagesRef.current.get(change.key);
        if (target && original) {
          if (target instanceof HTMLImageElement) {
            if (original.src) target.setAttribute("src", original.src);
            else target.removeAttribute("src");
          } else if (target.dataset.editorLogo === "true") {
            target.replaceChildren(...original.logoChildren.map((node) => node.cloneNode(true)));
          } else {
            target.style.backgroundImage = original.backgroundImage;
            target.style.backgroundPosition = original.backgroundPosition;
            target.style.backgroundSize = original.backgroundSize;
          }
        }
      } else {
        images[change.key] = value;
        applyImage(root, change.key, value);
      }
      const draft = { ...imageDraftRef.current, images };
      imageDraftRef.current = draft;
      await writeImageDraft(sectorId, draft);
      if (draft.altTexts[change.key] !== undefined) applyImageAlternative(root, change.key, draft.altTexts[change.key]);
      return;
    }
    const draft: EditorDraft = { ...imageDraftRef.current, ...(change[side] as StructureSnapshot) };
    imageDraftRef.current = draft;
    applyEditorStructure(root, draft);
    await writeImageDraft(sectorId, draft);
    setHiddenSectionKeys(draft.hiddenSections);
    setSectionLabels(getSectionLabels(root));
    setSectionRefresh((revision) => revision + 1);
  }

  async function undoChange() {
    const change = undoHistoryRef.current.pop();
    if (!change) return;
    try {
      await applyHistoryChange(change, "before");
      redoHistoryRef.current.push(change);
      refreshHistoryState();
    } catch {
      undoHistoryRef.current.push(change);
      setMessage("Cette modification n’a pas pu être annulée. Réessaie après vérification du stockage local.");
      refreshHistoryState();
    }
  }

  async function redoChange() {
    const change = redoHistoryRef.current.pop();
    if (!change) return;
    try {
      await applyHistoryChange(change, "after");
      undoHistoryRef.current.push(change);
      refreshHistoryState();
    } catch {
      redoHistoryRef.current.push(change);
      setMessage("Cette modification n’a pas pu être rétablie. Réessaie après vérification du stockage local.");
      refreshHistoryState();
    }
  }

  async function loadCloudDraft() {
    const userId = accountUser?.uid;
    const root = rootRef.current;
    const database = getLocalFirebaseFirestore();
    const storage = getLocalFirebaseStorage();
    if (!userId || !root || !database || !storage) return;
    setCloudBusy(true);
    try {
      const savedDraft = await getDoc(doc(database, cloudDraftPath));
      if (!savedDraft.exists()) {
        setCloudDraftAvailable(false);
        setMessage("Ce compte local n’a pas encore de brouillon pour ce modèle.");
        return;
      }
      const storedConfiguration: unknown = savedDraft.data().configuration;
      if (!isCloudConfiguration(storedConfiguration)) throw new Error("Le brouillon du compte a un format invalide.");
      const imagePrefix = `sstTenants/${userId}/projects/${sectorId}/drafts/images/`;
      const imageEntries = await Promise.all(Object.entries(storedConfiguration.images).map(async ([key, path]) => {
        if (!path.startsWith(imagePrefix) || path.includes("..")) throw new Error("Le chemin d’une image du brouillon est invalide.");
        const imageMetadata = await getMetadata(storageRef(storage, path));
        if (imageMetadata.contentType !== "image/webp") throw new Error("L’image du brouillon n’a pas encore terminé son traitement sécurisé.");
        const bytes = await getBytes(storageRef(storage, path), 8 * 1024 * 1024);
        const buffer = new Uint8Array(bytes).buffer as ArrayBuffer;
        return [key, await blobToDataUrl(new Blob([buffer], { type: imageMetadata.contentType }))] as const;
      }));
      const restored: EditorDraft = {
        ...emptyDraft(),
        images: Object.fromEntries(imageEntries),
        altTexts: storedConfiguration.altTexts,
        fields: storedConfiguration.fields,
        sectionOrder: storedConfiguration.sectionOrder,
        hiddenSections: storedConfiguration.hiddenSections,
        addedSections: storedConfiguration.addedSections,
      };
      window.localStorage.setItem(textStorageKey, JSON.stringify(storedConfiguration.text));
      window.localStorage.setItem(linkStorageKey, JSON.stringify(storedConfiguration.links));
      if (/^#[0-9a-f]{6}$/i.test(storedConfiguration.accent)) window.localStorage.setItem(accentStorageKey, storedConfiguration.accent);
      else window.localStorage.removeItem(accentStorageKey);
      root.querySelectorAll<HTMLAnchorElement>("[data-editor-link-key]").forEach((link) => {
        const destination = storedConfiguration.links[link.dataset.editorLinkKey || ""];
        if (typeof destination === "string" && isSafeDestination(destination)) {
          if (destination) link.setAttribute("href", destination);
          else link.removeAttribute("href");
        }
      });
      if (/^#[0-9a-f]{6}$/i.test(storedConfiguration.accent)) {
        applyAccent(root, storedConfiguration.accent);
        if (accentInputRef.current) accentInputRef.current.value = storedConfiguration.accent;
      }
      imageDraftRef.current = restored;
      applyTextDraft(root, textStorageKey);
      applyEditorStructure(root, restored);
      await writeImageDraft(sectorId, restored);
      setHiddenSectionKeys(restored.hiddenSections);
      setSectionLabels(getSectionLabels(root));
      setSectionRefresh((current) => current + 1);
      setCloudDraftAvailable(true);
      setMessage("Brouillon chargé depuis ce compte local.");
    } catch (error) {
      setMessage(error instanceof Error ? `Chargement impossible : ${error.message}` : "Le brouillon du compte n’a pas pu être chargé.");
    } finally {
      setCloudBusy(false);
    }
  }

  async function saveCloudDraft() {
    const userId = accountUser?.uid;
    const database = getLocalFirebaseFirestore();
    const storage = getLocalFirebaseStorage();
    if (!userId || !database || !storage) {
      setMessage("Connecte-toi à ton compte local pour sauvegarder ce brouillon.");
      return;
    }
    setCloudBusy(true);
    setMessage("Sauvegarde du brouillon et validation des images…");
    try {
      const localDraft = imageDraftRef.current;
      const imageSources = Object.entries(localDraft.images);
      if (imageSources.length > 40) throw new Error("Ce modèle contient trop d’images modifiées pour un seul brouillon.");
      const imageUploads = await Promise.all(imageSources.map(async ([key, source]) => {
        const blob = dataUrlToBlob(source);
        const objectPath = imageStoragePath(userId, sectorId, key, blob.type);
        return { key, objectPath, blob };
      }));
      const imagePaths = Object.fromEntries(imageUploads.map(({ key, objectPath }) => [key, objectPath] as const));
      const accent = window.localStorage.getItem(accentStorageKey) || "";
      const configuration: CloudEditorConfiguration = {
        text: readLocalObject(textStorageKey),
        links: readLocalObject(linkStorageKey),
        accent: /^#[0-9a-f]{6}$/i.test(accent) ? accent : "",
        images: imagePaths,
        altTexts: localDraft.altTexts,
        fields: localDraft.fields,
        sectionOrder: localDraft.sectionOrder,
        hiddenSections: localDraft.hiddenSections,
        addedSections: localDraft.addedSections,
      };
      if (new TextEncoder().encode(JSON.stringify(configuration)).byteLength > 700 * 1024) {
        throw new Error("Le texte du brouillon dépasse la taille autorisée. Réduis les textes ou le nombre de liens.");
      }

      const projectRef = doc(database, `sstTenants/${userId}/projects/${sectorId}`);
      const membershipRef = doc(database, `sstTenants/${userId}/projects/${sectorId}/memberships/${userId}`);
      const draftRef = doc(database, cloudDraftPath);
      let projectExists = false;
      let previousImages: Record<string, string> = {};
      try {
        projectExists = (await getDoc(projectRef)).exists();
        const previousDraft = await getDoc(draftRef);
        if (previousDraft.exists() && isCloudConfiguration(previousDraft.data().configuration)) {
          previousImages = previousDraft.data().configuration.images;
        }
      } catch {
        // A new owner has no project membership yet; the initial atomic batch grants it.
      }
      if (!projectExists) {
        const batch = writeBatch(database);
        batch.set(projectRef, {
          tenantId: userId, projectId: sectorId, ownerUid: userId, templateId: sectorId,
          name: templateName, status: "draft", createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        });
        batch.set(membershipRef, {
          userId, tenantId: userId, projectId: sectorId, role: "owner", status: "active",
          permissions: ["project:read", "project:edit"], createdAt: serverTimestamp(),
        });
        batch.set(draftRef, {
          tenantId: userId, projectId: sectorId, createdByUid: userId, templateId: sectorId,
          schemaVersion: 1, revision: 1, configuration, updatedAt: serverTimestamp(),
        });
        await batch.commit();
      } else {
        await runTransaction(database, async (transaction) => {
          const currentDraft = await transaction.get(draftRef);
          if (!currentDraft.exists()) {
            transaction.set(draftRef, {
              tenantId: userId, projectId: sectorId, createdByUid: userId, templateId: sectorId,
              schemaVersion: 1, revision: 1, configuration, updatedAt: serverTimestamp(),
            });
            return;
          }
          const currentData = currentDraft.data();
          transaction.update(draftRef, { configuration, revision: Number(currentData.revision) + 1, updatedAt: serverTimestamp() });
        });
      }
      const uploadResults = await Promise.allSettled(imageUploads.map(({ objectPath, blob }) =>
        uploadBytes(storageRef(storage, objectPath), blob, { contentType: blob.type })));
      const failedImageKeys = imageUploads.filter((_, index) => uploadResults[index].status === "rejected").map(({ key }) => key);
      if (failedImageKeys.length > 0) {
        await runTransaction(database, async (transaction) => {
          const currentDraft = await transaction.get(draftRef);
          if (!currentDraft.exists()) return;
          const data = currentDraft.data();
          const currentConfiguration: unknown = data.configuration;
          if (!isCloudConfiguration(currentConfiguration)) return;
          const images = { ...currentConfiguration.images };
          for (const key of failedImageKeys) {
            if (images[key] === imagePaths[key]) {
              if (previousImages[key]) images[key] = previousImages[key];
              else delete images[key];
            }
          }
          transaction.update(draftRef, {
            configuration: { ...currentConfiguration, images },
            revision: Number(data.revision) + 1,
            updatedAt: serverTimestamp(),
          });
        });
      }
      if (Object.keys(imagePaths).length > 0) {
        let processed = false;
        let rejected = false;
        for (let attempt = 0; attempt < 80; attempt += 1) {
          const currentDraft = await getDoc(draftRef);
          if (!currentDraft.exists()) break;
          const currentConfiguration: unknown = currentDraft.data().configuration;
          if (!isCloudConfiguration(currentConfiguration)) break;
          const pendingKeys = Object.entries(imagePaths).filter(([key, imagePath]) => currentConfiguration.images[key] === imagePath).map(([key]) => key);
          if (pendingKeys.length === 0) {
            rejected = failedImageKeys.length > 0 || Object.keys(imagePaths).some((key) => !currentConfiguration.images[key]);
            processed = Object.keys(imagePaths).every((key) => currentConfiguration.images[key]?.startsWith(`sstTenants/${userId}/projects/${sectorId}/drafts/images/`));
            break;
          }
          await new Promise((resolve) => window.setTimeout(resolve, 250));
        }
        setCloudDraftAvailable(true);
        if (!processed) {
          setMessage(rejected
            ? "Brouillon enregistré; une image a été refusée par le contrôle serveur et le modèle conserve son visuel initial."
            : "Brouillon enregistré; le traitement sécurisé des images continue. Attends avant de charger le brouillon.");
          return;
        }
      }
      setCloudDraftAvailable(true);
      setMessage("Brouillon enregistré dans le compte de démonstration local.");
    } catch (error) {
      setMessage(error instanceof Error ? `Sauvegarde impossible : ${error.message}` : "Le brouillon n’a pas pu être sauvegardé dans le compte local.");
    } finally {
      setCloudBusy(false);
    }
  }

  async function deleteCloudDraft() {
    const userId = accountUser?.uid;
    const database = getLocalFirebaseFirestore();
    const storage = getLocalFirebaseStorage();
    if (!userId || !database || !storage || !cloudDraftAvailable) return;
    if (!window.confirm("Supprimer le brouillon enregistré dans ce compte ainsi que ses images ? Les modifications de ce navigateur resteront disponibles.")) return;
    setCloudBusy(true);
    try {
      const draftRef = doc(database, cloudDraftPath);
      const savedDraft = await getDoc(draftRef);
      if (savedDraft.exists()) {
        const configuration: unknown = savedDraft.data().configuration;
        if (!isCloudConfiguration(configuration)) throw new Error("Le brouillon du compte a un format invalide.");
        const quarantinePrefix = `sstTenants/${userId}/projects/${sectorId}/drafts/quarantine/`;
        const imagePrefix = `sstTenants/${userId}/projects/${sectorId}/drafts/images/`;
        for (const [key, imagePath] of Object.entries(configuration.images)) {
          if (imagePath.startsWith(quarantinePrefix)) {
            await deleteObject(storageRef(storage, imagePath)).catch((error: unknown) => {
              const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
              if (!code.endsWith("/object-not-found")) throw error;
            });
          } else if (imagePath.startsWith(imagePrefix) && !imagePath.includes("..")) {
            await deleteStorageTree(storage, `${imagePrefix}${encodeURIComponent(key)}`);
          } else {
            throw new Error("Un chemin d’image du brouillon est invalide.");
          }
        }
        await deleteDoc(draftRef);
      }
      setCloudDraftAvailable(false);
      setMessage("Brouillon du compte et images supprimés. Le travail de ce navigateur reste inchangé.");
    } catch (error) {
      setMessage(error instanceof Error ? `Suppression impossible : ${error.message}` : "Le brouillon du compte n’a pas pu être supprimé.");
    } finally {
      setCloudBusy(false);
    }
  }

  async function deleteCloudProject() {
    const userId = accountUser?.uid;
    const functions = getLocalFirebaseFunctions();
    if (!userId || !functions || !cloudDraftAvailable) return;
    if (!window.confirm("Supprimer ce projet de démonstration, son appartenance et toutes ses images du compte local ? Les modifications conservées dans ce navigateur resteront disponibles.")) return;
    setCloudBusy(true);
    try {
      const cleanup = httpsCallable<{ projectId: string }, { deleted: boolean; alreadyDeleted: boolean }>(functions, "deleteDraftProject");
      await cleanup({ projectId: sectorId });
      setCloudDraftAvailable(false);
      setMessage("Projet de démonstration, appartenance et images supprimés du compte local.");
    } catch (error) {
      setMessage(error instanceof Error ? `Suppression impossible : ${error.message}` : "Le projet du compte local n’a pas pu être supprimé.");
    } finally {
      setCloudBusy(false);
    }
  }

  useEffect(() => {
    const auth = getLocalFirebaseAuth();
    if (!auth) {
      const frame = requestAnimationFrame(() => setAccountReady(true));
      return () => cancelAnimationFrame(frame);
    }
    return onAuthStateChanged(auth, (user) => {
      setAccountUser(user);
      setAccountReady(true);
      setCloudDraftAvailable(false);
    }, () => {
      setAccountUser(null);
      setAccountReady(true);
      setCloudDraftAvailable(false);
    });
  }, []);

  useEffect(() => {
    if (!ready || !accountUser) return;
    let active = true;
    const database = getLocalFirebaseFirestore();
    if (!database) return;
    void getDoc(doc(database, cloudDraftPath)).then((savedDraft) => {
      if (active) setCloudDraftAvailable(savedDraft.exists());
    }).catch(() => {
      if (active) setCloudDraftAvailable(false);
    });
    return () => { active = false; };
  }, [accountUser, cloudDraftPath, ready]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    decorateEditableContent(root);

    const textElements = Array.from(root.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6,p,li,blockquote,button,a,b,strong,em,small,span,label,dt,dd"))
      .filter((element) => Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim())));
    textElements.forEach((element, index) => { element.dataset.editorTextKey = String(index); });

    const imageElements = Array.from(root.querySelectorAll<HTMLElement>(".mock-site *"))
      .filter((element) => element instanceof HTMLImageElement
        || element.getAttribute("role") === "img"
        || element.matches("header a:first-child")
        || getComputedStyle(element).backgroundImage.includes("url("));
    imageElements.forEach((element, index) => {
      element.dataset.editorImageKey = String(index);
      if (element.matches(".mock-site header a:first-child")) element.dataset.editorLogo = "true";
      if (!originalImagesRef.current.has(String(index))) {
        originalImagesRef.current.set(String(index), {
          src: element instanceof HTMLImageElement ? element.getAttribute("src") : null,
          backgroundImage: element.style.backgroundImage,
          backgroundPosition: element.style.backgroundPosition,
          backgroundSize: element.style.backgroundSize,
          logoChildren: element.dataset.editorLogo === "true" ? Array.from(element.childNodes).map((node) => node.cloneNode(true)) : [],
        });
      }
    });

    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>(".mock-site a"));
    links.forEach((element, index) => { element.dataset.editorLinkKey = String(index); });
    const fields = Array.from(root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(".mock-site input:not([type=button]):not([type=submit]):not([type=reset]):not([type=file]):not([type=color]):not([type=checkbox]):not([type=radio]), .mock-site textarea"));
    fields.forEach((element, index) => { element.dataset.editorFieldKey = String(index); });
    setEditableFields(fields.map((element, index) => {
      const associatedLabel = element.id ? root.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(element.id)}"]`)?.textContent?.trim() : "";
      return { key: String(index), label: associatedLabel || element.placeholder || `Champ ${index + 1}` };
    }));
    const site = root.querySelector<HTMLElement>(".mock-site");
    Array.from(site?.children ?? []).forEach((element, index) => { (element as HTMLElement).dataset.editorSectionKey = `section-${index}`; });
    applyTextDraft(root, textStorageKey);
    try {
      const savedAccent = window.localStorage.getItem(accentStorageKey);
      if (savedAccent && /^#[0-9a-f]{6}$/i.test(savedAccent)) {
        applyAccent(root, savedAccent);
        if (accentInputRef.current) accentInputRef.current.value = savedAccent;
      }
    } catch {
      // Keep the template's default accent when local storage is unavailable.
    }
    try {
      const savedLinks: unknown = JSON.parse(window.localStorage.getItem(linkStorageKey) || "{}");
      if (savedLinks && typeof savedLinks === "object" && !Array.isArray(savedLinks)) {
        for (const link of links) {
          const value = (savedLinks as Record<string, unknown>)[link.dataset.editorLinkKey || ""];
          if (typeof value === "string" && isSafeDestination(value)) {
            if (value) link.setAttribute("href", value);
            else link.removeAttribute("href");
          }
        }
      }
    } catch {
      // Keep the starter links visible when a local draft cannot be parsed.
    }

    let active = true;
    void readImageDraft(sectorId).then((draft) => {
      if (!active) return;
      imageDraftRef.current = draft;
      draft.addedSections.forEach((section) => addSectionElement(root, section));
      applyTextDraft(root, textStorageKey);
      applyEditorStructure(root, draft);
      setHiddenSectionKeys(draft.hiddenSections);
      setSectionLabels(getSectionLabels(root));
      setSectionRefresh((current) => current + 1);
    }).catch(() => {
      if (active) setMessage("Les images enregistrées n’ont pas pu être chargées.");
    }).finally(() => {
      if (active) setReady(true);
    });
    return () => { active = false; };
  }, [accentStorageKey, linkStorageKey, sectorId, textStorageKey]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    decorateEditableContent(root);
    root.dataset.editorSelectedSection = selectedSectionKey || "";
    if (ready) applyEditorStructure(root, imageDraftRef.current);
    if (editing && accentInputRef.current) {
      const savedAccent = window.localStorage.getItem(accentStorageKey);
      const defaultAccent = root.querySelector<HTMLElement>(".mock-site")?.style.getPropertyValue("--mock-accent").trim();
      const selectedAccent = savedAccent && /^#[0-9a-f]{6}$/i.test(savedAccent) ? savedAccent : defaultAccent;
      if (selectedAccent && /^#[0-9a-f]{6}$/i.test(selectedAccent)) accentInputRef.current.value = selectedAccent;
    }
    root.querySelectorAll<HTMLElement>("[data-editor-text-key]").forEach((element) => {
      element.contentEditable = editing ? "true" : "false";
      element.classList.toggle("direct-editor-text-target", editing);
      element.spellcheck = editing;
    });
    root.querySelectorAll<HTMLElement>("[data-editor-image-key]").forEach((element) => {
      element.classList.toggle("direct-editor-image-target", editing);
      element.tabIndex = editing ? 0 : -1;
    });
    root.querySelectorAll<HTMLElement>("[data-editor-field-key]").forEach((element) => {
      element.classList.toggle("direct-editor-field-target", editing);
    });
    root.querySelectorAll<HTMLElement>("[data-editor-text-key]").forEach((element) => {
      element.contentEditable = editing ? "true" : "false";
      element.classList.toggle("direct-editor-text-target", editing);
    });
    root.querySelectorAll<HTMLElement>("[data-editor-section-key]").forEach((element) => {
      element.classList.toggle("direct-editor-section-target", editing);
      element.classList.toggle("is-selected", element.dataset.editorSectionKey === selectedSectionKey);
    });
  }, [accentStorageKey, children, editing, historyState, ready, restoreSectionKey, selectedSectionKey, sectionRefresh]);

  function saveText(event: FormEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.dataset.editorTextKey) return;
    const key = target.dataset.editorTextKey;
    const before = textBeforeRef.current[key];
    const after = target.textContent || "";
    if (before !== undefined && before !== after) {
      pushHistory({ kind: "text", key, before, after });
      textBeforeRef.current[key] = after;
    }
    const values: Record<string, string> = {};
    rootRef.current?.querySelectorAll<HTMLElement>("[data-editor-text-key]").forEach((element) => {
      const key = element.dataset.editorTextKey;
      if (key) values[key] = element.textContent || "";
    });
    try {
      window.localStorage.setItem(textStorageKey, JSON.stringify(values));
      if (rootRef.current) setSectionLabels(getSectionLabels(rootRef.current));
      setMessage("Texte enregistré dans ce navigateur.");
    } catch {
      setMessage("Le stockage local est plein; réduis la taille du texte.");
    }
  }

  function openImagePicker(event: MouseEvent<HTMLDivElement>) {
    if (!editing) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target instanceof HTMLElement && target.dataset.editorTextKey) textBeforeRef.current[target.dataset.editorTextKey] = target.textContent || "";
    const section = target.closest<HTMLElement>("[data-editor-section-key]");
    if (section) setSelectedSectionKey(section.dataset.editorSectionKey || null);
    const imageTarget = target.closest<HTMLElement>("[data-editor-image-key]");
    if (imageTarget && rootRef.current?.contains(imageTarget)) {
      event.preventDefault();
      if (selectedFieldKey !== null) {
        commitSelectedField();
        setSelectedFieldKey(null);
      }
      if (selectedLinkKey !== null) {
        commitSelectedLinkEdit();
        setSelectedLinkKey(null);
      }
      const key = imageTarget.dataset.editorImageKey || "";
      const currentAlt = getImageAlternative(imageTarget);
      setSelectedImageKey(key);
      setSelectedImageAlt(currentAlt);
      altBeforeRef.current[key] = currentAlt;
      if (uploadRef.current) {
        uploadRef.current.dataset.targetKey = key;
        uploadRef.current.click();
      }
      return;
    }
    const fieldTarget = target.closest<HTMLInputElement | HTMLTextAreaElement>("[data-editor-field-key]");
    if (fieldTarget && rootRef.current?.contains(fieldTarget)) {
      event.preventDefault();
      const key = fieldTarget.dataset.editorFieldKey || "";
      const value = readFieldValue(fieldTarget);
      fieldBeforeRef.current[key] = value;
      setSelectedFieldKey(key);
      setSelectedFieldValue(value);
      return;
    }
    const link = target.closest("a");
    if (link && rootRef.current?.contains(link)) {
      event.preventDefault();
      const key = (link as HTMLElement).dataset.editorLinkKey;
      if (key !== undefined) {
        linkBeforeRef.current[key] = (link as HTMLAnchorElement).getAttribute("href") || "";
        setSelectedLinkKey(key);
        setSelectedLinkHref((link as HTMLAnchorElement).getAttribute("href") || "");
      }
    }
  }

  function updateSelectedImageAlt(value: string) {
    if (selectedImageKey === null || !rootRef.current) return;
    const before = altBeforeRef.current[selectedImageKey];
    if (before !== undefined && before !== value) {
      pushHistory({ kind: "alt", key: selectedImageKey, before, after: value });
      altBeforeRef.current[selectedImageKey] = value;
    }
    setSelectedImageAlt(value);
    applyImageAlternative(rootRef.current, selectedImageKey, value);
    const draft = { ...imageDraftRef.current, altTexts: { ...imageDraftRef.current.altTexts, [selectedImageKey]: value } };
    imageDraftRef.current = draft;
    void writeImageDraft(sectorId, draft)
      .then(() => setMessage("Texte alternatif enregistré dans ce navigateur."))
      .catch(() => setMessage("Le texte alternatif est appliqué, mais le stockage local a échoué."));
  }

  function updateSelectedFieldValue(partial: Partial<FieldValue>) {
    if (selectedFieldKey === null || !rootRef.current) return;
    const value = { ...selectedFieldValue, ...partial };
    const before = fieldBeforeRef.current[selectedFieldKey];
    if (before && (before.placeholder !== value.placeholder || before.value !== value.value)) {
      pushHistory({ kind: "field", key: selectedFieldKey, before, after: value });
      fieldBeforeRef.current[selectedFieldKey] = value;
    }
    setSelectedFieldValue(value);
    applyFieldValue(rootRef.current, selectedFieldKey, value);
    const draft = { ...imageDraftRef.current, fields: { ...imageDraftRef.current.fields, [selectedFieldKey]: value } };
    imageDraftRef.current = draft;
    void writeImageDraft(sectorId, draft)
      .then(() => setMessage("Champ enregistré dans ce navigateur."))
      .catch(() => setMessage("Le champ est appliqué, mais le stockage local a échoué."));
  }

  function selectEditorField(key: string) {
    const field = Array.from(rootRef.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-editor-field-key]") || [])
      .find((element) => element.dataset.editorFieldKey === key);
    if (!field) return;
    const value = readFieldValue(field);
    fieldBeforeRef.current[key] = value;
    setSelectedFieldKey(key);
    setSelectedFieldValue(value);
  }

  function updateSelectedLink(value: string) {
    setSelectedLinkHref(value);
    if (selectedLinkKey === null || !isSafeDestination(value)) {
      if (value && !isSafeDestination(value)) setMessage("Utilise un lien relatif, https://, mailto: ou tel:.");
      return;
    }
    const link = Array.from(rootRef.current?.querySelectorAll<HTMLAnchorElement>("[data-editor-link-key]") || [])
      .find((element) => element.dataset.editorLinkKey === selectedLinkKey);
    if (!link) return;
    if (value.trim()) link.setAttribute("href", value.trim());
    else link.removeAttribute("href");
    const values: Record<string, string> = {};
    rootRef.current?.querySelectorAll<HTMLAnchorElement>("[data-editor-link-key]").forEach((element) => {
      if (element.dataset.editorLinkKey !== undefined) values[element.dataset.editorLinkKey] = element.getAttribute("href") || "";
    });
    try {
      window.localStorage.setItem(linkStorageKey, JSON.stringify(values));
      setMessage("Lien enregistré dans ce navigateur.");
    } catch {
      setMessage("Le lien est appliqué, mais le stockage local a échoué.");
    }
  }

  function updateAccent(event: ChangeEvent<HTMLInputElement>) {
    const color = event.currentTarget.value;
    if (!/^#[0-9a-f]{6}$/i.test(color) || !rootRef.current) return;
    applyAccent(rootRef.current, color);
    try {
      window.localStorage.setItem(accentStorageKey, color);
      setMessage("Couleur enregistrée dans ce navigateur.");
    } catch {
      setMessage("La couleur est appliquée, mais le stockage local a échoué.");
    }
  }

  async function saveStructure(before?: StructureSnapshot) {
    const root = rootRef.current;
    const site = root?.querySelector<HTMLElement>(".mock-site");
    if (!root || !site) return;
    const draft: EditorDraft = {
      ...imageDraftRef.current,
      sectionOrder: Array.from(site.children).map((element) => (element as HTMLElement).dataset.editorSectionKey).filter((key): key is string => Boolean(key)),
      hiddenSections: Array.from(root.querySelectorAll<HTMLElement>("[data-editor-section-key]"))
        .filter((element) => element.hidden)
        .map((element) => element.dataset.editorSectionKey)
        .filter((key): key is string => Boolean(key)),
      addedSections: Array.from(root.querySelectorAll<HTMLElement>("[data-editor-added-section]"))
        .map((element) => ({
          id: element.dataset.editorAddedSection || "",
          title: element.querySelector("h2")?.textContent || "",
          body: element.querySelector("p")?.textContent || "",
        }))
        .filter((section) => Boolean(section.id)),
    };
    try {
      await writeImageDraft(sectorId, draft);
      imageDraftRef.current = draft;
      if (before) {
        pushHistory({
          kind: "structure",
          before,
          after: {
            sectionOrder: draft.sectionOrder,
            hiddenSections: draft.hiddenSections,
            addedSections: draft.addedSections,
          },
        });
      }
      setHiddenSectionKeys(draft.hiddenSections);
      setSectionLabels(getSectionLabels(root));
      setMessage("Structure enregistrée dans ce navigateur.");
    } catch {
      setMessage("La structure a été modifiée, mais le stockage local a échoué.");
    }
  }

  async function addSection() {
    const root = rootRef.current;
    if (!root) return;
    const before = captureStructure(root);
    const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}`;
    addSectionElement(root, { id, title: "Titre de la nouvelle section", body: "Clique ici pour ajouter ton contenu." });
    setSelectedSectionKey(`added-${id}`);
    await saveStructure(before);
    setSectionRefresh((current) => current + 1);
  }

  async function moveSelectedSection(direction: -1 | 1) {
    const root = rootRef.current;
    const site = root?.querySelector<HTMLElement>(".mock-site");
    if (!root || !site || selectedSectionKey === null) return;
    const before = captureStructure(root);
    const sections = Array.from(site.children) as HTMLElement[];
    const index = sections.findIndex((element) => element.dataset.editorSectionKey === selectedSectionKey);
    const next = sections[index + direction];
    const current = sections[index];
    if (!current || !next) return;
    site.insertBefore(direction < 0 ? current : next, direction < 0 ? next : current);
    await saveStructure(before);
    setSectionRefresh((value) => value + 1);
  }

  async function hideSelectedSection() {
    const root = rootRef.current;
    if (!root) return;
    const before = captureStructure(root);
    const element = Array.from(rootRef.current?.querySelectorAll<HTMLElement>("[data-editor-section-key]") || [])
      .find((candidate) => candidate.dataset.editorSectionKey === selectedSectionKey);
    if (!element) return;
    element.hidden = true;
    await saveStructure(before);
    setSelectedSectionKey(null);
  }

  async function deleteSelectedAddedSection() {
    const root = rootRef.current;
    if (!root || !selectedSectionKey?.startsWith("added-")) return;
    const before = captureStructure(root);
    const element = Array.from(root.querySelectorAll<HTMLElement>("[data-editor-added-section]"))
      .find((candidate) => candidate.dataset.editorSectionKey === selectedSectionKey);
    if (!element) return;
    element.remove();
    await saveStructure(before);
    setSelectedSectionKey(null);
    setSectionRefresh((current) => current + 1);
  }

  async function restoreHiddenSection() {
    const root = rootRef.current;
    if (!root) return;
    const before = captureStructure(root);
    const element = Array.from(rootRef.current?.querySelectorAll<HTMLElement>("[data-editor-section-key]") || [])
      .find((candidate) => candidate.dataset.editorSectionKey === restoreSectionKey);
    if (!element) return;
    element.hidden = false;
    await saveStructure(before);
    setRestoreSectionKey("");
    setSectionRefresh((current) => current + 1);
  }

  async function replaceImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    const key = event.currentTarget.dataset.targetKey;
    event.currentTarget.value = "";
    if (!file || !key || !rootRef.current) return;
    if (!originalImagesRef.current.has(key)) {
      const target = Array.from(rootRef.current.querySelectorAll<HTMLElement>("[data-editor-image-key]"))
        .find((element) => element.dataset.editorImageKey === key);
      if (target) originalImagesRef.current.set(key, {
        src: target instanceof HTMLImageElement ? target.getAttribute("src") : null,
        backgroundImage: target.style.backgroundImage,
        backgroundPosition: target.style.backgroundPosition,
        backgroundSize: target.style.backgroundSize,
        logoChildren: target.dataset.editorLogo === "true" ? Array.from(target.childNodes).map((node) => node.cloneNode(true)) : [],
      });
    }
    const before = imageDraftRef.current.images[key] || null;
    if (!["image/png", "image/jpeg", "image/webp", "image/avif"].includes(file.type)) {
      setMessage("Choisis une image PNG, JPEG, WebP ou AVIF.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setMessage("Cette image dépasse la limite de 8 Mo.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setMessage("Cette image n’a pas pu être lue.");
    reader.onload = async () => {
      if (typeof reader.result !== "string" || !rootRef.current) return;
      const draft = { ...imageDraftRef.current, images: { ...imageDraftRef.current.images, [key]: reader.result } };
      applyImage(rootRef.current, key, reader.result);
      imageDraftRef.current = draft;
      pushHistory({ kind: "image", key, before, after: reader.result });
      try {
        await writeImageDraft(sectorId, draft);
        setMessage("Image enregistrée dans ce navigateur.");
      } catch {
        setMessage("Image appliquée à l’aperçu, mais le stockage local a échoué.");
      }
    };
    reader.readAsDataURL(file);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && editing) setEditing(false);
    if (editing && (event.key === "Enter" || event.key === " ") && event.target instanceof HTMLElement && event.target.dataset.editorImageKey !== undefined) {
      event.preventDefault();
      event.target.click();
    }
  }

  async function resetDraft() {
    try {
      window.localStorage.removeItem(textStorageKey);
      window.localStorage.removeItem(linkStorageKey);
      window.localStorage.removeItem(accentStorageKey);
      await writeImageDraft(sectorId, null);
      window.location.reload();
    } catch {
      setMessage("Le brouillon n’a pas pu être entièrement supprimé.");
    }
  }

  return <section className="direct-template-editor" aria-label="Édition directe du modèle">
    <div className="direct-editor-toolbar">
      <div><strong>{editing ? "Modifiez le modèle directement" : "Votre modèle, prêt à être édité"}</strong><span>{editing ? "Cliquez sur un texte pour le réécrire, une image ou un logo pour le remplacer, ou une section pour la déplacer et la réorganiser." : message}</span></div>
      <button type="button" className="sector-action" onClick={() => setEditing((current) => !current)}>{editing ? "Terminer" : "Éditer le modèle"}</button>
      {accountReady && accountUser ? <><button type="button" className="sector-back" disabled={cloudBusy} onClick={() => void saveCloudDraft()}>{cloudBusy ? "Sauvegarde…" : "Enregistrer dans mon compte"}</button>{cloudDraftAvailable && <><button type="button" className="sector-back" disabled={cloudBusy} onClick={() => void loadCloudDraft()}>Charger mon brouillon</button><button type="button" className="sector-back direct-editor-cloud-delete" disabled={cloudBusy} onClick={() => void deleteCloudDraft()}>Supprimer le brouillon du compte</button><button type="button" className="sector-back direct-editor-cloud-project-delete" disabled={cloudBusy} onClick={() => void deleteCloudProject()}>Supprimer le projet et toutes ses données</button></>}</> : accountReady && <Link className="sector-back direct-editor-account-link" href={`/account?returnTo=${encodeURIComponent(`/templates/${sectorId}`)}`}>Connecter mon compte pour sauvegarder</Link>}
      {editing && <><button type="button" className="sector-back" disabled={!historyState.canUndo} onClick={() => void undoChange()}>Annuler</button><button type="button" className="sector-back" disabled={!historyState.canRedo} onClick={() => void redoChange()}>Rétablir</button></>}
      {editing && <label className="direct-editor-accent-control" htmlFor={`direct-accent-${sectorId}`}>Couleur principale<input ref={accentInputRef} id={`direct-accent-${sectorId}`} type="color" defaultValue="#0754aa" onFocus={beginAccentEdit} onBlur={commitAccentEdit} onChange={updateAccent} /></label>}
      {editing && editableFields.length > 0 && <label className="direct-editor-field-picker" htmlFor={`direct-field-${sectorId}`}>Champ à modifier<select id={`direct-field-${sectorId}`} value={selectedFieldKey || ""} onChange={(event) => { commitSelectedField(); selectEditorField(event.currentTarget.value); }}><option value="">Choisir un champ</option>{editableFields.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}</select></label>}
      {ready && <button type="button" className="sector-back direct-editor-reset" onClick={() => void resetDraft()}>Réinitialiser</button>}
    </div>
    {editing && selectedLinkKey !== null && <div className="direct-editor-link-panel"><label htmlFor={`direct-link-${sectorId}`}>Destination du lien sélectionné</label><input id={`direct-link-${sectorId}`} value={selectedLinkHref} onBlur={commitSelectedLinkEdit} onChange={(event) => updateSelectedLink(event.currentTarget.value)} placeholder="#contact, https://…, mailto:… ou tel:…" /><button type="button" className="sector-back" onClick={() => { commitSelectedLinkEdit(); setSelectedLinkKey(null); }}>Fermer</button></div>}
    {editing && selectedImageKey !== null && <div className="direct-editor-link-panel"><label htmlFor={`direct-image-alt-${sectorId}`}>Texte alternatif de l’image sélectionnée</label><input id={`direct-image-alt-${sectorId}`} value={selectedImageAlt} onBlur={commitSelectedImageAlt} onChange={(event) => updateSelectedImageAlt(event.currentTarget.value)} placeholder="Décris brièvement l’image" /><button type="button" className="sector-back" onClick={() => { commitSelectedImageAlt(); setSelectedImageKey(null); }}>Fermer</button></div>}
    {editing && selectedFieldKey !== null && <div className="direct-editor-link-panel" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) commitSelectedField(); }}><label htmlFor={`direct-field-placeholder-${sectorId}`}>Texte indicatif du champ</label><input id={`direct-field-placeholder-${sectorId}`} value={selectedFieldValue.placeholder} onChange={(event) => updateSelectedFieldValue({ placeholder: event.currentTarget.value })} placeholder="Ex. Adresse e-mail" /><label htmlFor={`direct-field-value-${sectorId}`}>Valeur initiale</label><input id={`direct-field-value-${sectorId}`} value={selectedFieldValue.value} onChange={(event) => updateSelectedFieldValue({ value: event.currentTarget.value })} placeholder="Laisser vide si nécessaire" /><button type="button" className="sector-back" onClick={() => { commitSelectedField(); setSelectedFieldKey(null); }}>Fermer</button></div>}
    {editing && <div className="direct-editor-section-panel">
      <button type="button" className="sector-action" onClick={() => void addSection()}>Ajouter une section</button>
      {selectedSectionKey !== null && <><span>Section sélectionnée : {sectionLabels[selectedSectionKey] || selectedSectionKey}</span><button type="button" className="sector-back" onClick={() => void moveSelectedSection(-1)}>Monter</button><button type="button" className="sector-back" onClick={() => void moveSelectedSection(1)}>Descendre</button>{selectedSectionKey.startsWith("added-") ? <button type="button" className="sector-back" onClick={() => void deleteSelectedAddedSection()}>Supprimer cette section</button> : <button type="button" className="sector-back" onClick={() => void hideSelectedSection()}>Masquer la section</button>}</>}
      {hiddenSectionKeys.length > 0 && <><label htmlFor={`restore-section-${sectorId}`}>Sections masquées</label><select id={`restore-section-${sectorId}`} value={restoreSectionKey} onChange={(event) => setRestoreSectionKey(event.currentTarget.value)}><option value="">Choisir une section</option>{hiddenSectionKeys.map((key) => <option key={key} value={key}>{sectionLabels[key] || key}</option>)}</select><button type="button" className="sector-back" disabled={!restoreSectionKey} onClick={() => void restoreHiddenSection()}>Réafficher</button></>}
    </div>}
    <input ref={uploadRef} className="direct-editor-upload" type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={(event) => void replaceImage(event)} aria-label="Choisir une image de remplacement" />
    <div ref={rootRef} className={editing ? "direct-editor-canvas is-editing" : "direct-editor-canvas"} onInput={saveText} onFocusCapture={beginTextEdit} onBeforeInputCapture={beginTextEdit} onBlurCapture={commitTextEdit} onClick={openImagePicker} onKeyDown={handleKeyDown}>
      {children}
    </div>
    <p className="direct-editor-status" role="status" aria-live="polite">{message}</p>
  </section>;
}

function isSafeDestination(value: string) {
  const trimmed = value.trim();
  return trimmed.length === 0
    || trimmed.startsWith("#")
    || (trimmed.startsWith("/") && !trimmed.startsWith("//"))
    || /^(https:\/\/|mailto:|tel:)/i.test(trimmed);
}
