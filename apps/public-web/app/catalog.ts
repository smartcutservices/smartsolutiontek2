import rawCatalog from "../content/catalog.json";
import catalogSchema from "../content/catalog-schema.json";
import { excludeDuplicateTemplateIds } from "./catalog-runtime.mjs";
import { approvedCatalogFamilies, businessEngines, catalogFamilies, type TemplateCatalogEntry } from "./catalog-types";

const templateIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const audioRights = ["none", "original", "licensed"] as const;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: UnknownRecord, allowedKeys: string[]): boolean {
  return Object.keys(value).every((key) => allowedKeys.includes(key));
}

function isLocalTemplateMedia(value: unknown, directory: string, templateId: string, extensions: string[]): value is string {
  return typeof value === "string"
    && value.startsWith(`${directory}/${templateId}/`)
    && !value.includes("\\")
    && !value.includes("?")
    && !value.includes("#")
    && !value.includes("%")
    && !value.split("/").includes("..")
    && extensions.includes(value.slice(value.lastIndexOf(".")).toLowerCase());
}

function isPublishedDemo(value: unknown): value is TemplateCatalogEntry {
  if (!isRecord(value) || !hasOnlyKeys(value, catalogSchema.entryKeys) || typeof value.templateId !== "string" || !templateIdPattern.test(value.templateId)) return false;
  if (value.status !== "published" || value.technicalStatus !== "deployed") return false;
  if (typeof value.publishedAt !== "string" || Number.isNaN(Date.parse(value.publishedAt)) || new Date(value.publishedAt).toISOString() !== value.publishedAt) return false;
  if (typeof value.version !== "string" || !/^\d+\.\d+\.\d+$/.test(value.version)) return false;
  if (!catalogFamilies.some((family) => family === value.family) || !approvedCatalogFamilies.some((family) => family === value.family)) return false;
  if (typeof value.title !== "string" || !value.title.trim() || typeof value.description !== "string" || !value.description.trim()) return false;
  if (!isRecord(value.sector) || !hasOnlyKeys(value.sector, catalogSchema.sectorKeys) || value.sector.approved !== true || typeof value.sector.id !== "string" || !templateIdPattern.test(value.sector.id) || typeof value.sector.label !== "string" || !value.sector.label.trim()) return false;
  if (!Array.isArray(value.engines) || value.engines.length === 0 || value.engines.some((engine) => typeof engine !== "string" || !businessEngines.some((known) => known === engine)) || new Set(value.engines).size !== value.engines.length) return false;
  if (value.previewRoute !== `/demo/${value.templateId}`) return false;
  if (value.offerId !== undefined && (typeof value.offerId !== "string" || !value.offerId.trim())) return false;
  if (!isRecord(value.demo) || !hasOnlyKeys(value.demo, catalogSchema.demoKeys) || !isLocalTemplateMedia(value.demo.videoSrc, "/media/template-videos", value.templateId, [".mp4"]) || !isLocalTemplateMedia(value.demo.posterSrc, "/media/template-posters", value.templateId, [".webp"]) || typeof value.demo.alt !== "string" || !value.demo.alt.trim()) return false;
  if (value.demo.captionsSrc !== undefined && !isLocalTemplateMedia(value.demo.captionsSrc, "/media/template-captions", value.templateId, [".vtt"])) return false;
  const rights = value.demo.rights;
  if (!isRecord(rights) || !hasOnlyKeys(rights, catalogSchema.mediaRightsKeys) || typeof rights.owner !== "string" || !rights.owner.trim() || !audioRights.some((choice) => choice === rights.audio) || typeof rights.evidencePath !== "string" || !/^docs\/licenses\/[A-Za-z0-9._/-]+\.md$/.test(rights.evidencePath) || rights.evidencePath.split("/").includes("..")) return false;
  return true;
}

const catalog: unknown = rawCatalog;
const validPublishedEntries: TemplateCatalogEntry[] = Array.isArray(catalog)
  ? catalog.filter(isPublishedDemo)
  : [];

// A duplicate ID makes detail routes ambiguous, so hide every entry with that ID.
export const publishedDemos: TemplateCatalogEntry[] = excludeDuplicateTemplateIds(validPublishedEntries);
