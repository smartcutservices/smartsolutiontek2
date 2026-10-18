import type { Metadata } from "next";
import Link from "next/link";
import { TemplateGallery } from "../../features/sectors/TemplateGallery";
import { sectors } from "../../features/sectors/registry";

export const metadata: Metadata = {
  title: "Templates sectoriels | Smart Solutions Tech",
  description: `Choisissez un modèle parmi ${sectors.length} secteurs et modifiez-le directement dans son aperçu.`,
  alternates: { canonical: "/templates" },
  robots: { index: false, follow: false },
};

export default function TemplatesPage() {
  return (
    <main className="templates-page">
      <header className="sector-header">
        <Link href="/" className="sector-backlink">← Accueil</Link>
        <span className="sector-logo">SMART SOLUTIONS TECH</span>
      </header>
      <section className="templates-intro">
        <p className="sector-eyebrow">MODÈLES DE SITE</p>
        <h1>Choisissez un modèle, puis éditez-le directement.</h1>
        <p>Ouvrez un aperçu pour modifier son texte, ses images, son logo, ses liens et ses sections. Vos changements sont enregistrés dans ce navigateur.</p>
      </section>
      <TemplateGallery />
    </main>
  );
}
