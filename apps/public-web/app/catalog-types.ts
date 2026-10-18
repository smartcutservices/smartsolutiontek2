export const catalogFamilies = [
  "Inscription en ligne",
  "E-commerce",
  "Réservation en ligne",
  "Mini-boutique",
  "Site vitrine métier",
] as const;
export type CatalogFamily = (typeof catalogFamilies)[number];

export const approvedCatalogFamilies = ["Inscription en ligne", "E-commerce"] as const satisfies readonly CatalogFamily[];

export const businessEngines = ["forms", "registration", "commerce", "reservation", "restaurant", "content", "support"] as const;
export type BusinessEngine = (typeof businessEngines)[number];

export type CatalogStatus = "draft" | "published" | "archived";
export type TechnicalStatus = "draft" | "built" | "validated" | "deployed";

export type TemplateCatalogEntry = {
  templateId: string;
  version: string;
  family: CatalogFamily;
  sector: { id: string; label: string; approved: boolean };
  engines: BusinessEngine[];
  title: string;
  description: string;
  status: CatalogStatus;
  publishedAt: string;
  technicalStatus: TechnicalStatus;
  demo: {
    videoSrc: string;
    posterSrc: string;
    alt: string;
    captionsSrc?: string;
    rights: { owner: string; audio: "none" | "original" | "licensed"; evidencePath: string };
  };
  previewRoute: string;
  offerId?: string;
};
