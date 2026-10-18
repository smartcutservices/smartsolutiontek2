import type { Sector } from "./registry";

export type SectorSectionId = "overview" | "services" | "gallery" | "testimonials" | "contact" | "payments";
export type SectorSectionLabels = Record<SectorSectionId, string>;
export function getSectorSectionLabels(sector: Pick<Sector, "id" | "flow"> | null | undefined): SectorSectionLabels;
