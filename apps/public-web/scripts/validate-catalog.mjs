import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const families = new Set(["Inscription en ligne", "E-commerce", "Réservation en ligne", "Mini-boutique", "Site vitrine métier"]);
const approvedFamilies = new Set(["Inscription en ligne", "E-commerce"]);
const engines = new Set(["forms", "registration", "commerce", "reservation", "restaurant", "content", "support"]);
const templateIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const catalogSchema = JSON.parse(readFileSync(new URL("../content/catalog-schema.json", import.meta.url), "utf8"));

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function checkKnownKeys(value, allowedKeys, label, errors) {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) errors.push(`${label}: unsupported property ${key}.`);
  }
}

function checkLocalAsset(value, label, templateId, extensions, expectedPrefix, publicRoot, errors) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("?") || value.includes("#") || value.includes("%") || value.split("/").includes("..")) {
    errors.push(`${templateId}: ${label} must be a safe local public path without traversal or encoding.`);
    return undefined;
  }
  if (!value.startsWith(expectedPrefix)) {
    errors.push(`${templateId}: ${label} is outside its template media directory.`);
    return undefined;
  }
  const assetPath = resolve(publicRoot, `.${value}`);
  if (!assetPath.startsWith(`${resolve(publicRoot)}${sep}`) || !existsSync(assetPath)) {
    errors.push(`${templateId}: ${label} does not resolve to an existing public asset.`);
    return undefined;
  }
  let realPublicRoot;
  let realAssetPath;
  try {
    realPublicRoot = realpathSync(publicRoot);
    realAssetPath = realpathSync(assetPath);
  } catch {
    errors.push(`${templateId}: ${label} does not resolve to an existing public asset.`);
    return undefined;
  }
  const realRelativePath = relative(realPublicRoot, realAssetPath);
  if (realRelativePath === ".." || realRelativePath.startsWith(`..${sep}`) || isAbsolute(realRelativePath)) {
    errors.push(`${templateId}: ${label} resolves outside the public asset directory.`);
    return undefined;
  }
  let assetStats;
  try {
    assetStats = statSync(realAssetPath);
  } catch {
    errors.push(`${templateId}: ${label} does not resolve to an existing public asset.`);
    return undefined;
  }
  if (!assetStats.isFile() || assetStats.size === 0) {
    errors.push(`${templateId}: ${label} must resolve to a non-empty file.`);
    return undefined;
  }
  if (!extensions.includes(extname(realAssetPath).toLowerCase())) {
    errors.push(`${templateId}: unsupported ${label} file extension.`);
    return undefined;
  }
  return realAssetPath;
}

function hasWebVttCue(content) {
  const normalizedContent = content.replace(/^\uFEFF/, "");
  if (normalizedContent.includes("\uFFFD")) return false;
  const [header, ...lines] = normalizedContent.split(/\r?\n/);
  if (!/^WEBVTT(?:[ \t].*)?$/.test(header ?? "")) return false;
  if (lines[0] !== "") return false;
  const timingPattern = /^((?:\d{2,}:)?\d{2}:\d{2}\.\d{3})[ \t]+-->[ \t]+((?:\d{2,}:)?\d{2}:\d{2}\.\d{3})(?:[ \t].*)?$/;
  const parseTimestamp = (value) => {
    const match = /^(?:(\d{2,}):)?(\d{2}):(\d{2})\.(\d{3})$/.exec(value);
    if (!match) return undefined;
    const hours = Number(match[1] ?? 0);
    const minutes = Number(match[2]);
    const seconds = Number(match[3]);
    const milliseconds = Number(match[4]);
    if (!Number.isSafeInteger(hours) || minutes > 59 || seconds > 59) return undefined;
    const timestamp = ((hours * 60 + minutes) * 60 + seconds) * 1000 + milliseconds;
    return Number.isSafeInteger(timestamp) ? timestamp : undefined;
  };

  let hasCue = false;
  let previousCueStart = -1;
  for (let index = 0; index < lines.length; index += 1) {
    if (!/^\d{2,}:\d{2}(?::\d{2})?(?:[.,]\d{3})?[ \t]+-->/.test(lines[index])) continue;
    const match = timingPattern.exec(lines[index]);
    if (!match) return false;
    const start = parseTimestamp(match[1]);
    const end = parseTimestamp(match[2]);
    if (start === undefined || end === undefined || end <= start || start < previousCueStart || !lines[index + 1]?.trim()) return false;
    previousCueStart = start;
    hasCue = true;
  }
  return hasCue;
}

