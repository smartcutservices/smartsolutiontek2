import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShareDemoButton } from "../../components/share-demo-button";
import { publishedDemos } from "../../catalog";
import { getIndexablePublicOrigin } from "../../seo";

async function findPublishedDemo(templateId: string) {
  return publishedDemos.find((entry) => entry.templateId === templateId);
}


export async function generateMetadata({ params }: { params: Promise<{ templateId: string }> }): Promise<Metadata> {
  const { templateId } = await params;
  const entry = await findPublishedDemo(templateId);
  if (!entry) {
    return { title: "Démo introuvable — Smart Solutions Tech", robots: { index: false, follow: false } };
  }

  const origin = getIndexablePublicOrigin();
  const canonical = origin ? `${origin}/demo/${entry.templateId}` : undefined;
  const title = `${entry.title} — démo vidéo | Smart Solutions Tech`;
  return {
    title,
    description: entry.description,
    robots: { index: Boolean(origin), follow: Boolean(origin) },
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      type: "website",
      title: `${entry.title} — démo vidéo`,
      description: entry.description,
      ...(canonical && origin ? {
        url: canonical,
        images: [{ url: new URL(entry.demo.posterSrc, `${origin}/`).toString(), alt: entry.demo.alt }],
      } : {}),
    },
  };
}
export default async function DemoPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  const entry = await findPublishedDemo(templateId);
  if (!entry) notFound();

  return (
    <main className="demo-page">
      <header className="demo-page-header">
        <Link href="/" className="demo-back">← Retour au catalogue</Link>
        <span className="demo-brand">SMART SOLUTIONS TECH</span>
      </header>
      <article className="demo-detail">
        <p className="feed-kicker">DÉMONSTRATION VIDÉO · {entry.sector.label}</p>
        <h1>{entry.title}</h1>
        <p className="demo-description">{entry.description}</p>
        <video className="demo-detail-video" src={entry.demo.videoSrc} poster={entry.demo.posterSrc} controls playsInline preload="none" aria-label={entry.demo.alt}>
          {entry.demo.captionsSrc ? <track kind="captions" src={entry.demo.captionsSrc} srcLang="fr" label="Français" /> : null}
        </video>
        <p className="demo-version">Modèle {entry.templateId} · version {entry.version}</p>
        <ShareDemoButton title={entry.title} description={entry.description} />
      </article>
    </main>
  );
}
