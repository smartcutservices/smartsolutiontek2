import type { QuestionnaireSchema } from "../questionnaire/schema.mjs";
import { questionnaireFor } from "./questionnaire";
import { sectors, type Sector } from "./registry";
import { getSectorSectionLabels } from "./section-labels.mjs";

export type TemplateManifest = {
  templateId: string;
  version: string;
  sectorId: string;
  sectorName: string;
  title: string;
  categoryStatus: "candidate";
  renderer: "sector-preview";
  capabilities: readonly string[];
  questionnaire: { schemaId: string; schemaVersion: string; declaredQuestionCount: number };
  compatibility: { engineVersion: string };
  editableProperties: readonly string[];
  assets: readonly { assetId: string; path: string; licenseRef: string }[];
  preview: { route: string; status: "local-only" };
  technicalStatus: "draft";
  catalogStatus: "unpublished";
  missingForPublication: readonly string[];
};

const capabilitiesByFlow: Record<Sector["flow"], readonly string[]> = {
  order: ["catalog", "order-request"],
  booking: ["service-list", "booking-request"],
  application: ["information", "application-request"],
  content: ["content-sections", "navigation"],
  contact: ["business-information", "contact-request"],
};

const editableProperties = ["project-goal", "campaign-context", "redesign-focus", "site-name", "target-audience", "hero-copy", "primary-cta", "accept-customer-payments", "customer-payment-uses", "industry-focus", "sector-details", "sector-other-details", "action-details", "reuse-existing", "existing-site-url", "visual-style", "brand-color", "contact-channel", "contact-email", "contact-phone", "launch-timeline", "internal-notes", "included-sections"] as const;
const missingForPublication = ["approved-category", "production-renderer", "real-demo", "media-license", "business-engine", "responsive-qa", "publication-review"] as const;

export const templateManifests: TemplateManifest[] = sectors.map((sector) => {
  const schema: QuestionnaireSchema = questionnaireFor(sector);
  return {
    templateId: sector.id,
    version: "1.6.0",
    sectorId: sector.id,
    sectorName: sector.name,
    title: sector.template,
    categoryStatus: "candidate",
    renderer: "sector-preview",
    capabilities: capabilitiesByFlow[sector.flow],
    questionnaire: { schemaId: schema.schemaId, schemaVersion: schema.schemaVersion, declaredQuestionCount: schema.questions.length },
    compatibility: { engineVersion: "1.0.0" },
    editableProperties,
    assets: [],
    preview: { route: `/templates/${sector.id}`, status: "local-only" },
    technicalStatus: "draft",
    catalogStatus: "unpublished",
    missingForPublication,
  };
});

export function getTemplateManifest(templateId: string) {
  return templateManifests.find((manifest) => manifest.templateId === templateId);
}

/** Build-time checks for stable IDs and one versioned manifest per sector. */
export function validateTemplateManifestRegistry(): string[] {
  const errors: string[] = [];
  if (templateManifests.length !== 69) errors.push(`Expected 69 template manifests; found ${templateManifests.length}.`);
  const ids = new Set<string>();
  const sectorIds = new Set(sectors.map(({ id }) => id));
  for (const manifest of templateManifests) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.templateId)) errors.push(`Invalid template ID: ${manifest.templateId}.`);
    if (ids.has(manifest.templateId)) errors.push(`Duplicate template manifest ID: ${manifest.templateId}.`);
    ids.add(manifest.templateId);
    if (!sectorIds.has(manifest.sectorId) || manifest.sectorId !== manifest.templateId) errors.push(`Manifest sector mismatch: ${manifest.templateId}.`);
    const sector = sectors.find(({ id }) => id === manifest.sectorId);
    if (!sector || sector.name !== manifest.sectorName || sector.template !== manifest.title) errors.push(`Manifest metadata mismatch: ${manifest.templateId}.`);
    if (sector) {
      const labels = getSectorSectionLabels(sector);
      const sectionIds = ["overview", "services", "gallery", "testimonials", "contact", "payments"];
      if (Object.keys(labels).length !== sectionIds.length || sectionIds.some((sectionId) => typeof labels[sectionId as keyof typeof labels] !== "string" || !labels[sectionId as keyof typeof labels].trim())) {
        errors.push(`Incomplete or invalid section labels: ${manifest.templateId}.`);
      }
    }
    if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(manifest.version)) errors.push(`Invalid manifest version: ${manifest.templateId}.`);
    if (!manifest.questionnaire.schemaId.startsWith("sector-") || manifest.questionnaire.schemaVersion !== (manifest.templateId === "vehicles" ? "1.11.0" : manifest.templateId === "tourism" ? "1.10.0" : manifest.templateId === "hospitality" ? "1.9.0" : manifest.templateId === "real-estate" ? "1.8.0" : manifest.templateId === "ticketing" ? "1.7.0" : "1.6.0") || manifest.questionnaire.declaredQuestionCount !== (["vehicles", "tourism", "hospitality", "real-estate", "ticketing"].includes(manifest.templateId) ? 26 : 23)) errors.push(`Invalid questionnaire reference: ${manifest.templateId}.`);
    if (!manifest.preview.route.endsWith(`/${manifest.templateId}`) || manifest.preview.status !== "local-only") errors.push(`Invalid preview route/status: ${manifest.templateId}.`);
    if (manifest.technicalStatus !== "draft" || manifest.catalogStatus !== "unpublished" || manifest.assets.length !== 0) errors.push(`A local draft cannot claim publication readiness: ${manifest.templateId}.`);
  }
  for (const id of sectorIds) if (!ids.has(id)) errors.push(`Missing template manifest: ${id}.`);
  return errors;
}
