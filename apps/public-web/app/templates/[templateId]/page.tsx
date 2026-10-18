import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSector, sectors } from "../../../features/sectors/registry";
import { SectorTemplate } from "../../../features/sectors/sector-template";

type RouteProps = { params: Promise<{ templateId: string }> };

export function generateStaticParams() {
  if (sectors.length !== 69) throw new Error(`Expected 69 sector profiles; found ${sectors.length}.`);
  const ids = new Set<string>();
  for (const sector of sectors) {
    if (ids.has(sector.id)) throw new Error(`Duplicate sector template ID: ${sector.id}.`);
    ids.add(sector.id);
  }
  return sectors.map(({ id }) => ({ templateId: id }));
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { templateId } = await params;
  const sector = getSector(templateId);
  if (!sector) return { title: "Modèle introuvable" };
  const title = `${sector.template} | Smart Solutions Tech`;
  const description = sector.detail;
  return {
    title,
    description,
    alternates: { canonical: `/templates/${sector.id}` },
    openGraph: { type: "website", title, description },
    robots: { index: false, follow: false },
  };
}

export default async function TemplatePage({ params }: RouteProps) {
  const { templateId } = await params;
  const sector = getSector(templateId);
  if (!sector) notFound();
  return <SectorTemplate sector={sector} />;
}