export function validateCatalog(entries, { projectRoot, publicRoot, environment = process.env.VERCEL_ENV } = {}) {
  const errors = [];
  if (!Array.isArray(entries)) return ["Catalog root must be an array."];
  if (environment === "production" && !entries.some((entry) => isRecord(entry) && entry.status === "published")) {
    errors.push("Production catalog must contain at least one published demo.");
  }
  const ids = new Set();

  for (const [index, entry] of entries.entries()) {
    const label = `entry ${index + 1}`;
    if (!isRecord(entry)) {
      errors.push(`${label}: expected an object.`);
      continue;
    }
    checkKnownKeys(entry, catalogSchema.entryKeys, label, errors);

    const id = entry.templateId;
    if (typeof id !== "string" || !templateIdPattern.test(id)) errors.push(`${label}: invalid stable templateId.`);
    if (ids.has(id)) errors.push(`${label}: duplicate templateId ${id}.`);
    ids.add(id);
    if (typeof entry.version !== "string" || !/^\d+\.\d+\.\d+$/.test(entry.version)) errors.push(`${label}: version must use semantic versioning.`);
    if (!families.has(entry.family)) errors.push(`${label}: unknown product family.`);
    if (!isRecord(entry.sector) || typeof entry.sector.id !== "string" || !templateIdPattern.test(entry.sector.id) || typeof entry.sector.label !== "string" || typeof entry.sector.approved !== "boolean") errors.push(`${label}: sector metadata is invalid.`);
    else checkKnownKeys(entry.sector, catalogSchema.sectorKeys, `${label} sector`, errors);
    if (entry.demo !== undefined) {
      if (!isRecord(entry.demo)) errors.push(`${label}: demo must be an object when present.`);
      else {
        checkKnownKeys(entry.demo, catalogSchema.demoKeys, `${label} demo`, errors);
        if (isRecord(entry.demo.rights)) checkKnownKeys(entry.demo.rights, catalogSchema.mediaRightsKeys, `${label} media rights`, errors);
      }
    }
    if (!Array.isArray(entry.engines) || entry.engines.length === 0 || entry.engines.some((engine) => !engines.has(engine)) || new Set(entry.engines).size !== entry.engines.length) errors.push(`${label}: a unique list of known business engines is required.`);
    for (const field of ["title", "description"]) if (typeof entry[field] !== "string" || !entry[field].trim()) errors.push(`${label}: ${field} is required.`);
    if (!["draft", "published", "archived"].includes(entry.status)) errors.push(`${label}: invalid catalog status.`);
    if (!["draft", "built", "validated", "deployed"].includes(entry.technicalStatus)) errors.push(`${label}: invalid technical status.`);
    if (typeof entry.previewRoute !== "string" || entry.previewRoute !== `/demo/${id}`) errors.push(`${label}: previewRoute must be /demo/{templateId}.`);
    if (entry.offerId !== undefined && (typeof entry.offerId !== "string" || !entry.offerId.trim())) errors.push(`${label}: offerId must be a non-empty string when present.`);

    if (entry.status !== "published") continue;
    if (typeof entry.publishedAt !== "string" || Number.isNaN(Date.parse(entry.publishedAt)) || new Date(entry.publishedAt).toISOString() !== entry.publishedAt) errors.push(`${label}: publishedAt must be a valid ISO timestamp.`);
    if (!approvedFamilies.has(entry.family)) errors.push(`${label}: an unapproved product family cannot be published.`);
    if (!entry.sector?.approved) errors.push(`${label}: an unapproved sector cannot be published.`);
    if (entry.technicalStatus !== "deployed") errors.push(`${label}: a published entry must have a deployed template.`);
    if (!entry.demo || typeof entry.demo !== "object" || Array.isArray(entry.demo)) {
      errors.push(`${label}: a published entry needs a real video and poster.`);
      continue;
    }
    if (typeof entry.demo.alt !== "string" || !entry.demo.alt.trim()) errors.push(`${label}: demo alt text is required.`);
    checkLocalAsset(entry.demo.videoSrc, "demo video", id, [".mp4"], `/media/template-videos/${id}/`, publicRoot, errors);
    checkLocalAsset(entry.demo.posterSrc, "demo poster", id, [".webp"], `/media/template-posters/${id}/`, publicRoot, errors);
    if (entry.demo.captionsSrc !== undefined) {
      const captionsPath = checkLocalAsset(entry.demo.captionsSrc, "captions", id, [".vtt"], `/media/template-captions/${id}/`, publicRoot, errors);
      if (captionsPath && !hasWebVttCue(readFileSync(captionsPath, "utf8"))) {
        errors.push(`${label}: captions must contain a WEBVTT header and at least one timestamped cue with text.`);
      }
    }

    const rights = entry.demo.rights;
    const validRightsPath = typeof rights?.evidencePath === "string"
      && /^docs\/licenses\/[A-Za-z0-9._/-]+\.md$/.test(rights.evidencePath)
      && !rights.evidencePath.split("/").includes("..");
    if (!rights || typeof rights.owner !== "string" || !rights.owner.trim() || !["none", "original", "licensed"].includes(rights.audio) || !validRightsPath) {
      errors.push(`${label}: media owner, audio rights and evidence path are required.`);
    } else {
      const evidencePath = resolve(projectRoot, rights.evidencePath);
      try {
        const realProjectRoot = realpathSync(projectRoot);
        const realEvidencePath = realpathSync(evidencePath);
        const relativeEvidencePath = relative(realProjectRoot, realEvidencePath);
        if (relativeEvidencePath === ".." || relativeEvidencePath.startsWith(`..${sep}`) || isAbsolute(relativeEvidencePath)) {
          errors.push(`${label}: media rights evidence resolves outside the project directory.`);
        } else if (!readFileSync(realEvidencePath, "utf8").trim()) {
          errors.push(`${label}: media rights evidence must not be empty.`);
        }
      } catch {
        errors.push(`${label}: media rights evidence file is missing.`);
      }
    }
  }

  return errors;
}

function run() {
  const scriptPath = fileURLToPath(import.meta.url);
  const projectRoot = resolve(scriptPath, "..", "..");
  const publicRoot = resolve(projectRoot, "public");
  let entries;
  try {
    entries = JSON.parse(readFileSync(resolve(projectRoot, "content/catalog.json"), "utf8"));
  } catch (error) {
    console.error(`Cannot read content/catalog.json: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const errors = validateCatalog(entries, { projectRoot, publicRoot });
  if (errors.length) {
    console.error(`Catalog validation failed (${errors.length} issue${errors.length === 1 ? "" : "s"}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Catalog valid: ${entries.length} entr${entries.length === 1 ? "y" : "ies"}.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run();
